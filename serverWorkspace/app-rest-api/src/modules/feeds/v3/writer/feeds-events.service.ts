import type { MySqlConnection } from "@mycompanyname/lib-common";
/**
 * Feed events service: write path for feed projection tables.
 * Orchestrates insert of album release events. Called by albums.service (later: worker/consumer).
 *
 * This mirrors activityEvents.service: services are event-specific,
 * repositories stay generic.
 */
import {
  insertFeedEvent,
  insertFeedEventActors,
} from "./feeds-events.repository";
import {
  DOMAIN_CATALOG,
  EVENT_TYPE_ALBUM_RELEASED,
  AGGREGATE_TYPE_ALBUM,
  ACTOR_TYPE_ARTIST,
} from "../../../catalog/activity-events/types/catalog.activity-events.constants";
import type { AlbumReleasedEventPayload } from "../../../catalog/activity-events/types/catalog.activity-events.payloads";




/**
 * feed events service.
 * This service acts as an adapter layer that translates selected domain events
 * into the shared feeds log schema.
 *
 * Flow:
 * 1. Receive domain-specific input.
 * 2. Map it into rows for `feed_events` and `feed_event_actors`.
 * 3. Persist both rows using the repository layer.
 *
 * 
 * Design notes:
 * 1. seperation of concerns
 *     In this design, this mapping logic (from event payload to activity-events and activity-event-actors)
 *    is kept out of `albumService`.
 *    `albumService` stays focused on album business rules, 
 *    while the geeds  module owns writing events into the feeds projection tables.
 *

 * 2. The `conn` parameter
       is passed in so this method can participate in the
 *    caller's transaction. For example, inserting into `feeds_events` and
 *    `feed_event_actors` should usually happen atomically.
 *
 * 
 * 3. The `eventId` parameter
 *    For the current version, either design could work:
 *    - Option 1: generate `eventId` inside this method
 *    - Option 2: receive `eventId` from the caller
 *
 *    We choose option 2 because we can reuse that api later on we we move to message queues.
 *   
 *    In this version, 
 *    the writer domain (album-released)
 *         write to the writer domain (album table)
 *         and calls feedEventService to write to feeds domain
 *    Later on, when we move to message queues, the writer domain (album-released) will
 *         etite to the writer domain as before
 *         but will also publish the event (with event id) to the queue.
 *         The example future event message:
 *        {
 *          eventId: "123",
 *          eventType: "album_released",
 *          eventTime: "2026-03-15T10:00:00Z",
 *          eventPayload: { album: { id: "123", name: "Album 1" } }
 *        }
 * 
 *        Each reader domain (analytics, feeds, notifications, etc.)
 *         can then have its own consumer that reads the message (eg, in bulks)
 *         and writes to its own projection tables
 *        (eg, analytics module reading te messages and writing to stat projection tables
 *         eg, feeds module reading the messages and writing to feed projection tables
 *         eg, activity events module reading the messages and writing to activity events tables
 *         eg, search module reading the messages and writing to search_index tables
 * 
 *         In that model, the published event message will already contain `eventId`,
 *         and consumers can use it for idempotency, deduplication, tracing, or replay.
 * 
 * 
 * 4. Envelope fields such as `aggregateId` and `eventTime` are derived from
 *    the payload (`payload.album.id`, `payload.releasedAt`) because this method
 *    is already coupled to `AlbumReleasedEventPayload`.
 */
export async function insertAlbumReleaseEvent(
  conn: MySqlConnection,
  eventId: string,
  payload: AlbumReleasedEventPayload
): Promise<void> {
  await insertFeedEvent(conn, {
    eventId,
    eventTime: payload.releasedAt,
    eventDomain: DOMAIN_CATALOG,
    eventType: EVENT_TYPE_ALBUM_RELEASED,
    aggregateType: AGGREGATE_TYPE_ALBUM,
    aggregateId: payload.album.id,
    eventPayload: payload,
  });

  await insertFeedEventActors(conn, {
    eventId,
    actors: payload.artists.map((artist) => ({
      actorType: ACTOR_TYPE_ARTIST,
      actorId: artist.id,
      actorName: artist.name,
    })),
  });
}
