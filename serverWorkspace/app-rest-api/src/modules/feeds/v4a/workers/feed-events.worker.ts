/**
 * Feed-events worker.
 * -Reads activity events from two input streams:
 * catalog stream (from catalog domain) and social stream (from social domain)
 * -projects activity events into `feeds` / `feed_actors`, 
 * -tracks progress using feed_worker_offset table.
 *
 * Notes:
 * Scheduling: like analytics v3, run with setTimeout so no overlapping ticks.
 * Write:      projection + checkpoint update in one transaction for exactly-once processing.
 */
import { logger, mysqlPool, type MySqlConnection } from "@mycompanyname/lib-common";
import { getWorkerConfig } from "./common/worker.config.js";
import type { WorkerConfig } from "./types/worker.types.js";
import {
  EventTypes,
  FEED_TYPE_WHATS_NEW,
} from "../../../catalog/activity-events/types/activity-events.constants.js";
import type { UpsertFeedEventItem } from "./types/upsert.FeedEventItem.model.js";
import type { UpsertFeedEventActorItem } from "./types/upsert.FeedEventActorItem.model.js";
import * as activityEventsRepo from "../../../../infrastructure/activity-events/activity-events.repository.js";
import {
  ACTIVITY_EVENTS_TABLE_NAMES,
  ACTIVITY_EVENT_ACTORS_TABLE_NAMES,
} from "../../../../infrastructure/activity-events/types/activity-events.table-names.js";
import * as feedWorkerRepository from "./feed-evetns.worker.repository.js";

const WORKER_NAME = "feeds-worker";
const SOURCE_STREAM = "activity_events";
let isWorkerRunning = false;

export function start(config?: Partial<WorkerConfig>): void {
  //return if worker is already running
  if (isWorkerRunning) {
    logger.warn("feeds-worker start ignored: already running");
    return;
  }
  isWorkerRunning = true;

  //get the worker config
  const baseConfig = getWorkerConfig();
  const effectiveConfig: WorkerConfig = { ...baseConfig, ...config };
  const { intervalMs, firstRunDelayMs } = effectiveConfig;
  
  //define the run loop
  const runLoop = async () => {
    try {
      await processIncrementalBatch(effectiveConfig);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      logger.error("feeds v4a worker tick failed", { error: message });
    }
    if (isWorkerRunning) {
      setTimeout(runLoop, intervalMs);
    }
  };

  //start the worker
  logger.info("feeds v4a worker starting", {
    intervalMs,
    firstRunDelayMs,
  });
  setTimeout(runLoop, firstRunDelayMs);
}


/**
 * Process an incremental batch of activity events from a given stream.
 * @param config 
 * @param streamName 
 * @returns 
 * Important: idempotent writes
    We should not process the same event twice.
    Meaning, we should not write the same event to the projection tables twice.
    Normally, it will not happen because we use a transaction while writing
    both projection tables and the worker offset table.
    However, replay/rebuild/recovery scenarios may run through other paths
    that are not covered by the same transaction boundary.
    So we use upsert (not plain insert) for idempotency:
    if an event already exists in projection tables, the row is updated.
 */
