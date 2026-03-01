/**
 * v2 track-events worker repository: full rebuild of projection tables from track_events.
 * No checkpoint; each rebuild reads all play events from track_events and joins track_artists for artist attribution.
 * Uses shadow+swap so readers never see a half-updated state.
 */
import { logger } from "@mycompanyname/lib-common";
import { mysqlPool } from "@mycompanyname/lib-common";

const PLAY_EVENT = "play";

// ============================================================
// track_stats
// ============================================================

const TRACK_STATS_LIVE = "track_stats";
const TRACK_STATS_SHADOW = "track_stats_new";
const TRACK_STATS_OLD = "track_stats_old";

/**
 * Rebuild track_stats from track_events (event_type = 'play'). Shadow+swap.
 */
export async function rebuildTrackStats(): Promise<void> {
  await mysqlPool.query(`DROP TABLE IF EXISTS ${TRACK_STATS_OLD}`);
  await mysqlPool.query(`CREATE TABLE ${TRACK_STATS_SHADOW} LIKE ${TRACK_STATS_LIVE}`); //fk are not copied
  await mysqlPool.query(`
    INSERT INTO ${TRACK_STATS_SHADOW} (track_id, total_count)
    SELECT track_id, COUNT(*) AS total_count
    FROM track_events
    WHERE event_type = ?
    GROUP BY track_id
  `, [PLAY_EVENT]);
  await mysqlPool.query(`RENAME TABLE ${TRACK_STATS_LIVE} TO ${TRACK_STATS_OLD}, ${TRACK_STATS_SHADOW} TO ${TRACK_STATS_LIVE}`);
  await mysqlPool.query(`DROP TABLE ${TRACK_STATS_OLD}`);
  logger.debug("v2 rebuildTrackStats completed");
}

// ============================================================
// artist_stats (total_plays + monthly_listeners from track_events + track_artists)
// ============================================================

const ARTIST_STATS_LIVE = "artist_stats";
const ARTIST_STATS_SHADOW = "artist_stats_new";
const ARTIST_STATS_OLD = "artist_stats_old";

/**
 * Rebuild artist_stats from track_events join track_artists.
 * total_plays = all-time count per artist; monthly_listeners = distinct user_id in last 30 days. Shadow+swap.
 * opration is atomic: either we replace all rows in live table, or none is replaced. 
 * No use of transaction since Create,drop etc are atomic 
*/
export async function rebuildArtistStats(): Promise<void> {
  await mysqlPool.query(`DROP TABLE IF EXISTS ${ARTIST_STATS_OLD}`);
  await mysqlPool.query(`CREATE TABLE ${ARTIST_STATS_SHADOW} LIKE ${ARTIST_STATS_LIVE}`);
  await mysqlPool.query(`
    INSERT INTO ${ARTIST_STATS_SHADOW} (artist_id, monthly_listeners, total_plays)
    SELECT
      ta.artist_id,
      COUNT(DISTINCT CASE WHEN e.occurred_at >= NOW() - INTERVAL 30 DAY THEN e.user_id END) AS monthly_listeners,
      COUNT(*) AS total_plays
    FROM track_events e
    INNER JOIN track_artists ta ON ta.track_id = e.track_id
    WHERE e.event_type = ?
    GROUP BY ta.artist_id
  `, [PLAY_EVENT]);
  await mysqlPool.query(`RENAME TABLE ${ARTIST_STATS_LIVE} TO ${ARTIST_STATS_OLD}, ${ARTIST_STATS_SHADOW} TO ${ARTIST_STATS_LIVE}`);
  await mysqlPool.query(`DROP TABLE ${ARTIST_STATS_OLD}`);
  logger.debug("v2 rebuildArtistStats completed");
}

// ============================================================
// artist_top_tracks_stats
// ============================================================

const ARTIST_TOP_TRACKS_STATS_LIVE = "artist_top_tracks_stats";
const ARTIST_TOP_TRACKS_STATS_SHADOW = "artist_top_tracks_stats_new";
const ARTIST_TOP_TRACKS_STATS_OLD = "artist_top_tracks_stats_old";

