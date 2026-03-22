/**
 * What's New v1 — album branch from domain tables (`likes` → `album_artists` → `albums` → `artists`).
 *
 * ✔ Pattern:
 * - Cursor-based pagination (stable ordering: released_at DESC, id ASC)
 * - Repository owns SQL + mapping
 * - Service should validate inputs (cursor/limit/days)
 *
 * ✔ Cursor:
 * - base64url encoded JSON: { releaseDate, releasedObjectId }
 * - releaseDate is stored in MySQL DATETIME format (NOT ISO) to avoid timezone issues
 */

import { mysqlPool, logger } from "@mycompanyname/lib-common";
import type { AlbumType } from "../../../catalog/albums/types/album.model";
import type {
  WhatsNewOutput,
  WhatsNewItem,
  WhatsNewActor,
  WhatsNewObject,
} from "../types";

const LOG_SCOPE = "feeds.whats-new.v1.repository";

/**
 * Main query: fetch "What's New" albums for user
 */
export async function getWhatsNewFeeds(
  userId: string,
  days: number,
  limit: number,
  cursor?: string // optional → more flexible API
): Promise<WhatsNewOutput> {
  // Build cursor SQL condition (keyset pagination)
  const { sql: cursorSql, params: cursorParams } = cursorPredicate(cursor ?? "");

  /**
   * Strategy:
   * 1. page_albums → select distinct albums (paged)
   * 2. join artists → expand rows (one row per artist)
   * 3. aggregate in Node → group artists under album
   */
  const sql = `
    WITH page_albums AS (
      SELECT a2.id, a2.released_at
      FROM likes l
      JOIN album_artists aa ON aa.artist_id = l.entity_id
      JOIN albums a2 ON a2.id = aa.album_id
      WHERE l.user_id = ?
        AND l.entity_type = 'artist'
        AND l.deleted_at IS NULL
        AND a2.deleted_at IS NULL
        AND a2.released_at IS NOT NULL
        AND a2.released_at >= CURDATE() - INTERVAL ? DAY
        ${cursorSql}
      GROUP BY a2.id, a2.released_at
      ORDER BY a2.released_at DESC, a2.id ASC
      LIMIT ?
    )
    SELECT
      a.id AS album_id,
      a.name AS album_name,
      a.image_url AS album_image_url,
      a.album_type,
      a.released_at,
      ar.id AS artist_id,
      ar.name AS artist_name
    FROM page_albums pa
    JOIN albums a ON a.id = pa.id
    JOIN album_artists aa ON aa.album_id = a.id
    JOIN artists ar ON ar.id = aa.artist_id
    WHERE ar.deleted_at IS NULL
    ORDER BY pa.released_at DESC, pa.id ASC, ar.id ASC -- deterministic artist order
  `;

  // Fetch limit + 1 → to detect "hasMore"
  const params: unknown[] = [userId, days, ...cursorParams, limit + 1];

  logger.debug(`${LOG_SCOPE}.getWhatsNewFeeds`, {
    sql: sql.replace(/\s+/g, " ").trim(),
    params,
  });

  const [rows] = await mysqlPool.query(sql, params);

  return rowsToPage(rows as Record<string, unknown>[], limit);
}

/**
 * Build SQL predicate for cursor-based pagination
 *
 * Paging rule (keyset):
 * (released_at DESC, id ASC)
 *
 * Next page condition:
 * released_at < cursorDate
 * OR (released_at = cursorDate AND id > cursorId)
 */
function cursorPredicate(raw: string): { sql: string; params: string[] } {
  if (!raw?.trim()) return { sql: "", params: [] };

  const d = decodeCursor(raw.trim());

  // IMPORTANT: do NOT silently ignore invalid cursor
  if (!d) {
    throw new Error("Invalid cursor"); // service should convert to HTTP 400
  }

  return {
    sql: `AND (a2.released_at < ? OR (a2.released_at = ? AND a2.id > ?))`,
    params: [d.releaseDate, d.releaseDate, d.releasedObjectId],
  };
}

