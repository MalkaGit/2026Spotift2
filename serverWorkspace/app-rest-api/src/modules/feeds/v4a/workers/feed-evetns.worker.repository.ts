import { mysqlPool, type MySqlConnection } from "@mycompanyname/lib-common";
import type { UpsertFeedEventItem } from "./types/upsert.FeedEventItem.model.js";
import type { UpsertFeedEventActorItem } from "./types/upsert.FeedEventActorItem.model.js";


/**
 * reads the last sequence number from the worker offset table
 * @param workerName - name of the worker (eg, "feeds-worker")
 * @param streamName - name of the stream (eg, "catalog", "player", "social")
 * @returns 
 */
export async function getWorkerOffset(
  workerName: string,
  streamName: string
): Promise<number | null> {
  const [rows] = await mysqlPool.query(
    `SELECT last_sequence_no
     FROM feed_worker_offset
     WHERE worker_name = ?
       AND stream_name = ?
     LIMIT 1`,
    [workerName, streamName]
  );
  const list = rows as Array<{ last_sequence_no: number | null }>;
  if (list.length === 0) return null;
  return list[0].last_sequence_no != null
    ? Number(list[0].last_sequence_no)
    : null;
}

/** 
 * upserts the worker offset into the worker offset table
 * @param connection - the database connection
 * @param workerName - name of the worker (eg, "feeds-worker")
 * @param streamName - name of the stream (eg, "catalog", "player", "social")
 * @param lastSequenceNo - the last sequence number
 * @returns 
 */
export async function upsertWorkerOffsetWithConnection(
  connection: MySqlConnection,
  workerName: string,
  streamName: string,
  lastSequenceNo: number
): Promise<void> {
  await connection.query(
    `INSERT INTO feed_worker_offset (worker_name, stream_name, last_sequence_no, updated_at)
     VALUES (?, ?, ?, CURRENT_TIMESTAMP)
     ON DUPLICATE KEY UPDATE
       last_sequence_no = VALUES(last_sequence_no),
       updated_at = CURRENT_TIMESTAMP`,
    [workerName, streamName, lastSequenceNo]
  );
}

/**
 * Upsert `feeds` from activity events (projection).
 * Idempotent via UNIQUE (event_id, feed_type).
 */
export async function upsertFeedEvents(
  connection: MySqlConnection, 
  items: UpsertFeedEventItem[]
): Promise<void> {
  if (items.length === 0) return;
  const placeholders = items
    .map(() => "(?, ?, ?, ?, ?, ?, ?, ?, ?, ?)")
    .join(", ");
  const params = items.flatMap((item) => [
    item.event_id,
    item.event_occurred_at,
    item.feed_type,
    item.feed_verb,
    item.feed_object_type,
    item.feed_object_id,
    item.feed_object_title,
    item.feed_object_sub_title,
    item.feed_object_image_url,
    item.feed_object_payload_json,
  ]);

  await connection.query(
    `INSERT INTO feeds (
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
     VALUES ${placeholders}
     ON DUPLICATE KEY UPDATE
       event_occurred_at = VALUES(event_occurred_at),
       feed_verb = VALUES(feed_verb),
       feed_object_type = VALUES(feed_object_type),
       feed_object_id = VALUES(feed_object_id),
       feed_object_title = VALUES(feed_object_title),
       feed_object_sub_title = VALUES(feed_object_sub_title),
       feed_object_image_url = VALUES(feed_object_image_url),
       feed_object_payload_json = VALUES(feed_object_payload_json)`,
    params
  );
}

/**
 * Upsert `feed_actors` from activity_event_actors (projection).
 * Idempotent via PRIMARY KEY (event_id, feed_type, actor_id).
 */
export async function upsertFeedEventActors(
  connection: MySqlConnection,
  actors: UpsertFeedEventActorItem[]
): Promise<void> {
  if (actors.length === 0) return;
  const placeholders = actors.map(() => "(?, ?, ?, ?, ?, ?)").join(", ");
  const params = actors.flatMap((a) => [
    a.event_id,
    a.feed_type,
    a.actor_type,
    a.actor_id,
    a.actor_name,
    a.actor_image_url,
  ]);
  await connection.query(
    `INSERT INTO feed_actors (
       event_id,
       feed_type,
       actor_type,
       actor_id,
       actor_name,
       actor_image_url
     )
     VALUES ${placeholders}
     ON DUPLICATE KEY UPDATE
       actor_type = VALUES(actor_type),
       actor_name = VALUES(actor_name),
       actor_image_url = VALUES(actor_image_url)`,
    params
  );
}
