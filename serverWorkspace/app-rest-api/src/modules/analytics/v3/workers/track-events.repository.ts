import { logger } from "@mycompanyname/lib-common";
import { mysqlPool, type MySqlConnection } from "@mycompanyname/lib-common";


// ============================================================
// Checkpoint (watermark) storage
// ============================================================

const CHECKPOINT_TABLE = "track_events_checkpoint";

/**
 * Get the last processed event id for a worker. Returns null if no row exists.
 */
export async function getCheckpoint(workerId: string): Promise<number | null> {
  const [rows] = await mysqlPool.query(
    `SELECT last_processed_event_id FROM ${CHECKPOINT_TABLE} WHERE worker_id = ? LIMIT 1`,
    [workerId]
  );
  const list = rows as { last_processed_event_id: number }[];
  if (list.length === 0) return null;
  return Number(list[0].last_processed_event_id);
}


/**
 * Set the checkpoint using an existing connection (for use inside a transaction).
 */
export async function setCheckpointWithConnection(
  connection: MySqlConnection,
  workerId: string,
  lastProcessedEventId: number
): Promise<void> {
  await connection.query(
    `INSERT INTO ${CHECKPOINT_TABLE} (worker_id, last_processed_event_id)
     VALUES (?, ?)
     ON DUPLICATE KEY UPDATE last_processed_event_id = VALUES(last_processed_event_id)`,
    [workerId, lastProcessedEventId]
  );
}




// ============================================================
// Event rows from track_events
// ============================================================

export interface TrackEventRow {
  id: number;
  event_type: string; //play, skip, etc.
  user_id: string;   
  track_id: string;
  occurred_at: Date;
}

/** Map raw query row to TrackEventRow (e.g. parse occurred_at to Date). */
function mapRowToTrackEvent(row: Record<string, unknown>): TrackEventRow {
  return {
    id: Number(row.id),
    event_type: String(row.event_type),
    user_id: String(row.user_id),
    track_id: String(row.track_id),
    occurred_at: row.occurred_at instanceof Date ? row.occurred_at : new Date(String(row.occurred_at)),
  };
}

/**
 * Fetch events from track_events with id > lastId, filtered by eventType, ordered by id, limited.
 */
export async function getEventsSince(
  lastId: number,
  limit: number,
  eventType: string = "play"
): Promise<TrackEventRow[]> {
  const [rows] = await mysqlPool.query(
    `SELECT id, event_type, user_id, track_id, occurred_at
     FROM track_events
     WHERE id > ? AND event_type = ?
     ORDER BY id ASC
     LIMIT ?`,
    [lastId, eventType, limit]
  );
  return (rows as Record<string, unknown>[]).map(mapRowToTrackEvent);
}

// ============================================================
// Projection writes (stats + denorm)
// ============================================================

/**
 * Upsert track_stats with deltas (same connection for transaction).
 */
export async function upsertTrackStats(
  connection: MySqlConnection,
  deltas: Array<{ track_id: string; count: number }>
): Promise<void> {
  if (deltas.length === 0) return;
  const table = "track_stats";
  const placeholders = deltas.map(() => "(?, ?)").join(", ");
  const params = deltas.flatMap((d) => [d.track_id, d.count]);
  await connection.query(
    `INSERT INTO ${table} (track_id, total_count)
     VALUES ${placeholders}
     ON DUPLICATE KEY UPDATE total_count = total_count + VALUES(total_count), updated_at = CURRENT_TIMESTAMP`,
    params
  );
}

/**
 * Upsert artist_stats total_plays with deltas (same connection for transaction). New rows get monthly_listeners = 0.
 */
export async function upsertArtistStats(
  connection: MySqlConnection,
  deltas: Array<{ artist_id: string; count: number }>
): Promise<void> {
  if (deltas.length === 0) return;
  const table = "artist_stats";
  const placeholders = deltas.map(() => "(?, ?, 0)").join(", ");
  const params = deltas.flatMap((d) => [d.artist_id, d.count]);
  await connection.query(
    `INSERT INTO ${table} (artist_id, total_plays, monthly_listeners)
     VALUES ${placeholders}
     ON DUPLICATE KEY UPDATE total_plays = total_plays + VALUES(total_plays), updated_at = CURRENT_TIMESTAMP`,
    params
  );
}

/**
 * Upsert artist_top_tracks_stats with deltas (same connection for transaction).
 */
export async function upsertArtistTopTracksStats(
  connection: MySqlConnection,
  deltas: Array<{ artist_id: string; track_id: string; count: number }>
): Promise<void> {
  if (deltas.length === 0) return;
  const table = "artist_top_tracks_stats";
  const placeholders = deltas.map(() => "(?, ?, ?)").join(", ");
  const params = deltas.flatMap((d) => [d.artist_id, d.track_id, d.count]);
  await connection.query(
    `INSERT INTO ${table} (artist_id, track_id, total_plays)
     VALUES ${placeholders}
     ON DUPLICATE KEY UPDATE total_plays = total_plays + VALUES(total_plays)`,
    params
  );
}

