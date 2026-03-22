/**
 * V2 release feed repository: reads from aev4a activity_events and activity_event_actors.
 * No code shared with v1; cursor is (event_time, event_id).
 * Supports both album releases (artist) and episode releases (show); improved over v1 which was album-only.
 */
import { mysqlPool, logger } from "@mycompanyname/lib-common";
import {
  ActorTypes,
  AggregateTypes,
  EventTypes,
} from "../../../../catalog/activity-events/types/activity-events.constants";
import type {
  AlbumReleasedEventPayload,
  EpisodeReleasedEventPayload,
} from "../../../../catalog/activity-events/types/activity-events.payloads";
import type {
  ReleaseFeedOutput,
  QueryReleaseFeedInput,
} from "./types";
import {
  ReleaseFeedActor,
  ReleaseFeedItem,
  ReleaseFeedObject,
} from "./types/query.release.feed.output.model";

/**
 * Returns the release feed for the user (albums and episodes from liked artists/shows).
 *
 * Paging: cursor-based. Client sends no cursor for the first page; for the next page it sends
 * the cursor returned in the previous response (base64url JSON { eventTime, eventId }). We select
 * only rows that come "after" the cursor in the sort order, then take limit+1 to detect hasMore.
 *
 * Order: ORDER BY event_time DESC, event_id ASC (newest events first; same time tie-break by event_id).
 * The cursor condition below is chosen so "after" means: event_time < cursorTime, or same time and event_id > cursorEventId.
 */
export async function getReleaseFeeds(
  userId: string,
  query: QueryReleaseFeedInput
): Promise<ReleaseFeedOutput> {
  const { days, limit, cursor } = query;

  const cursorDecoded = decodeCursor(cursor?.trim() ?? "");
  /*
   * Cursor condition must match ORDER BY (event_time DESC, event_id ASC).
   * "Next page" = rows after the cursor in that order: either event_time < cursor (older)
   * or same event_time and event_id > cursor (tie-break is ASC, so "after" means larger id).
   */
  const cursorCondition = cursorDecoded
    ? `AND (ae.event_occurred_at < ? OR (ae.event_occurred_at = ? AND ae.event_id > ?))`
    : "";
  const cursorParams = cursorDecoded
    ? [cursorDecoded.eventTime, cursorDecoded.eventTime, cursorDecoded.eventId]
    : [];

  /*
   * Release feed joins: likes (what the user follows) with activity_event_actors (who is on the event).
   * Join by both id and type: likes.entity_id = actor_id AND likes.entity_type = actor_type
   * (artist like → artist actor, show like → show actor). Restrict to entity_type IN (artist, show).
   */
  const sql = `
    WITH page_events AS (
      SELECT DISTINCT ae.event_id, ae.event_occurred_at AS event_time, ae.event_type, ae.aggregate_id, ae.event_payload_json
      FROM likes l
      JOIN activity_event_actors aea ON aea.actor_id = l.entity_id AND aea.actor_type = l.entity_type
      JOIN activity_events ae ON ae.event_id = aea.event_id
      WHERE l.user_id = ?
        AND l.entity_type IN (?, ?)
        AND l.deleted_at IS NULL
        AND ae.event_type IN (?, ?)
        AND ae.event_occurred_at >= CURDATE() - INTERVAL ? DAY
        ${cursorCondition}
      ORDER BY ae.event_occurred_at DESC, ae.event_id ASC
      LIMIT ?
    )
    SELECT pe.event_id, pe.event_time, pe.event_type, pe.aggregate_id, pe.event_payload_json, aea.actor_id, aea.actor_name
    FROM page_events pe
    JOIN activity_event_actors aea ON aea.event_id = pe.event_id
    ORDER BY pe.event_time DESC, pe.event_id ASC
  `;
  const params = [
    userId,
    ActorTypes.ARTIST,
    ActorTypes.SHOW,
    EventTypes.CATALOG_ALBUM_RELEASED,
    EventTypes.CATALOG_EPISODE_RELEASED,
    days,
    ...cursorParams,
    limit + 1,
  ];

  logger.debug(`getReleaseFeedsV2 - SQL`, {
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
          entry.eventType === EventTypes.CATALOG_ALBUM_RELEASED
            ? ActorTypes.ARTIST
            : ActorTypes.SHOW;
        entry.actors.push({ type: actorType, id: actorId, name: actorName });
      }
      continue;
    }
    // New event: only store if we're under limit; otherwise just mark hasMore and skip.
    if (byEvent.size >= limit) {
      hasMore = true;
      continue;
    }
    const eventTime = r.event_time instanceof Date ? r.event_time : new Date(String(r.event_time));
    const eventType = String(r.event_type ?? "");
    const aggregateId = String(r.aggregate_id ?? "");
    const payload = parseReleasePayload(r.event_payload_json, eventType, aggregateId, eventTime);
    const actorType =
      eventType === EventTypes.CATALOG_ALBUM_RELEASED
        ? ActorTypes.ARTIST
        : ActorTypes.SHOW;
    entry = { eventId, eventTime, eventType, aggregateId, payload, actors: [{ type: actorType, id: actorId, name: actorName }] };
    byEvent.set(eventId, entry);
  }

  // Order = insertion order = first-seen in rowList = SQL ORDER BY (event_time DESC, event_id ASC).
  const pageEntries = [...byEvent.entries()];

  const items: ReleaseFeedItem[] = pageEntries.map(([, e]) => {
    const feedObject =
      e.eventType === EventTypes.CATALOG_ALBUM_RELEASED
        ? buildAlbumFeedObject(e.payload as AlbumReleasedEventPayload, e.aggregateId)
        : buildEpisodeFeedObject(e.payload as EpisodeReleasedEventPayload, e.aggregateId);
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
    if (eventType === EventTypes.CATALOG_ALBUM_RELEASED) {
      return {
        album: { id: aggregateId, title: "", imageUrl: null, albumType: "album" },
        releasedAt: eventTime,
        artists: [],
      };
    }
    return {
      episode: { id: aggregateId, title: "", imageUrl: null, durationMs: 0 },
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
  const album = payload.album ?? { id: aggregateId, title: "", imageUrl: null, albumType: "album" as const };
  return {
    type: AggregateTypes.ALBUM,
    id: album.id,
    title: album.title,
    imageUrl: album.imageUrl ?? "",
    albumType: (album.albumType as "album" | "single" | "compilation") ?? "album",
  };
}

function buildEpisodeFeedObject(
  payload: EpisodeReleasedEventPayload,
  aggregateId: string
): ReleaseFeedObject {
  const episode = payload.episode ?? { id: aggregateId, title: "", imageUrl: null, durationMs: 0 };
  return {
    type: AggregateTypes.EPISODE,
    id: episode.id,
    title: episode.title,
    imageUrl: episode.imageUrl ?? "",
    episodeDurationMs: episode.durationMs,
  };
}

interface Cursor {
  eventTime: string;
  eventId: string;
}

function encodeCursor(eventTime: string, eventId: string): string {
  return Buffer.from(
    JSON.stringify({ eventTime, eventId }),
    "utf-8"
  ).toString("base64url");
}

function decodeCursor(cursor: string): Cursor | null {
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

