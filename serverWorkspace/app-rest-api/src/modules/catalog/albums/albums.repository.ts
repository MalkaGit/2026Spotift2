import { mysqlPool, logger } from "@mycompanyname/lib-common";
import type { Album } from "./types/album.model";

/** Map raw query row to Album (explicit coercion for runtime safety). */
function mapRowToAlbum(row: Record<string, unknown>): Album {
  return {
    id: String(row.id ?? ""),
    name: String(row.name ?? ""),
    imageUrl: row.imageUrl != null ? String(row.imageUrl) : null,
  };
}

/**
 * Get albums by ids from albums table only. No join.
 * Returns only non-deleted albums. Empty input → empty Map.
 */
export async function getAlbumsByIds(
  albumIds: string[]
): Promise<Map<string, Album>> {
  if (albumIds.length === 0) return new Map();
  const unique = [...new Set(albumIds)];
  const placeholders = unique.map(() => "?").join(", ");
  const sql = `
    SELECT id, name, image_url AS imageUrl
    FROM albums
    WHERE id IN (${placeholders}) AND deleted_at IS NULL
  `;
  const params = unique;
  logger.debug("albums.getAlbumsByIds - SQL query", { sql, params });
  const [rows] = await mysqlPool.query(sql, params);
  const list = (rows as Record<string, unknown>[]).map(mapRowToAlbum);
  const map = new Map<string, Album>();
  for (const album of list) {
    map.set(album.id, album);
  }
  return map;
}

/**
 * Mark an album as released by setting released_at = NOW().
 * Repository does not throw—returns boolean only.
 * @returns true if a row was updated, false if album not found or deleted
 */
export async function releaseAlbumById(albumId: string): Promise<boolean> {
  const sql = `
    UPDATE albums
    SET released_at = NOW()
    WHERE id = ? AND deleted_at IS NULL
  `;
  const params = [albumId];
  logger.debug("albums.releaseAlbumById - SQL query", { sql, params });
  const [result] = await mysqlPool.query(sql, params);
  const affectedRows = (result as { affectedRows?: number })?.affectedRows ?? 0;
  return affectedRows > 0;
}
