/**
 * V3 release feed repository: reads from `feeds` and `feed_actors`.
 * Cursor and response shape mirror v2; pagination uses `feed_id` (descending).
 */
import { mysqlPool, logger } from "@mycompanyname/lib-common";
import {
  ActorTypes,
  AggregateTypes,
  EventTypes,
  FEED_TYPE_WHATS_NEW,
} from "../../../../catalog/activity-events/types/activity-events.constants";
import type {
  AlbumReleasedEventPayload,
  EpisodeReleasedEventPayload,
} from "../../../../catalog/activity-events/types/activity-events.payloads";
import type {
  ReleaseFeedOutput,
  QueryReleaseFeedInput,
  ReleaseFeedActor,
  ReleaseFeedItem,
  ReleaseFeedObject,
} from "./types/index";

export async function getReleaseFeeds(
  userId: string,
  query: QueryReleaseFeedInput
): Promise<ReleaseFeedOutput> {
  const { days, limit, cursor } = query;

  const cursorDecoded = decodeCursor(cursor?.trim() ?? "");
  const cursorCondition = cursorDecoded ? `AND fe.feed_id < ?` : "";
  const cursorParams = cursorDecoded ? [cursorDecoded.lastFeedId] : [];

  const sql = `
    WITH page_events AS (
      SELECT DISTINCT fe.feed_id,
                      fe.event_id,
                      fe.event_occurred_at,
                      fe.feed_verb,
                      fe.feed_object_id,
                      fe.feed_object_payload_json
      FROM likes l
      JOIN feed_actors fea
        ON fea.actor_id = l.entity_id
       AND fea.actor_type = l.entity_type
      JOIN feeds fe
        ON fe.event_id = fea.event_id
       AND fe.feed_type = fea.feed_type
      WHERE l.user_id = ?
        AND l.entity_type IN (?, ?)
        AND l.deleted_at IS NULL
        AND fe.feed_type = ?
        AND fe.feed_verb IN (?, ?)
        AND fe.event_occurred_at >= CURDATE() - INTERVAL ? DAY
        ${cursorCondition}
      ORDER BY fe.feed_id DESC
      LIMIT ?
    )
    SELECT pe.feed_id,
           pe.event_id,
           pe.event_occurred_at,
           pe.feed_verb,
           pe.feed_object_id,
           pe.feed_object_payload_json,
           fea.actor_id,
           fea.actor_name
    FROM page_events pe
    JOIN feed_actors fea
      ON fea.event_id = pe.event_id
     AND fea.feed_type = ?
    ORDER BY pe.feed_id DESC
  `;

  const params = [
    userId,
    ActorTypes.ARTIST,
    ActorTypes.SHOW,
    FEED_TYPE_WHATS_NEW,
    EventTypes.CATALOG_ALBUM_RELEASED,
    EventTypes.CATALOG_EPISODE_RELEASED,
    days,
    ...cursorParams,
    limit + 1,
    FEED_TYPE_WHATS_NEW,
  ];

  logger.debug(`getReleaseFeedsV3 - SQL`, {
    sql: sql.replace(/\s+/g, " ").trim(),
    params,
  });

  const [rows] = await mysqlPool.query(sql, params);
  const rowList = (rows as Record<string, unknown>[]) ?? [];

  type EventEntry = {
    feedId: string;
    eventId: string;
    eventTime: Date;
    eventType: string;
    aggregateId: string;
    payload: AlbumReleasedEventPayload | EpisodeReleasedEventPayload;
    actors: ReleaseFeedActor[];
  };

  const byEvent = new Map<string, EventEntry>();
  let hasMore = false;

  for (const r of rowList) {
    const eventId = String(r.event_id ?? "");
    const actorId = String(r.actor_id ?? "");
    const actorName = String(r.actor_name ?? "");
    const feedId = String(r.feed_id ?? "");

    let entry = byEvent.get(eventId);
    if (entry) {
      if (!entry.actors.some((a) => a.id === actorId)) {
        const actorType =
          entry.eventType === EventTypes.CATALOG_ALBUM_RELEASED
            ? ActorTypes.ARTIST
            : ActorTypes.SHOW;
        entry.actors.push({ type: actorType, id: actorId, name: actorName });
      }
      continue;
    }

    if (byEvent.size >= limit) {
      hasMore = true;
      continue;
    }

    const eventTime =
      r.event_occurred_at instanceof Date
        ? r.event_occurred_at
        : new Date(String(r.event_occurred_at));
    const eventType = String(r.feed_verb ?? "");
    const aggregateId = String(r.feed_object_id ?? "");
    const payload = parseReleasePayload(
      r.feed_object_payload_json,
      eventType,
      aggregateId,
      eventTime
    );
    const actorType =
      eventType === EventTypes.CATALOG_ALBUM_RELEASED
        ? ActorTypes.ARTIST
        : ActorTypes.SHOW;

    entry = {
      feedId,
      eventId,
      eventTime,
      eventType,
      aggregateId,
      payload,
      actors: [{ type: actorType, id: actorId, name: actorName }],
    };
    byEvent.set(eventId, entry);
  }

  const pageEntries = [...byEvent.entries()];

  const items: ReleaseFeedItem[] = pageEntries.map(([, e]) => {
    const feedObject =
      e.eventType === EventTypes.CATALOG_ALBUM_RELEASED
        ? buildAlbumFeedObject(e.payload as AlbumReleasedEventPayload, e.aggregateId)
        : buildEpisodeFeedObject(
            e.payload as EpisodeReleasedEventPayload,
            e.aggregateId
          );
    return toReleaseFeedItem(e.actors, e.eventTime, feedObject);
  });

  const lastEntry = pageEntries[pageEntries.length - 1];
  const nextCursor =
    hasMore && lastEntry
      ? encodeCursor(lastEntry[1].feedId)
      : undefined;

  return { items, cursor: nextCursor };
}

