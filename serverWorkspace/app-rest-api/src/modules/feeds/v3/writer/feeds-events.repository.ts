import { logger, mysqlPool, type MySqlConnection } from "@mycompanyname/lib-common";
import type { AddFeedEventInput } from "./types/add.feed.event.input.model";
import type {
  AddFeedEventActorsInput,
  FeedEventActor,
} from "./types/add.feed.event.actors.input.model";

const LOG_SCOPE = "feed.feed-events";

/**
 * Insert any kind of feed event into feed_events.
 * - Generic, does not depend on specific event type or payload.
 * - Can be used inside an existing transaction via the provided connection.
 */
export async function insertFeedEvent<TEventPayload>(
  conn: MySqlConnection,
  event: AddFeedEventInput<TEventPayload>
): Promise<void> {
  const payloadJson = JSON.stringify(event.eventPayload);

  const sql = `
    INSERT INTO feed_events (
      event_id,
      event_time,
      event_domain,
      event_type,
      aggregate_type,
      aggregate_id,
      event_payload_json
    )
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `;

  const params = [
    event.eventId,
    event.eventTime,
    event.eventDomain,
    event.eventType,
    event.aggregateType,
    event.aggregateId,
    payloadJson,
  ];

  logger.debug(`${LOG_SCOPE}.insertFeedEvent - insert feed_events`, {
    sql: sql.replace(/\s+/g, " ").trim(),
    params,
  });

  await conn.query(sql, params);
}

/**
 * Insert actor rows for a given event into feed_event_actors.
 * - Generic, does not depend on specific event type.
 * - Executes a single statement that inserts several rows.
 */
export async function insertFeedEventActors(
  conn: MySqlConnection,
  input: AddFeedEventActorsInput
): Promise<void> {
  if (input.actors.length === 0) return;

  const valuesPlaceholders = input.actors.map(() => "(?, ?, ?, ?)").join(", ");
  const sql = `
    INSERT INTO feed_event_actors (
      event_id,
      actor_type,
      actor_id,
      actor_name
    )
    VALUES ${valuesPlaceholders}
  `;

  const params = input.actors.flatMap((actor) => [
    input.eventId,
    actor.actorType,
    actor.actorId,
    actor.actorName,
  ]);

  logger.debug(`${LOG_SCOPE}.insertFeedEventActors - insert feed_event_actors`, {
    sql: sql.replace(/\s+/g, " ").trim(),
    params,
  });

  await conn.query(sql, params);
}
