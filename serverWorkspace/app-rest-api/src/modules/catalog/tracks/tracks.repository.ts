import { mysqlPool } from "@mycompanyname/lib-common";
import type { Track } from "./types/track.model";

/**
 * Get track by id. Returns null if track or album is not found or soft-deleted.
 */
export async function getTrackById(trackId: string): Promise<Track | null> {
  const sql = `
    SELECT t.id, t.name, t.duration_ms AS durationMs, a.artist_id AS artistId
    FROM tracks t
    JOIN albums a ON t.album_id = a.id AND a.deleted_at IS NULL
    WHERE t.id = ? AND t.deleted_at IS NULL
    LIMIT 1
  `;
  const [rows] = await mysqlPool.query(sql, [trackId]);
  const result = rows as { id: string; name: string; durationMs: number; artistId: string }[];
  if (result.length === 0) return null;
  const row = result[0];
  return {
    id: row.id,
    name: row.name,
    durationMs: Number(row.durationMs ?? 0),
    artistId: row.artistId,
  };
}

/**
 * Returns artist ids for a track from track_artists (ordered by artist_id).
 * Used by analytics when recording a play: one track_events row is written per artist.
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
