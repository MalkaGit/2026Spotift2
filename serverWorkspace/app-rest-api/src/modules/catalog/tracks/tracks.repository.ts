import { mysqlPool } from "@mycompanyname/lib-common";
import type { Track } from "./types/track.model";

/**
 * Get track and its album by id (single join). Returns null if track or album is not found or soft-deleted.
 */
export async function getTrackById(trackId: string): Promise<Track | null> {
  const sql = `
    SELECT t.id, t.name, t.duration_ms AS durationMs, t.album_id AS albumId,
           a.name AS albumName, a.image_url AS albumImageUrl
    FROM tracks t
    JOIN albums a ON t.album_id = a.id AND a.deleted_at IS NULL
    WHERE t.id = ? AND t.deleted_at IS NULL
    LIMIT 1
  `;
  const [rows] = await mysqlPool.query(sql, [trackId]);
  const result = rows as {
    id: string;
    name: string;
    durationMs: number;
    albumId: string;
    albumName: string;
    albumImageUrl: string | null;
  }[];
  if (result.length === 0) return null;
  const row = result[0];
  return {
    id: row.id,
    name: row.name,
    durationMs: Number(row.durationMs ?? 0),
    album: {
      id: row.albumId,
      name: row.albumName,
      imageUrl: row.albumImageUrl ?? null,
    },
  };
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
