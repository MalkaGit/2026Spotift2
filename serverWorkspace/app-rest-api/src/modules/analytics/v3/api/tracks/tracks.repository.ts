//Write to events table
import { mysqlPool, logger } from "@mycompanyname/lib-common";

/**
 * Insert one 'play' event row into track_events (one row per play). occurred_at defaults to CURRENT_TIMESTAMP.
 */
export async function createTrackPlayEvent(
  userId: string,
  trackId: string
): Promise<void> {
  const sql = `
    INSERT INTO track_events (event_type, user_id, track_id)
    VALUES ('play', ?, ?)
  `;
  logger.debug("createTrackPlayEvent", { trackId });
  await mysqlPool.query(sql, [userId, trackId]);
}
