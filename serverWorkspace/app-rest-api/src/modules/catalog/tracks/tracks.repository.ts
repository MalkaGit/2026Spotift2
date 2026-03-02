import { mysqlPool, logger } from "@mycompanyname/lib-common";
import type { Track, TrackDetails } from "./types";

/** Map raw query row to TrackDetails (explicit coercion for runtime safety). */
function mapRowToTrackDetails(row: Record<string, unknown>): TrackDetails {
  return {
    id: String(row.id ?? ""),
    name: String(row.name ?? ""),
    durationMs: Number(row.durationMs ?? 0),
    album: {
      id: String(row.albumId ?? ""),
      name: String(row.albumName ?? ""),
      imageUrl: row.albumImageUrl != null ? String(row.albumImageUrl) : null,
    },
  };
}

/**
 * Get track and its album by id (single join). Returns null if track or album is not found or soft-deleted.
 */
export async function getTrackById(trackId: string): Promise<TrackDetails | null> {
  const sql = `
    SELECT t.id, t.name, t.duration_ms AS durationMs, t.album_id AS albumId,
           a.name AS albumName, a.image_url AS albumImageUrl
    FROM tracks t
    JOIN albums a ON t.album_id = a.id AND a.deleted_at IS NULL
    WHERE t.id = ? AND t.deleted_at IS NULL
    LIMIT 1
  `;
  const [rows] = await mysqlPool.query(sql, [trackId]);
  const list = rows as Record<string, unknown>[];
  if (list.length === 0) return null;
  return mapRowToTrackDetails(list[0]);
}

/**
 * Returns artist ids for a track from track_artists (ordered by artist_id).
 */
export async function getArtistIdsForTrack(trackId: string): Promise<string[]> {
  const sql = `
    SELECT artist_id
    FROM track_artists
    WHERE track_id = ?
    ORDER BY artist_id
  `;
  const [rows] = await mysqlPool.query(sql, [trackId]);
  return (rows as { artist_id: string }[]).map((r) => r.artist_id);
}

/**
 * Returns artist ids per track_id for the given track ids (batch). Empty input → empty Map.
 * Used by analytics worker to expand play events to (artist_id, track_id) via track_artists.
 */
export async function getArtistIdsByTrackIds(
  trackIds: string[]
): Promise<Map<string, string[]>> {
  if (trackIds.length === 0) return new Map();
  const unique = [...new Set(trackIds)];
  const placeholders = unique.map(() => "?").join(", ");
  const sql = `
    SELECT track_id, artist_id
    FROM track_artists
    WHERE track_id IN (${placeholders})
    ORDER BY track_id, artist_id
  `;
  const [rows] = await mysqlPool.query(sql, unique);
  const list = rows as { track_id: string; artist_id: string }[];
  const map = new Map<string, string[]>();
  for (const row of list) {
    const arr = map.get(row.track_id) ?? [];
    arr.push(row.artist_id);
    map.set(row.track_id, arr);
  }
  return map;
}

/**
 * Get tracks by ids from tracks table only. No join to albums.
 * Returns only non-deleted tracks. Empty input → empty Map.
 */
export async function getTracksByIds(
  trackIds: string[]
): Promise<Map<string, Track>> {
  if (trackIds.length === 0) return new Map();
  const unique = [...new Set(trackIds)];
  const placeholders = unique.map(() => "?").join(", ");
  const sql = `
    SELECT id, name, duration_ms AS durationMs, album_id AS albumId
    FROM tracks
    WHERE id IN (${placeholders}) AND deleted_at IS NULL
  `;
  const params = unique;
  logger.debug("tracks.getTracksByIds - SQL query", { sql, params });
  const [rows] = await mysqlPool.query(sql, params);
  const list = (rows as Record<string, unknown>[]).map(mapRowToTrack);
  const map = new Map<string, Track>();
  for (const track of list) {
    map.set(track.id, track);
  }
  return map;
}

/** Map raw query row to Track (explicit coercion for runtime safety). */
function mapRowToTrack(row: Record<string, unknown>): Track {
  return {
    id: String(row.id ?? ""),
    name: String(row.name ?? ""),
    durationMs: Number(row.durationMs ?? 0),
    albumId: String(row.albumId ?? ""),
  };
}


