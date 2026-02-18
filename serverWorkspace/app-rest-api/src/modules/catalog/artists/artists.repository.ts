import { mysqlPool } from "@mycompanyname/lib-common";
import { logger } from "@mycompanyname/lib-common";
import { MySqlConnection } from "@mycompanyname/lib-common";
import * as likesRepo from "../../likes/likes.repository";
import { LIKED_ENTITY_ARTIST } from "../../likes/types";
import { ArtistOverviewTrackItem } from "./types/artist.overview.output.model";

/**
 * Artist entity matching the artists table schema.
 * Table: artists (id, user_id, name, bio, image_url, header_image_url, action_bar_image_url, created_at)
 * FK: user_id → users(id) ON DELETE CASCADE
 */
export interface ArtistEntity {
  id: string;
  userId: string;
  name: string;
  bio: string | null;
  imageUrl: string | null;
  headerImageUrl: string | null;
  actionBarImageUrl: string | null;
  createdAt: string;
}

function mapRowToArtistEntity(row: any): ArtistEntity {
  return {
    id: row.id,
    userId: row.user_id,
    name: row.name,
    bio: row.bio ?? null,
    imageUrl: row.image_url ?? null,
    headerImageUrl: row.header_image_url ?? null,
    actionBarImageUrl: row.action_bar_image_url ?? null,
    createdAt:
      row.created_at instanceof Date
        ? row.created_at.toISOString()
        : new Date(row.created_at).toISOString(),
  };
}

/**
 * Find an artist by id. Returns null if not found.
 */
export async function findById(artistId: string): Promise<ArtistEntity | null> {
  const sql = `SELECT id, user_id, name, bio, image_url, header_image_url, action_bar_image_url, created_at FROM artists WHERE id = ? LIMIT 1`;
  const params = [artistId];
  logger.debug("artists.findById - SQL query", { sql, params });
  const [rows] = await mysqlPool.query(sql, params);
  const result = rows as any[];
  if (result.length === 0) return null;
  return mapRowToArtistEntity(result[0]);
}


/**
 * Delete an artist and all its likes in a single database transaction.
 *
 * This method:
 * 1. Starts a transaction on a dedicated connection
 * 2. Deletes likes for the artist (entity_type = 'artist', entity_id = artistId)
 * 3. Deletes the artist row itself
 * 4. Commits on success or rolls back on any error
 */
export async function deleteByIdCascade(artistId: string): Promise<void> {
  let connection: MySqlConnection | undefined;

  try {
    connection = await mysqlPool.getConnection();
    await connection.beginTransaction();

    // Delete all likes for this artist within the same transaction.
    await likesRepo.deleteByEntity(LIKED_ENTITY_ARTIST, artistId, connection);

    // Delete the artist row itself
    const sql = `DELETE FROM artists WHERE id = ?`;
    const params = [artistId];
    logger.debug("artists.deleteByIdCascade - SQL query", { sql, params });
    await connection.query(sql, params);

    await connection.commit();
    logger.debug("artists.deleteByIdCascade - transaction committed");
  } catch (err) {
    if (connection) {
      try {
        await connection.rollback();
      } catch (rollbackErr) {
        logger.error("artists.deleteByIdCascade - rollback failed", {
          error: rollbackErr,
        });
      }
    }
    throw err;
  } finally {
    if (connection) {
      connection.release();
      logger.debug("artists.deleteByIdCascade - connection released");
    }
  }
}

/**
 * Entity matching the artist_stats table schema.
 * Table: artist_stats (artist_id PK → artists.id, monthly_listeners BIGINT NOT NULL)
 */
export interface ArtistStatEntity {
  artistId: string;
  monthlyListeners: number;
}

function mapRowToArtistStat(row: any): ArtistStatEntity {
  return {
    artistId: row.artist_id,
    monthlyListeners: Number(row.monthlyListeners ?? 0),
  };
}

/**
 * Get aggregate statistics for a single artist.
 * Artist repository can read from artist_stats table directly
 *
 * Returns null when there is no stats row for the given artist.
 */
export async function getArtistStats(
  artistId: string
): Promise<ArtistStatEntity | null> {
  const sql = `
    SELECT artist_id, monthly_listeners AS monthlyListeners
    FROM artist_stats
    WHERE artist_id = ?
    LIMIT 1
  `;
  const params = [artistId];

  logger.debug("artists.getArtistStats - SQL query", {
    sql: sql.replace(/\s+/g, " ").trim(),
    params,
  });

  const [rows] = await mysqlPool.query(sql, params);
  const result = rows as any[];

  if (result.length === 0) {
    return null;
  }

  return mapRowToArtistStat(result[0]);
}




/**
 * Get top tracks for a given artist ordered by total plays (descending).
 * vO1 – join normalized projection table with core data 
 * Data source:
 * - artist_top_tracks_stats (artist_id, track_id, total_plays)
 * - tracks (id, name, duration_ms, album_id, deleted_at)
 * - albums (id, image_url, deleted_at)
 *
 * Only non-deleted tracks and albums are included.
 *
 * @param artistId - Artist UUID
 * @param limit - Maximum number of tracks to return
 */
export async function getArtistTopTracks(
  artistId: string,
  limit: number
): Promise<ArtistOverviewTrackItem[]> {
  const sql = `
    SELECT
      t.id AS id,
      t.name AS trackName,
      ats.total_plays AS totalPlays,
      t.duration_ms AS durationMs,
      al.id AS albumId,
      al.image_url AS imageUrl
    FROM artist_top_tracks_stats ats
    JOIN tracks t
      ON t.id = ats.track_id
      AND t.deleted_at IS NULL
    JOIN albums al
      ON al.id = t.album_id
      AND al.deleted_at IS NULL
    WHERE ats.artist_id = ?
    ORDER BY ats.total_plays DESC
    LIMIT ?
  `;

  const params = [artistId, limit];

  logger.debug("artists.getTopTracksByArtist - SQL query", {
    sql: sql.replace(/\s+/g, " ").trim(),
    params,
  });

  const [rows] = await mysqlPool.query(sql, params);
  const result = rows as any[];

  return result.map((row, index): ArtistOverviewTrackItem => ({
    rank: index + 1,
    trackId: row.id,
    trackName: row.trackName,
    totalPlays: Number(row.totalPlays ?? 0),
    durationMs: Number(row.durationMs ?? 0),
    albumId: row.albumId,
    albumImageUrl: String(row.imageUrl ?? ""),
  }));
}




/**
 * OLDER VERSION OF DELETE ARTIST - DELETE ARTIST WITH NO TRANSACTION
 * Delete an artist by id
 * Does not check existence or ownership; call findById and authorize in the service first.
 * Note: Does not delete likes; orphan likes will remain until we add transaction + likes deletion in a later phase.
 */
/*
export async function deleteById(artistId: string): Promise<void> {
  const sql = `DELETE FROM artists WHERE id = ?`;
  const params = [artistId];
  logger.debug("artists.deleteById - SQL query", { sql, params });
  await mysqlPool.query(sql, params);
}
*/