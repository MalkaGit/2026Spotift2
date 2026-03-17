/**
 * V4a release feed repository.
 *
 * Reads from feed_events and feed_event_actors, which are maintained
 * by feeds v4a workers based on the shared activity_events log.
 * Cursor and response shape mirror v3, but all types and code are
 * scoped to v4a.
 */
import { mysqlPool, logger } from "@mycompanyname/lib-common";
import {
  ACTOR_TYPE_ARTIST,
  ACTOR_TYPE_SHOW,
  AGGREGATE_TYPE_ALBUM,
  AGGREGATE_TYPE_EPISODE,
  DOMAIN_CATALOG,
  EVENT_TYPE_ALBUM_RELEASED,
  EVENT_TYPE_EPISODE_RELEASED,
} from "../../../catalog/_events/catalog.events.constants";
import type {
  AlbumReleasedEventPayload,
  EpisodeReleasedEventPayload,
} from "../../../catalog/_events/catalog.events.payloads";
import type {
  ReleaseFeedOutput,
  QueryReleaseFeedInput,
  ReleaseFeedActor,
  ReleaseFeedItem,
  ReleaseFeedObject,
} from "./types";

export async function getReleaseFeeds(
  userId: string,
  query: QueryReleaseFeedInput
): Promise<ReleaseFeedOutput> {
  const { days, limit, cursor } = query;

  const cursorDecoded = decodeCursor(cursor?.trim() ?? "");
  const cursorCondition = cursorDecoded
    ? `AND (fe.event_time < ? OR (fe.event_time = ? AND fe.event_id > ?))`
    : "";
  const cursorParams = cursorDecoded
    ? [cursorDecoded.eventTime, cursorDecoded.eventTime, cursorDecoded.eventId]
    : [];

  const sql = `
    WITH page_events AS (
      SELECT DISTINCT fe.event_id,
                      fe.event_time,
                      fe.event_type,
                      fe.aggregate_id,
                      fe.event_payload_json
      FROM likes l
      JOIN feed_event_actors fea
        ON fea.actor_id = l.entity_id
       AND fea.actor_type = l.entity_type
      JOIN feed_events fe
        ON fe.event_id = fea.event_id
      WHERE l.user_id = ?
        AND l.entity_type IN (?, ?)
        AND l.deleted_at IS NULL
        AND fe.event_domain = ?
        AND fe.event_type IN (?, ?)
        AND fe.event_time >= CURDATE() - INTERVAL ? DAY
        ${cursorCondition}
      ORDER BY fe.event_time DESC, fe.event_id ASC
      LIMIT ?
    )
    SELECT pe.event_id,
           pe.event_time,
           pe.event_type,
           pe.aggregate_id,
           pe.event_payload_json,
           fea.actor_id,
           fea.actor_name
    FROM page_events pe
    JOIN feed_event_actors fea ON fea.event_id = pe.event_id
    ORDER BY pe.event_time DESC, pe.event_id ASC
  `;

  const params = [
    userId,
    ACTOR_TYPE_ARTIST,
    ACTOR_TYPE_SHOW,
    DOMAIN_CATALOG,
    EVENT_TYPE_ALBUM_RELEASED,
    EVENT_TYPE_EPISODE_RELEASED,
    days,
    ...cursorParams,
    limit + 1,
  ];

  logger.debug(`getReleaseFeedsV4a - SQL`, {
    sql: sql.replace(/\s+/g, " ").trim(),
    params,
  });

  const [rows] = await mysqlPool.query(sql, params);
  const rowList = (rows as Record<string, unknown>[]) ?? [];

  type EventEntry = {
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

    let entry = byEvent.get(eventId);
    if (entry) {
      if (!entry.actors.some((a) => a.id === actorId)) {
        const actorType =
          entry.eventType === EVENT_TYPE_ALBUM_RELEASED
            ? ACTOR_TYPE_ARTIST
            : ACTOR_TYPE_SHOW;
        entry.actors.push({ type: actorType, id: actorId, name: actorName });
      }
      continue;
    }

    if (byEvent.size >= limit) {
      hasMore = true;
      continue;
    }

    const eventTime =
      r.event_time instanceof Date
        ? r.event_time
        : new Date(String(r.event_time));
    const eventType = String(r.event_type ?? "");
    const aggregateId = String(r.aggregate_id ?? "");
    const payload = parseReleasePayload(
      r.event_payload_json,
      eventType,
      aggregateId,
      eventTime
    );
    const actorType =
      eventType === EVENT_TYPE_ALBUM_RELEASED
        ? ACTOR_TYPE_ARTIST
        : ACTOR_TYPE_SHOW;

    entry = {
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
      e.eventType === EVENT_TYPE_ALBUM_RELEASED
        ? buildAlbumFeedObject(
            e.payload as AlbumReleasedEventPayload,
            e.aggregateId
          )
        : buildEpisodeFeedObject(
            e.payload as EpisodeReleasedEventPayload,
            e.aggregateId
          );
    return toReleaseFeedItem(e.actors, e.eventTime, feedObject);
  });

  const lastEntry = pageEntries[pageEntries.length - 1];
  const nextCursor =
    hasMore && lastEntry
      ? encodeCursor(lastEntry[1].eventTime.toISOString(), lastEntry[1].eventId)
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
    if (eventType === EVENT_TYPE_ALBUM_RELEASED) {
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
    type: AGGREGATE_TYPE_ALBUM,
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
    type: AGGREGATE_TYPE_EPISODE,
    id: episode.id,
    title: episode.title,
    imageUrl: episode.imageUrl ?? "",
    episodeDurationMs: episode.durationMs,
  };
}

interface CursorV4a {
  eventTime: string;
  eventId: string;
}

function encodeCursor(eventTime: string, eventId: string): string {
  return Buffer.from(
    JSON.stringify({ eventTime, eventId } as CursorV4a),
    "utf-8"
  ).toString("base64url");
}

function decodeCursor(cursor: string): CursorV4a | null {
  if (!cursor?.trim()) return null;
  try {
    const parsed = JSON.parse(
      Buffer.from(cursor, "base64url").toString("utf-8")
    ) as Record<string, unknown>;
    if (
      typeof parsed.eventTime === "string" &&
      typeof parsed.eventId === "string"
    ) {
      return { eventTime: parsed.eventTime, eventId: parsed.eventId };
    }
  } catch {
    /* invalid */
  }
  return null;
}