function parseReleasePayload(
  raw: unknown,
  eventType: string,
  aggregateId: string,
  eventTime: Date
): AlbumReleasedEventPayload | EpisodeReleasedEventPayload {
  try {
    const parsed = typeof raw === "string" ? JSON.parse(raw) : raw;
    return parsed as AlbumReleasedEventPayload | EpisodeReleasedEventPayload;
  } catch {
    if (eventType === EventTypes.CATALOG_ALBUM_RELEASED) {
      return {
        album: {
          id: aggregateId,
          title: "",
          imageUrl: null,
          albumType: "album",
        },
        releasedAt: eventTime,
        artists: [],
      };
    }
    return {
      episode: {
        id: aggregateId,
        title: "",
        imageUrl: null,
        durationMs: 0,
      },
      releasedAt: eventTime,
      show: { id: "", name: "" },
    };
  }
}

function toReleaseFeedItem(
  actors: ReleaseFeedActor[],
  eventTime: Date,
  feedObject: ReleaseFeedObject
): ReleaseFeedItem {
  return {
    feedActors: actors,
    feedVerb: "released",
    feedObject,
    occurredAt: eventTime.toISOString(),
  };
}

function buildAlbumFeedObject(
  payload: AlbumReleasedEventPayload,
  aggregateId: string
): ReleaseFeedObject {
  const album =
    payload.album ??
    ({
      id: aggregateId,
      title: "",
      imageUrl: null,
      albumType: "album" as const,
    } as AlbumReleasedEventPayload["album"]);
  return {
    type: AggregateTypes.ALBUM,
    id: album.id,
    title: album.title,
    imageUrl: album.imageUrl ?? "",
    albumType:
      (album.albumType as "album" | "single" | "compilation") ?? "album",
  };
}

function buildEpisodeFeedObject(
  payload: EpisodeReleasedEventPayload,
  aggregateId: string
): ReleaseFeedObject {
  const episode =
    payload.episode ??
    ({
      id: aggregateId,
      title: "",
      imageUrl: null,
      durationMs: 0,
    } as EpisodeReleasedEventPayload["episode"]);
  return {
    type: AggregateTypes.EPISODE,
    id: episode.id,
    title: episode.title,
    imageUrl: episode.imageUrl ?? "",
    episodeDurationMs: episode.durationMs,
  };
}

interface Cursor {
  lastFeedId: string;
}

function encodeCursor(lastFeedId: string): string {
  return Buffer.from(
    JSON.stringify({ lastFeedId }),
    "utf-8"
  ).toString("base64url");
}

function decodeCursor(cursor: string): Cursor | null {
  if (!cursor?.trim()) return null;
  try {
    const parsed = JSON.parse(
      Buffer.from(cursor, "base64url").toString("utf-8")
    ) as Record<string, unknown>;
    if (typeof parsed.lastFeedId === "string" && parsed.lastFeedId.trim()) {
      return { lastFeedId: parsed.lastFeedId.trim() };
    }
  } catch {
    /* invalid */
  }
  return null;
}
