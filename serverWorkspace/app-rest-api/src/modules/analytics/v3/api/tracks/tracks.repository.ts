import { mysqlPool, logger } from "@mycompanyname/lib-common";

/**
 * Insert a row into track_play_events. played_at defaults to CURRENT_TIMESTAMP.
 */
export async function createTrackPlayEvent(
  userId: string,
  trackId: string,
  artistId: string
): Promise<void> {
  const sql = `
    INSERT INTO track_play_events (user_id, track_id, artist_id)
    VALUES (?, ?, ?)
  `;
  const params = [userId, trackId, artistId];
  logger.debug("createTrackPlayEvent", { sql, params });
  await mysqlPool.query(sql, params);
}
