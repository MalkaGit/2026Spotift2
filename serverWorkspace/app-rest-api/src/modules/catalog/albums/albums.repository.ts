import { mysqlPool, logger, type MySqlConnection } from "@mycompanyname/lib-common";
import type { Album, AlbumType } from "./types/album.model";
import type { AlbumDetails } from "./types/album.details.model";

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
 * Get album details (outside a transaction)
 * Returns null if album not found or deleted.
 */
export async function getAlbumDetails(albumId: string): Promise<AlbumDetails | null> {
  const conn = await mysqlPool.getConnection();
  try {
    return await getAlbumDetailsTx(conn, albumId);
  } finally {
    conn.release();
  }
}

/**
 * Get album details (using given connection to allow reading within transaction).
 * Returns null if album not found or deleted. 
*/
export async function getAlbumDetailsTx(
  conn: MySqlConnection,
  albumId: string
): Promise<AlbumDetails | null> {
  const sql = `
    SELECT a.id AS album_id,
           a.name AS album_name,
           a.album_type,
           a.image_url AS album_image_url,
           a.released_at AS album_released_at,
           ar.id AS artist_id,
           ar.name AS artist_name
    FROM albums a
    JOIN album_artists aa ON aa.album_id = a.id
    JOIN artists ar ON ar.id = aa.artist_id AND ar.deleted_at IS NULL
    WHERE a.id = ? AND a.deleted_at IS NULL
  `;
  const params = [albumId];
  logger.debug("albums.getAlbumDetailsTx - SQL query", { sql: sql.trim(), params });
  const [rows] = await conn.query(sql, params);
  const rowList = rows as Record<string, unknown>[];
  return mapRowsToAlbumDetails(rowList);
}



/** Map query rows to AlbumDetails (single implementation for both Tx and non-Tx). */
function mapRowsToAlbumDetails(rowList: Record<string, unknown>[]): AlbumDetails | null {
  if (!rowList || rowList.length === 0) return null;
  const first = rowList[0];
  const artists: { id: string; name: string }[] = [];
  const seenArtistIds = new Set<string>();
  for (const r of rowList) {
    const artistId = String(r.artist_id ?? "");
    if (!seenArtistIds.has(artistId)) {
      seenArtistIds.add(artistId);
      artists.push({ id: artistId, name: String(r.artist_name ?? "") });
    }
  }
  const releasedAt = first.album_released_at != null ? new Date(first.album_released_at as string | Date) : null;
  return {
    id: String(first.album_id ?? ""),
    name: String(first.album_name ?? ""),
    albumType: (String(first.album_type ?? "album") as AlbumType),
    imageUrl: first.album_image_url != null ? String(first.album_image_url) : null,
    releasedAt,
    artists,
  };
}


/**
 * Mark an album as released (uses pool; for use outside a transaction).
 * Sets released_at to the given instant. Does not throw—returns boolean only.
 * @returns true if a row was updated, false if album not found or deleted
 */
export async function releaseAlbumById(albumId: string, releasedAt: Date): Promise<boolean> {
  const conn = await mysqlPool.getConnection();
  try {
    return await releaseAlbumByIdTx(conn, albumId, releasedAt);
  } finally {
    conn.release();
  }
}

/**
 * Set album released_at to the given time. Runs on the given connection (for use inside a transaction).
 */
export async function releaseAlbumByIdTx(
  conn: MySqlConnection,
  albumId: string,
  releasedAt: Date
): Promise<boolean> {
  const sql = `
    UPDATE albums
    SET released_at = ?
    WHERE id = ? AND deleted_at IS NULL
  `;
  const params = [releasedAt, albumId];
  logger.debug("albums.releaseAlbumByIdTx - SQL query", { sql, params });
  const [result] = await conn.query(sql, params);
  const affectedRows = (result as { affectedRows?: number })?.affectedRows ?? 0;
  return affectedRows > 0;
}