async function processIncrementalBatch(
  config: WorkerConfig
): Promise<void> {
  const { batchSize } = config;

  const lastSequenceNo: number = (await feedWorkerRepository.getWorkerOffset(WORKER_NAME, SOURCE_STREAM)) ?? 0;   // On first run (no checkpoint row yet), start from 0.
  
  // fetch activity events from the stream
  const fetchedActivityEvents = await activityEventsRepo.getActivityEventsAfterSequence(
    ACTIVITY_EVENTS_TABLE_NAMES.activity_events,
    lastSequenceNo,
    batchSize
  );
  if (fetchedActivityEvents.length === 0) return;

  // filter fetched events by event type
  const projectionEventTypes: Set<string> = new Set([ // relevant types to process
    EventTypes.CATALOG_ALBUM_RELEASED,
    EventTypes.CATALOG_EPISODE_RELEASED,
  ]);
  const projectionActivityEvents = fetchedActivityEvents.filter((e) => // we read all events by domain, now filter by type
    projectionEventTypes.has(e.event_type)
  );

  //get acttors for the projected events
  const projectionEventIds : string[] = projectionActivityEvents.map((e) => e.event_id);
  const actors =
    projectionEventIds.length > 0
      ? await activityEventsRepo.getActorsForEventIds(
          ACTIVITY_EVENT_ACTORS_TABLE_NAMES.activity_event_actors,
          projectionEventIds
        )
      : [];

  // map batch events to projection items (`feeds` rows)
  const projectionFeedEventItems: UpsertFeedEventItem[] =
    projectionActivityEvents.map((e) => mapActivityEventToUpsertFeedItem(e));

  const feedActors: UpsertFeedEventActorItem[] = actors.map((a) => ({
    event_id: a.event_id,
    feed_type: FEED_TYPE_WHATS_NEW,
    actor_type: a.actor_type,
    actor_id: a.actor_id,
    actor_name: a.actor_name,
    actor_image_url: null,
  }));

  //update tables in a transaction (and upsert for idempotency)
  let connection: MySqlConnection | undefined;
  try {
    connection = await mysqlPool.getConnection();
    await connection.beginTransaction();

    // update projection tables
    await feedWorkerRepository.upsertFeedEvents(connection, projectionFeedEventItems);
    await feedWorkerRepository.upsertFeedEventActors(connection, feedActors);

    // update worker-stream offset 
    // Even if this batch contained only non-matching event_types, we still consumed those activity events from the stream.
    const lastFetchedEvent = fetchedActivityEvents[fetchedActivityEvents.length - 1];
    await feedWorkerRepository.upsertWorkerOffsetWithConnection(
      connection,
      WORKER_NAME,
      SOURCE_STREAM,
      lastFetchedEvent.sequence_no
    );

    await connection.commit();

    logger.debug("feeds v4a batch applied", {
      streamName: SOURCE_STREAM,
      fetchedEventCount: fetchedActivityEvents.length,
      projectedEventCount: projectionActivityEvents.length,
      lastFetchedEventId: lastFetchedEvent.event_id,
      lastFetchedEventTime: lastFetchedEvent.event_occurred_at.toISOString(),
    });
  } catch (err) {
    if (connection) {
      try {
        await connection.rollback();
      } catch (rollbackErr) {
        logger.error("feeds v4a rollback failed", {
          error:
            rollbackErr instanceof Error ? rollbackErr.message : String(rollbackErr),
        });
      }
    }
    throw err;
  } finally {
    connection?.release();
  }
}

export const feedEventsWorker = { start, processIncrementalBatch };

function safeJsonObject(json: string): Record<string, unknown> {
  try {
    const parsed = JSON.parse(json) as unknown;
    return typeof parsed === "object" &&
      parsed !== null &&
      !Array.isArray(parsed)
      ? (parsed as Record<string, unknown>)
      : {};
  } catch {
    return {};
  }
}

/**
 * Map a catalog activity event into a `feeds` upsert row (denormalized object fields + payload JSON).
 */
function mapActivityEventToUpsertFeedItem(e: {
  event_id: string;
  event_occurred_at: Date;
  event_type: string;
  aggregate_type: string;
  aggregate_id: string;
  event_payload_json: string;
}): UpsertFeedEventItem {
  const parsed = safeJsonObject(e.event_payload_json);
  if (e.event_type === EventTypes.CATALOG_ALBUM_RELEASED) {
    const album = parsed.album as
      | { title?: string; imageUrl?: string | null }
      | undefined;
    return {
      event_id: e.event_id,
      event_occurred_at: e.event_occurred_at,
      feed_type: FEED_TYPE_WHATS_NEW,
      feed_verb: e.event_type,
      feed_object_type: e.aggregate_type,
      feed_object_id: e.aggregate_id,
      feed_object_title: String(album?.title ?? ""),
      feed_object_sub_title: null,
      feed_object_image_url:
        album?.imageUrl != null ? String(album.imageUrl) : null,
      feed_object_payload_json: e.event_payload_json,
    };
  }
  if (e.event_type === EventTypes.CATALOG_EPISODE_RELEASED) {
    const episode = parsed.episode as
      | { title?: string; imageUrl?: string | null }
      | undefined;
    return {
      event_id: e.event_id,
      event_occurred_at: e.event_occurred_at,
      feed_type: FEED_TYPE_WHATS_NEW,
      feed_verb: e.event_type,
      feed_object_type: e.aggregate_type,
      feed_object_id: e.aggregate_id,
      feed_object_title: String(episode?.title ?? ""),
      feed_object_sub_title: null,
      feed_object_image_url:
        episode?.imageUrl != null ? String(episode.imageUrl) : null,
      feed_object_payload_json: e.event_payload_json,
    };
  }
  throw new Error(
    `unsupported event type for feed projection: ${e.event_type}`
  );
}

