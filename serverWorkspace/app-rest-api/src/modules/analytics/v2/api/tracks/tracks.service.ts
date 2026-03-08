import { requireAuthenticated } from "@mycompanyname/lib-common";
import * as tracksRepo from "./tracks.repository";
import { tracksService } from "../../../../catalog/albums/tracks";

/**
* Record a play event for a track. Validates track exists, then appends one row to track_events
 * with event_type = 'play', user_id, track_id (same as v3). Worker expands via track_artists.
 *
 * We normally enrich events at ingest (e.g. add artist_id to the event table or message), since that
 * avoids extra lookups in the worker (or queue consumer). When enrichment would create multiple rows
 * or messages per logical occurrence, we skip it at ingest and enrich in the worker instead. A track
 * can have many artists (track_artists); adding artist_id at ingest would mean multiple rows per play,
 * making downstream processing harder (e.g. counting track total plays when reading batches). So we do not
 * store artist_id here—one play, one row. The worker joins with track_artists to attribute plays to artists.
 *
 * @param userId - Authenticated user ID (from request context)
 * @param trackId - Track UUID (from path)
 * @throws NotFoundError if track does not exist or is soft-deleted (or its album)
 */
export async function recordTrackPlayEvent(
  userId: string,
  trackId: string
): Promise<void> {
  requireAuthenticated();

  await tracksService.getTrackById(trackId); // validate track exists (404 if not)
  await tracksRepo.createTrackPlayEvent(userId, trackId);
}
