/**
 * v3 tracks incremental worker + rebuild artist monthly listeners every 10 ticks.
 *
 * Note MS-ready
 * the worker repository is ready for MS-ready 
 * since it access tables directly, without using the service layer.
 * 
 * track_events table with an event_type column:
 * one table for all track-related events (play, skip, etc.)
 * This is standard practice
 * avoid one table per event type (e.g. track_play_events)
 * to reduce comlexitiy by reducing the number of tables
 * and allow us to process events in chronological order across event types.
 *
 * track-events table has no artist_id column
 * In other words, the events-table is not enriched with artist_id at ingest
 * normally we enrich events as we ingest them to avoid enrichment on worker/consumer.
 * However, if the enrichment in ingestion create multiple rows per logical occurrence
 * we do not enrich as we ingest (in events-table=event-message) 
 * because it is much more complext to process in batches
 * (play events with multiple performers would create multiple rows per logical occurrence).
 * In those cases, we enrich in worker/consumer to simplify the processing.
 * Note: had we enriched at ingest, 
 *       if same play inserted tow track-events (one for each performer),
 *       we could have read the two rows in different bactches.
 *       in-memeoy aggregation would be much more complext to process in batches.
 * 
 * 
 * Scheduling: the next run is scheduled with setTimeout only after the current run finishes (or fails),
 * so there are no overlapping executions.
 *
 * Read: we read play events in batches, up to batchSize,
 * since the last processed event id (stored in the checkpoint table).
 * So each run processes the next chunk of events after the checkpoint.

 * Deltas: we calculate all deltas (track_stats, artist_stats, artist_top_tracks_stats, artist_top_tracks_denorm) outside
 * the transaction. That keeps the transaction short and reduces lock time.
 *
 * Write: we update the projection tables and the checkpoint in a single transaction. 
 * That ensures each event is counted exactly once: 
 * if we fail before updating the checkpoint, we roll back and the projection
 * updates are not committed, so the next run will re-read the same events and retry.
 *
 */

import { mysqlPool, logger, type MySqlConnection } from "@mycompanyname/lib-common";
import { getWorkerConfig } from "./common/worker.config.js";
import type { WorkerConfig } from "./common/worker.types.js";
import * as trackEventsRepo from "./track-events.repository.js";
import type { TrackEventRow } from "./track-events.repository.js";
import { tracksService } from "../../../catalog/albums/tracks/index.js";

const WORKER_ID = "tracks-events-worker-v3";
let tickCount_modulo10 = 0;

/**
 * Starts the worker that updates projection tables incrementally from track events and rebuilds artist monthly listeners every 10 ticks.
 * Each tick: process batch; every 10th tick also rebuild artist monthly_listeners (last 30 days).
 */
export function start(config?: Partial<WorkerConfig>): void {
  const baseConfig = getWorkerConfig();
  const effectiveConfig: WorkerConfig = { ...baseConfig, ...config };
  const { intervalMs, firstRunDelayMs } = effectiveConfig;

  const runLoop = async () => {
    try {
      await processIncrementalBatch(effectiveConfig);
      
      if (tickCount_modulo10 === 0) 
        await trackEventsRepo.rebuildArtistMonthlyListeners();   
      tickCount_modulo10 = (tickCount_modulo10 + 1) % 10;

    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      logger.error("tracks events worker tick failed", { error: message });
    }
    setTimeout(runLoop, intervalMs);
  };
  logger.info("tracks events worker starting", { intervalMs, firstRunDelayMs });
  setTimeout(runLoop, firstRunDelayMs);
}

/**
 * Process one batch: read checkpoint, fetch events, compute deltas, then in one transaction upsert track_stats, artist_stats, artist_top_tracks_stats, artist_top_tracks_denorm, and set checkpoint.
 */
