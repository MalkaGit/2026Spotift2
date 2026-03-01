/*
Goal:
- Worker for updating projection tables based on track events.
- For now it only handles track play events (from track_play_events),
  but it may handle other events later.

idea:
- This is v2 of the worker - 
  rebuilds all projection tables by track events tables
  using shadow+swap instead of truncate to avoid downtime
  and support atomicity (readers never see a half-swapped state)
  Be sure that the projection tables to not use foreign keys since we do not create fk as we create the tables 


Flow:
- See the start function for the scheduling logic (recursive setTimeout loop).

Future considerations:
- Other track events (e.g. paused, skipped):
  Do we extend this worker to handle other event types, or introduce additional workers per event type?
- Different rebuild intervals (e.g. artist stats daily vs. others hourly):
  - Do we support per-projection schedules/config, or split workers per projection group?
*/

import { mysqlPool } from "@mycompanyname/lib-common";
import { logger } from "@mycompanyname/lib-common";
import { getWorkerConfig } from "./common/worker.config.js";
import type { RebuildResult, WorkerConfig } from "./common/worker.types.js";
import * as trackEventsRepo from "./track-events.repository.js";

/**
 * Starts the worker that rebuilds projection tables from track events.
 * This implementation uses a recursive setTimeout loop to run the logic every intervalMs.
 * Each iteration, it rebuilds all projection tables from the track events tables.
 *
 * For now: track events tables is {track_play_events}
 *          projection tables are {artist_stats, artist_top_tracks_stats, artist_top_tracks_denorm}
 * LLD:
 *      - Config is read from env containing intervalMs and firstRunDelayMs.
 *      - We intentionally avoid setInterval to sidestep the headache of overlapping
 *        executions; the next run is only scheduled after the previous rebuild
 *        finishes (or fails).
 *      - We use shadow+swap instead of TRUNCATE to avoid downtime.
 *      - Atomicity: The whole rebuild cannot run in one rollbackable transaction
 *        because DDL (CREATE TABLE, DROP TABLE, RENAME TABLE) causes an implicit
 *        commit in MySQL. What is atomic: (1) each INSERT ... SELECT is a single
 *        statement, so it is all-or-nothing; (2) the RENAME TABLE that swaps live
 *        and shadow is a single statement, so readers never see a half-swapped state.
 *      - Repository-style methods live in this file for now to keep things simple;
 *        in the future we may move them to a dedicated repository module.
 */
export function start(config?: Partial<WorkerConfig>): void {
  const { intervalMs, firstRunDelayMs } = config ?? getWorkerConfig();
  logger.info("v2 track-events worker starting (full rebuild)", { intervalMs, firstRunDelayMs });

  const runLoop = async () => {
    await tick();
    setTimeout(runLoop, intervalMs);
  };

  setTimeout(runLoop, firstRunDelayMs);
}

/**
 * One worker tick: run full rebuild. Kept as a named function so we can later add
 * "every N ticks" logic (e.g. extra work every 10th tick) if needed, like v3.
 */
async function tick(): Promise<void> {
  try {
    await rebuildAll();
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    logger.error("v2 track-events worker tick failed", { error: message });
  }
}

/**
 * Full rebuild of all projection tables. Order matters: artist_top_tracks_denorm is built from
 * artist_top_tracks_stats, so stats must be rebuilt first. Each repo method uses shadow+swap
 * (build into shadow table, then RENAME TABLE) so readers never see partial state.
 */
async function rebuildAll(): Promise<RebuildResult> {
  try {
    logger.debug("v2 rebuildAll started");
    await trackEventsRepo.rebuildTrackStats();
    await trackEventsRepo.rebuildArtistStats();
    await trackEventsRepo.rebuildArtistTopTracksStats();
    await trackEventsRepo.rebuildArtistTopTracksDenorm();
    logger.debug("v2 rebuildAll completed");
    return { ok: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    logger.fatal("v2 track-events projection rebuild failed", { error: message });
    return { ok: false, error: message };
  }
}

export const trackEventsWorker = { start };