/**
 * Upsert artist_top_tracks_denorm: need track_name, duration_ms, album_id, album_image_url from tracks+albums.
 * rows must contain those fields; we upsert with total_plays delta.
 */
export async function upsertArtistTopTracksDenorm(
  connection: MySqlConnection,
  rows: Array<{
    artist_id: string;
    track_id: string;
    track_name: string;
    duration_ms: number;
    album_id: string;
    album_image_url: string | null;
    total_plays_delta: number;
  }>
): Promise<void> {
  if (rows.length === 0) return;
  const table = "artist_top_tracks_denorm";
  const placeholders = rows.map(() => "(?, ?, ?, ?, ?, ?, ?)").join(", ");
  const params = rows.flatMap((r) => [
    r.artist_id,
    r.track_id,
    r.track_name,
    r.duration_ms,
    r.album_id,
    r.album_image_url,
    r.total_plays_delta,
  ]);
  await connection.query(
    `INSERT INTO ${table} (artist_id, track_id, track_name, duration_ms, album_id, album_image_url, total_plays)
     VALUES ${placeholders}
     ON DUPLICATE KEY UPDATE total_plays = total_plays + VALUES(total_plays)`,
    params
  );
}

/**
 * Fetch track + album fields for (artist_id, track_id) pairs via track_artists. Only non-deleted tracks/albums.
 * Returns one row per pair so multi-artist tracks get metadata for each artist.
 */
export async function getTrackAlbumByArtistTrack(
  pairs: Array<{ artist_id: string; track_id: string }>
): Promise<
  Array<{
    artist_id: string;
    track_id: string;
    track_name: string;
    duration_ms: number;
    album_id: string;
    album_image_url: string | null;
  }>
> {
  if (pairs.length === 0) return [];
  const placeholders = pairs.map(() => "(?, ?)").join(", ");
  const params = pairs.flatMap((p) => [p.artist_id, p.track_id]);
  const [rows] = await mysqlPool.query(
    `SELECT ta.artist_id, t.id AS track_id, t.name AS track_name, t.duration_ms, al.id AS album_id, al.image_url AS album_image_url
     FROM track_artists ta
     JOIN tracks t ON t.id = ta.track_id AND t.deleted_at IS NULL
     JOIN albums al ON al.id = t.album_id AND al.deleted_at IS NULL
     WHERE (ta.artist_id, ta.track_id) IN (${placeholders})`,
    params
  );
  return rows as Array<{
    artist_id: string;
    track_id: string;
    track_name: string;
    duration_ms: number;
    album_id: string;
    album_image_url: string | null;
  }>;
}




const ARTIST_STATS_LIVE = "artist_stats";
const ARTIST_STATS_SHADOW = "artist_stats_new";
const ARTIST_STATS_OLD = "artist_stats_old";

/**
 * Rebuild artist_stats.monthly_listeners from track_events (last 30 days) + track_artists.
 * Shadow+swap (like v2): build full table in shadow, then atomic RENAME so readers never see partial state.
 * - Preserves total_plays from live (updated incrementally); only refreshes monthly_listeners from 30-day window.
 * - One row per artist that exists in live; COALESCE(..., 0) for artists with no plays in window.
 */
export async function rebuildArtistMonthlyListeners(): Promise<void> {
  await mysqlPool.query(`DROP TABLE IF EXISTS ${ARTIST_STATS_OLD}`);
  await mysqlPool.query(`CREATE TABLE ${ARTIST_STATS_SHADOW} LIKE ${ARTIST_STATS_LIVE}`);
  await mysqlPool.query(`
    INSERT INTO ${ARTIST_STATS_SHADOW} (artist_id, monthly_listeners, total_plays, updated_at)
    SELECT
      stats.artist_id,
      COALESCE(monthly_by_artist.monthly_listeners, 0),
      stats.total_plays,
      CURRENT_TIMESTAMP
    FROM ${ARTIST_STATS_LIVE} AS stats
    LEFT JOIN (
      SELECT
        ta.artist_id,
        COUNT(DISTINCT events.user_id) AS monthly_listeners
      FROM track_events AS events
      INNER JOIN track_artists AS ta ON ta.track_id = events.track_id
      WHERE events.event_type = 'play'
        AND events.occurred_at >= NOW() - INTERVAL 30 DAY
      GROUP BY ta.artist_id
    ) AS monthly_by_artist ON monthly_by_artist.artist_id = stats.artist_id
  `);
  await mysqlPool.query(
    `RENAME TABLE ${ARTIST_STATS_LIVE} TO ${ARTIST_STATS_OLD}, ${ARTIST_STATS_SHADOW} TO ${ARTIST_STATS_LIVE}`
  );
  await mysqlPool.query(`DROP TABLE ${ARTIST_STATS_OLD}`);
  logger.debug("tracks v3 monthly listeners rebuilt");
}
