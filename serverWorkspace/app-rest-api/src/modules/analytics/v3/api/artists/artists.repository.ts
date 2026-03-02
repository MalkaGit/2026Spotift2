import { mysqlPool, logger } from "@mycompanyname/lib-common";
import type { ArtistStats, ArtistTrackStats } from "./types";


/**
 * Get artist_stats row by artist_id. Returns null if no row.
 * Single-table read; no join.
 */
export async function getArtistStats(
  artistId: string
): Promise<ArtistStats | null> {
  const sql = `
    SELECT monthly_listeners AS monthlyListeners, total_plays AS totalPlays
    FROM artist_stats
    WHERE artist_id = ?
    LIMIT 1
  `;
  const params = [artistId];
  logger.debug("analytics.artists.getArtistStats - SQL query", { sql, params });
  const [rows] = await mysqlPool.query(sql, params);
  const list = rows as Record<string, unknown>[];
  if (list.length === 0) return null;
  return mapRowToArtistStats(list[0]);
}

/**
 * Get top track stats for an artist from artist_top_tracks_stats only (no join).
 * Returns (track_id, total_plays) ordered by total_plays DESC.
 */
export async function getTopTrackStatsByArtistId(
  artistId: string,
  limit: number
): Promise<ArtistTrackStats[]> {
  const sql = `
    SELECT track_id AS trackId, total_plays AS totalPlays
    FROM artist_top_tracks_stats
    WHERE artist_id = ?
    ORDER BY total_plays DESC
    LIMIT ?
  `;
  const params = [artistId, limit];
  logger.debug("analytics.artists.getTopTrackStatsByArtistId - SQL query", { sql, params });
  const [rows] = await mysqlPool.query(sql, params);
  return (rows as Record<string, unknown>[]).map(mapRowToTrackStats);
}


function mapRowToArtistStats(row: Record<string, unknown>): ArtistStats {
  return {
    monthlyListeners: Number(row.monthlyListeners ?? 0),
    totalPlays: Number(row.totalPlays ?? 0),
  };
}

function mapRowToTrackStats(row: Record<string, unknown>): ArtistTrackStats {
  return {
    trackId: String(row.trackId ?? ""),
    totalPlays: Number(row.totalPlays ?? 0),
  };
}