/**
 * Internal aggregation model (album + its artists)
 */
type AlbumAgg = {
  albumId: string;
  albumName: string;
  imageUrl: string;
  albumType: AlbumType;
  releasedAt: Date;
  artists: WhatsNewActor[];
};

/**
 * Convert flat SQL rows → paginated domain output
 */
function rowsToPage(
  rowList: Record<string, unknown>[],
  limit: number
): WhatsNewOutput {
  const byAlbum = new Map<string, AlbumAgg>();

  for (const r of rowList) {
    const albumId = String(r.album_id ?? "");
    const artistId = String(r.artist_id ?? "");
    const artistName = String(r.artist_name ?? "");

    let row = byAlbum.get(albumId);

    // First time seeing this album → create aggregate object
    if (!row) {
      const at = String(r.album_type ?? "album");

      row = {
        albumId,
        albumName: String(r.album_name ?? ""),
        imageUrl: r.album_image_url != null ? String(r.album_image_url) : "",
        albumType: at === "single" || at === "compilation" ? at : "album",
        releasedAt:
          r.released_at instanceof Date
            ? r.released_at
            : new Date(String(r.released_at)),
        artists: [],
      };

      byAlbum.set(albumId, row);
    }

    // Deduplicate artists per album
    if (!row.artists.some((a) => a.id === artistId)) {
      row.artists.push({ type: "artist", id: artistId, name: artistName });
    }
  }

  const albums = Array.from(byAlbum.values());

  // Detect if there is another page
  const hasMore = albums.length > limit;

  // Keep only requested page
  const page = albums.slice(0, limit);

  /**
   * Map to API output
   */
  const items: WhatsNewItem[] = page.map((e) => ({
    feedActors: e.artists,
    feedVerb: "released",
    feedObject: toAlbumFeedObject(e),
    eventOccurredAt: e.releasedAt.toISOString(), // API format (ISO)
  }));

  const last = page[page.length - 1];

  return {
    items,
    cursor:
      hasMore && last
        ? encodeCursor(
            toMysqlDatetime(last.releasedAt), // IMPORTANT: DB-compatible format
            last.albumId
          )
        : undefined,
  };
}

/**
 * Map internal album → API feed object
 */
function toAlbumFeedObject(e: AlbumAgg): WhatsNewObject {
  return {
    type: "album", // main object type
    id: e.albumId,
    title: e.albumName,
    imageUrl: e.imageUrl,
    albumType: e.albumType, // subtype (album/single/compilation)
  };
}

/**
 * Convert JS Date → MySQL DATETIME string (UTC)
 *
 * Example:
 * 2026-03-21T10:20:30.000Z → "2026-03-21 10:20:30"
 *
 * WHY:
 * - avoids timezone issues
 * - ensures stable cursor comparison in SQL
 */
function toMysqlDatetime(date: Date): string {
  return date.toISOString().slice(0, 19).replace("T", " ");
}

/**
 * Encode cursor → base64url(JSON)
 */
function encodeCursor(releaseDate: string, releasedObjectId: string): string {
  return Buffer.from(
    JSON.stringify({ releaseDate, releasedObjectId }),
    "utf-8"
  ).toString("base64url");
}

/**
 * Decode cursor
 */
function decodeCursor(cursor: string): {
  releaseDate: string;
  releasedObjectId: string;
} | null {
  if (!cursor?.trim()) return null;

  try {
    const p = JSON.parse(
      Buffer.from(cursor, "base64url").toString("utf-8")
    ) as Record<string, unknown>;

    if (
      typeof p.releaseDate === "string" &&
      typeof p.releasedObjectId === "string"
    ) {
      return {
        releaseDate: p.releaseDate,
        releasedObjectId: p.releasedObjectId,
      };
    }
  } catch {
    // invalid cursor → handled by caller
  }

  return null;
}