/**
 * Rebuild artist_top_tracks_stats from track_events join track_artists. Shadow+swap.
 * opration is atomic: either we replace all rows in live table, or none is replaced. 
 * No use of transaction since Create,drop etc are atomic 
 */
export async function rebuildArtistTopTracksStats(): Promise<void> {
  await mysqlPool.query(`DROP TABLE IF EXISTS ${ARTIST_TOP_TRACKS_STATS_OLD}`);
  await mysqlPool.query(`CREATE TABLE ${ARTIST_TOP_TRACKS_STATS_SHADOW} LIKE ${ARTIST_TOP_TRACKS_STATS_LIVE}`);
  await mysqlPool.query(`
    INSERT INTO ${ARTIST_TOP_TRACKS_STATS_SHADOW} (artist_id, track_id, total_plays)
    SELECT ta.artist_id, e.track_id, COUNT(*) AS total_plays
    FROM track_events e
    INNER JOIN track_artists ta ON ta.track_id = e.track_id
    WHERE e.event_type = ?
    GROUP BY ta.artist_id, e.track_id
  `, [PLAY_EVENT]);
  await mysqlPool.query(`RENAME TABLE ${ARTIST_TOP_TRACKS_STATS_LIVE} TO ${ARTIST_TOP_TRACKS_STATS_OLD}, ${ARTIST_TOP_TRACKS_STATS_SHADOW} TO ${ARTIST_TOP_TRACKS_STATS_LIVE}`);
  await mysqlPool.query(`DROP TABLE ${ARTIST_TOP_TRACKS_STATS_OLD}`);
  logger.debug("v2 rebuildArtistTopTracksStats completed");
}

// ============================================================
// artist_top_tracks_denorm (from artist_top_tracks_stats + tracks + albums)
// ============================================================

const ARTIST_TOP_TRACKS_DENORM_LIVE = "artist_top_tracks_denorm";
const ARTIST_TOP_TRACKS_DENORM_SHADOW = "artist_top_tracks_denorm_new";
const ARTIST_TOP_TRACKS_DENORM_OLD = "artist_top_tracks_denorm_old";

/**
 * Rebuild artist_top_tracks_denorm from artist_top_tracks_stats join tracks join albums. Shadow+swap.
 * Only non-deleted tracks and albums.
 * opration is atomic: either we replace all rows in live table, or none is replaced. 
 * No use of transaction since Create,drop etc are atomic 
 */
export async function rebuildArtistTopTracksDenorm(): Promise<void> {
  await mysqlPool.query(`DROP TABLE IF EXISTS ${ARTIST_TOP_TRACKS_DENORM_OLD}`);
  await mysqlPool.query(`CREATE TABLE ${ARTIST_TOP_TRACKS_DENORM_SHADOW} LIKE ${ARTIST_TOP_TRACKS_DENORM_LIVE}`);
  await mysqlPool.query(`
    INSERT INTO ${ARTIST_TOP_TRACKS_DENORM_SHADOW} (artist_id, track_id, track_name, duration_ms, album_id, album_image_url, total_plays)
    SELECT ats.artist_id, ats.track_id, t.name, t.duration_ms, al.id, al.image_url, ats.total_plays
    FROM artist_top_tracks_stats ats
    JOIN tracks t ON t.id = ats.track_id AND t.deleted_at IS NULL
    JOIN albums al ON al.id = t.album_id AND al.deleted_at IS NULL
  `);
  await mysqlPool.query(`RENAME TABLE ${ARTIST_TOP_TRACKS_DENORM_LIVE} TO ${ARTIST_TOP_TRACKS_DENORM_OLD}, ${ARTIST_TOP_TRACKS_DENORM_SHADOW} TO ${ARTIST_TOP_TRACKS_DENORM_LIVE}`);
  await mysqlPool.query(`DROP TABLE ${ARTIST_TOP_TRACKS_DENORM_OLD}`);
  logger.debug("v2 rebuildArtistTopTracksDenorm completed");
}
