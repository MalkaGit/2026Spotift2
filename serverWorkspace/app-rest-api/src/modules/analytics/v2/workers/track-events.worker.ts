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
//import * as trackPlayRepository from "./track-play.repository.js";


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

  //runnig tick() every intervalMs without overlapping executions

  const { intervalMs, firstRunDelayMs } = config ?? getWorkerConfig();
  logger.info("track worker starting", {intervalMs,firstRunDelayMs, });
  const runLoop = async () => {
    await tick();
    setTimeout(runLoop, intervalMs);
  };

  setTimeout(runLoop, firstRunDelayMs);
}



async function tick(): Promise<void> {
  try {
    await rebuildAll();
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    logger.error("track-events worker tick failed", { error: message });
  }
}


 async function rebuildAll(): Promise<RebuildResult> {
  try {
    logger.debug("Analytics worker: rebuildAll started for track-play-events");
    await rebuildArtistStats();
    await rebuildArtistTopTracksStats();
    await rebuildArtistTopTracksDenorm();
    logger.debug("Analytics worker: rebuildAll completed successfully (artist_stats, artist_top_tracks_stats, artist_top_tracks_denorm)");
    return { ok: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    logger.fatal("Analytics worker:Track-play projection rebuild failed", { error: message });
    return { ok: false, error: message };
  }
}





/**
 * Rebuild artist_stats projection from track_play_events.
 * Monthly listeners = count of distinct user_id in last 30 days per artist.
 * Shadow+swap (instead of TRUNCATE): readers never see an empty table. 
 * Shadow+swap is atomic: readers never see a half-swapped state.
 * CREATE TABLE ... LIKE copies indexes from the live table; it does not copy foreign keys.
 */
export async function rebuildArtistStats(): Promise<void> {
  //logger.debug("Analytics worker:artist_stats projection rebuild started ...");

  const live = "artist_stats";
  const shadow = "artist_stats_new";
  const old = "artist_stats_old";

  await mysqlPool.query(`DROP TABLE IF EXISTS ${old}`);
  await mysqlPool.query(`CREATE TABLE ${shadow} LIKE ${live}`); //copy indexes, but not foreign keys
  await mysqlPool.query(`
    INSERT INTO ${shadow} (artist_id, monthly_listeners)
    SELECT artist_id, COUNT(DISTINCT user_id)
    FROM track_play_events
    WHERE played_at >= NOW() - INTERVAL 30 DAY
    GROUP BY artist_id
  `);
  await mysqlPool.query(`RENAME TABLE ${live} TO ${old}, ${shadow} TO ${live}`);
  await mysqlPool.query(`DROP TABLE ${old}`);
  
  //logger.debug("Analytics worker: artist_stats projection rebuild completed successfully");
}



/**
 * Rebuild artist_top_tracks_stats projection from track_play_events.
 * Shadow+swap (instead of TRUNCATE): readers never see an empty table. 
 * Shadow+swap is atomic: readers never see a half-swapped state.
 * CREATE TABLE ... LIKE copies indexes from the live table; it does not copy foreign keys.
 */
export async function rebuildArtistTopTracksStats(): Promise<void> {
  //logger.debug("Analytics worker: artist_top_tracks_stats projection rebuild started ...");

  const live = "artist_top_tracks_stats";
  const shadow = "artist_top_tracks_stats_new";
  const old = "artist_top_tracks_stats_old";

  await mysqlPool.query(`DROP TABLE IF EXISTS ${old}`);
  await mysqlPool.query(`CREATE TABLE ${shadow} LIKE ${live}`);  //copy indexes, but not foreign keys
  await mysqlPool.query(`
    INSERT INTO ${shadow} (artist_id, track_id, total_plays)
    SELECT artist_id, track_id, COUNT(*) AS total_plays
    FROM track_play_events
    GROUP BY artist_id, track_id
  `);
  await mysqlPool.query(`RENAME TABLE ${live} TO ${old}, ${shadow} TO ${live}`);
  await mysqlPool.query(`DROP TABLE ${old}`);

  //logger.debug("Analytics worker: artist_top_tracks_stats projection rebuild completed successfully");

}



/**
 * Rebuild artist_top_tracks_denorm projection from join (artist_top_tracks_stats + tracks + albums).
 * Only non-deleted tracks and albums are included.
 * Shadow+swap is atomic: readers never see a half-swapped state.
 * CREATE TABLE ... LIKE copies indexes from the live table; it does not copy foreign keys.
 */

export async function rebuildArtistTopTracksDenorm(): Promise<void> {
  //logger.debug("Analytics worker: artist_top_tracks_denorm projection rebuild started ...");

  const live = "artist_top_tracks_denorm";
  const shadow = "artist_top_tracks_denorm_new";
  const old = "artist_top_tracks_denorm_old";

  await mysqlPool.query(`DROP TABLE IF EXISTS ${old}`);
  await mysqlPool.query(`CREATE TABLE ${shadow} LIKE ${live}`); //copy indexes, but not foreign keys
  await mysqlPool.query(`
    INSERT INTO ${shadow} (artist_id, track_id, track_name, duration_ms, album_id, album_image_url, total_plays)
    SELECT ats.artist_id, ats.track_id, t.name, t.duration_ms, al.id, al.image_url, ats.total_plays
    FROM artist_top_tracks_stats ats
    JOIN tracks t ON t.id = ats.track_id AND t.deleted_at IS NULL
    JOIN albums al ON al.id = t.album_id AND al.deleted_at IS NULL
  `);
  await mysqlPool.query(`RENAME TABLE ${live} TO ${old}, ${shadow} TO ${live}`);
  await mysqlPool.query(`DROP TABLE ${old}`);

  //logger.debug("Analytics worker: artist_top_tracks_denorm projection rebuild completed successfully");
}




// Original TRUNCATE-based implementation (kept for reference):
// export async function rebuildArtistStats(): Promise<void> {
//   await mysqlPool.query("TRUNCATE TABLE artist_stats");
//   const sql = `
//     INSERT INTO artist_stats (artist_id, monthly_listeners)
//     SELECT artist_id, COUNT(DISTINCT user_id)
//     FROM track_play_events
//     WHERE played_at >= NOW() - INTERVAL 30 DAY
//     GROUP BY artist_id
//   `;
//   await mysqlPool.query(sql);
// }

// Original TRUNCATE-based implementation (kept for reference):
// export async function rebuildArtistTopTracksStats(): Promise<void> {
//   await mysqlPool.query("TRUNCATE TABLE artist_top_tracks_stats");
//   const sql = `
//     INSERT INTO artist_top_tracks_stats (artist_id, track_id, total_plays)
//     SELECT artist_id, track_id, COUNT(*) AS total_plays
//     FROM track_play_events
//     GROUP BY artist_id, track_id
//   `;
//   await mysqlPool.query(sql);
// }


// Original TRUNCATE-based implementation (kept for reference):
// export async function rebuildArtistTopTracksDenorm(): Promise<void> {
//   await mysqlPool.query("TRUNCATE TABLE artist_top_tracks_denorm");
//   const sql = `
//     INSERT INTO artist_top_tracks_denorm (artist_id, track_id, track_name, duration_ms, album_id, album_image_url, total_plays)
//     SELECT ats.artist_id, ats.track_id, t.name, t.duration_ms, al.id, al.image_url, ats.total_plays
//     FROM artist_top_tracks_stats ats
//     JOIN tracks t ON t.id = ats.track_id AND t.deleted_at IS NULL
//     JOIN albums al ON al.id = t.album_id AND al.deleted_at IS NULL
//   `;
//   await mysqlPool.query(sql);
// }