export async function processIncrementalBatch(config: WorkerConfig): Promise<void> {
  const { batchSize } = config;

  const lastProcessedId: number =
    (await trackEventsRepo.getCheckpoint(WORKER_ID)) ?? 0;

  const events = await trackEventsRepo.getEventsSince(lastProcessedId, batchSize, "play");
  if (events.length === 0) return;

  const maxEventId = Math.max(...events.map((e) => e.id));
  const expandedPairs = await expandEventsToArtistTrackPairs(events);
  
  //calculate deltas for each projection table (pure in-memory; repo only does DB)
  const trackStatsDeltas = calcTrackStatsDeltas(events);
  const artistStatsDeltas = calcArtistStatsDeltas(expandedPairs);
  const artistTopTracksStatsDelta = calcArtistTopTracksStatsDeltas(expandedPairs);
  const artistTopTracksDenormDelta = await calcArtistTopTracksDenormDelta(artistTopTracksStatsDelta);

  let connection: MySqlConnection | undefined;
  try {
    connection = await mysqlPool.getConnection();
    await connection.beginTransaction();

    //upsert deltas for each projection table
    await trackEventsRepo.upsertTrackStats(connection, trackStatsDeltas);
    await trackEventsRepo.upsertArtistStats(connection, artistStatsDeltas);
    await trackEventsRepo.upsertArtistTopTracksStats(connection, artistTopTracksStatsDelta);
    await trackEventsRepo.upsertArtistTopTracksDenorm(connection, artistTopTracksDenormDelta);

    //update checkpoint
    await trackEventsRepo.setCheckpointWithConnection(
      connection,WORKER_ID, maxEventId );

    //commit transaction
    await connection.commit();

    logger.debug("track-events batch applied", {
      eventCount: events.length, 
      maxId: maxEventId,
    });
  } catch (err) {
    if (connection) {
      try {
        await connection.rollback();
      } catch (rollbackErr) {
        logger.error("tracks v3 rollback failed", {
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

/**
 * returns array that holds (track_id, artist_id) pairs for all the tracks read in batch
 * Note: one track can have multiple artists
 */
async function expandEventsToArtistTrackPairs(
  events: TrackEventRow[]
): Promise<Array<{ artist_id: string; track_id: string }>> {
  const trackIds = [...new Set(events.map((e) => e.track_id))];
  const trackIdToArtists = await tracksService.getArtistIdsByTrackIds(trackIds);
  const pairs: Array<{ track_id: string; artist_id: string }> = [];
  for (const e of events) {
    const artistIds = trackIdToArtists.get(e.track_id) ?? [];
    for (const artistId of artistIds) {
      pairs.push({ track_id: e.track_id, artist_id: artistId });
    }
  }
  return pairs;
}

/** Delta for track_stats: play count per track from events (in-memory only; repo does DB). */
function calcTrackStatsDeltas(
  events: TrackEventRow[]
): Array<{ track_id: string; count: number }> {
  const map = new Map<string, number>();
  for (const e of events) {
    map.set(e.track_id, (map.get(e.track_id) ?? 0) + 1);
  }
  return Array.from(map.entries()).map(([track_id, count]) => ({ track_id, count }));
}

/** Delta for artist_stats: play count per artist from expanded pairs. */
function calcArtistStatsDeltas(
  expandedPairs: Array<{ track_id: string; artist_id: string; }>
): Array<{ artist_id: string; count: number }> {
  const artistIdToTotalCountDelta = new Map<string, number>();
  for (const p of expandedPairs) {
    artistIdToTotalCountDelta.set(p.artist_id, (artistIdToTotalCountDelta.get(p.artist_id) ?? 0) + 1);
  }
  return Array.from(artistIdToTotalCountDelta.entries()).map(([artist_id, count]) => ({ artist_id, count }));
}

/** Delta for artist_top_tracks_stats: play count per (artist_id, track_id) from expanded pairs. */
function calcArtistTopTracksStatsDeltas(
  expandedPairs: Array<{ track_id: string; artist_id: string;  }>
): Array<{ artist_id: string; track_id: string; count: number }> {
  const artistTrackToTotalCountDelta = new Map<string, number>();
  for (const p of expandedPairs) {
    const key = `${p.artist_id}\t${p.track_id}`;
    artistTrackToTotalCountDelta.set(key, (artistTrackToTotalCountDelta.get(key) ?? 0) + 1);
  }
  return Array.from(artistTrackToTotalCountDelta.entries()).map(([key, count]) => {
    const [artist_id, track_id] = key.split("\t");
    return { artist_id, track_id, count };
  });
}

/**
 * Enriches (artist_id, track_id, count) with track/album fields for artist_top_tracks_denorm upsert.
 * Not MS-ready: using joins in repository to get track/album fields.
 *               Instead, we should call services to get album/artist by ids.
 */
async function calcArtistTopTracksDenormDelta(
  statsDelta: Array<{ artist_id: string; track_id: string; count: number }>
) {
  if (statsDelta.length === 0) return [];
  const pairs = statsDelta.map(({ artist_id, track_id }) => ({ artist_id, track_id }));
  const enriched = await trackEventsRepo.getTrackAlbumByArtistTrack(pairs); 
  const countByKey = new Map(statsDelta.map((d) => [`${d.artist_id}\t${d.track_id}`, d.count]));
  return enriched.map((row) => ({
    ...row,
    total_plays_delta: countByKey.get(`${row.artist_id}\t${row.track_id}`) ?? 0,
  }));
}

export const trackEventsWorker = { start, processIncrementalBatch };
