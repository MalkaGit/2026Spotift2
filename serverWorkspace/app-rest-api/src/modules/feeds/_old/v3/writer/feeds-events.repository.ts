import { logger, type MySqlConnection } from "@mycompanyname/lib-common";
import type { AddFeedEventInput } from "./types/add.feed.event.input.model";
import type {
  AddFeedEventActorsInput,
  FeedEventActor,
} from "./types/add.feed.event.actors.input.model";

const LOG_SCOPE = "feed.feed-events";

/**
 * Insert any kind of feed row into `feeds`.
 * - Generic, does not depend on specific event type beyond the mapped columns.
 * - Can be used inside an existing transaction via the provided connection.
 */
export async function insertFeedEvent<TEventPayload>(
  conn: MySqlConnection,
  event: AddFeedEventInput<TEventPayload>
): Promise<void> {
  const payloadJson = JSON.stringify(event.eventPayload);

  const sql = `
    INSERT INTO feeds (
      event_id,
      event_occurred_at,
      feed_type,
      feed_verb,
      feed_object_type,
      feed_object_id,
      feed_object_title,
      feed_object_sub_title,
      feed_object_image_url,
      feed_object_payload_json
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  const params = [
    event.eventId,
    event.eventOccurredAt,
    event.feedType,
    event.feedVerb,
    event.feedObjectType,
    event.feedObjectId,
    event.feedObjectTitle,
    event.feedObjectSubTitle,
    event.feedObjectImageUrl,
    payloadJson,
  ];

  logger.debug(`${LOG_SCOPE}.insertFeedEvent - insert feeds`, {
    sql: sql.replace(/\s+/g, " ").trim(),
    params,
  });

  await conn.query(sql, params);
}

/**
 * Insert actor rows for a given feed event into `feed_actors`.
 * - Executes a single statement that inserts several rows.
 */
export async function insertFeedEventActors(
  conn: MySqlConnection,
  input: AddFeedEventActorsInput
): Promise<void> {
  if (input.actors.length === 0) return;

  const valuesPlaceholders = input.actors.map(() => "(?, ?, ?, ?, ?, ?)").join(", ");
  const sql = `
    INSERT INTO feed_actors (
      event_id,
      feed_type,
      actor_type,
      actor_id,
      actor_name,
      actor_image_url
    )
    VALUES ${valuesPlaceholders}
  `;

  const params = input.actors.flatMap((actor: FeedEventActor) => [
    input.eventId,
    input.feedType,
    actor.actorType,
    actor.actorId,
    actor.actorName,
    actor.actorImageUrl ?? null,
  ]);

  logger.debug(`${LOG_SCOPE}.insertFeedEventActors - insert feed_actors`, {
    sql: sql.replace(/\s+/g, " ").trim(),
    params,
  });

  await conn.query(sql, params);
}
