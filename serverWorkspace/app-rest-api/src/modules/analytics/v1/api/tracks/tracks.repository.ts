/**
 * v1 play-track: direct updates to projection tables in one transaction.
 * No event table; no worker. Reads track_artists; writes track_stats, artist_stats,
 * artist_top_tracks_stats, artist_top_tracks_denorm.
 */
import { mysqlPool, logger, type MySqlConnection } from "@mycompanyname/lib-common";
import type { Album } from "../../../../catalog/albums";
import type { TrackDetails } from "../../../../catalog/albums/tracks/types/track.details.model";

/**
 * In one transaction:
 * upsert track_stats (+1), 
 * artist_stats total_plays (+1 per artist),
 * artist_top_tracks_stats (+1 per artist/track),
 * artist_top_tracks_denorm (+1 with track/album fields).
 * Does not update artist_stats.monthly_listeners (v1).
 */
export async function applyTrackPlay(
  trackId: string,
  artistIds: string[],
  track: TrackDetails,
  album: Album
): Promise<void> {
  let connection: MySqlConnection | undefined;
  try {
    connection = await mysqlPool.getConnection();
    await connection.beginTransaction();

    // 1. track_stats: +1 for this track
    await connection.query(
      `INSERT INTO track_stats (track_id, total_count) VALUES (?, 1)
       ON DUPLICATE KEY UPDATE total_count = total_count + 1, updated_at = CURRENT_TIMESTAMP`,
      [trackId]
    );

    // 2. artist_stats: +1 total_plays per artist (do not touch monthly_listeners)
    for (const artistId of artistIds) {
      await connection.query(
        `INSERT INTO artist_stats (artist_id, total_plays, monthly_listeners) VALUES (?, 1, 0)
         ON DUPLICATE KEY UPDATE total_plays = total_plays + 1, updated_at = CURRENT_TIMESTAMP`,
        [artistId]
      );
    }

    // 3. artist_top_tracks_stats: +1 per (artist_id, track_id)
    for (const artistId of artistIds) {
      await connection.query(
        `INSERT INTO artist_top_tracks_stats (artist_id, track_id, total_plays) VALUES (?, ?, 1)
         ON DUPLICATE KEY UPDATE total_plays = total_plays + 1`,
        [artistId, trackId]
      );
    }

    // 4. artist_top_tracks_denorm: +1 with track/album fields (mapped from domain models)
    for (const artistId of artistIds) {
      await connection.query(
        `INSERT INTO artist_top_tracks_denorm (artist_id, track_id, track_name, duration_ms, album_id, album_image_url, total_plays)
         VALUES (?, ?, ?, ?, ?, ?, 1)
         ON DUPLICATE KEY UPDATE total_plays = total_plays + 1`,
        [
          artistId,
          trackId,
          track.name,
          track.durationMs,
          album.id,
          album.imageUrl,
        ]
      );
    }

    await connection.commit();
    logger.debug("v1 applyTrackPlay committed", { trackId, artistCount: artistIds.length });
  } catch (err) {
    if (connection) {
      try {
        await connection.rollback();
      } catch (rollbackErr) {
        logger.error("v1 applyTrackPlay rollback failed", { error: rollbackErr });
      }
    }
    throw err;
  } finally {
    if (connection) {
      connection.release();
    }
  }
}
