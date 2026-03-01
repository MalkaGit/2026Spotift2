/**
 * v2 tracks API repository: write play events to track_events (same table as v3).
 */
import { mysqlPool, logger } from "@mycompanyname/lib-common";

/**
 * Append one row to track_events with event_type = 'play', user_id, track_id. occurred_at defaults to CURRENT_TIMESTAMP.
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
