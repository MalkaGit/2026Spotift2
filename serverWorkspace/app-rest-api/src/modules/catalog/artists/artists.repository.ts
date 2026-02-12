import { mysqlPool } from "@mycompanyname/lib-common";
import { logger } from "@mycompanyname/lib-common";
import { MySqlConnection } from "@mycompanyname/lib-common";
import * as likesRepo from "../../likes/likes.repository";
import { LIKED_ENTITY_ARTIST } from "../../likes/types";

/**
 * Artist entity matching the artists table schema.
 * Table: artists (id, user_id, name, bio, image_url, created_at)
 * FK: user_id → users(id) ON DELETE CASCADE
 */
export interface ArtistEntity {
  id: string;
  userId: string;
  name: string;
  bio: string | null;
  imageUrl: string | null;
  createdAt: string;
}

function mapRowToArtistEntity(row: any): ArtistEntity {
  return {
    id: row.id,
    userId: row.user_id,
    name: row.name,
    bio: row.bio ?? null,
    imageUrl: row.image_url ?? null,
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
  const sql = `SELECT id, user_id, name, bio, image_url, created_at FROM artists WHERE id = ? LIMIT 1`;
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