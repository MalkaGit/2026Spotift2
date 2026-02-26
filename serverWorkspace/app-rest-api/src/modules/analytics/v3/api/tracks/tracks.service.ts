import { requireAuthenticated } from "@mycompanyname/lib-common";
import * as tracksRepo from "./tracks.repository.js";
import { tracksService } from "../../../../catalog/tracks";

/**
 * Record a play event for a track.
 *
 * @param userId - Authenticated user ID (from request context)
 * @param trackId - Track UUID (from path)
 * @throws NotFoundError if track does not exist or is soft-deleted (or its album/artist)
 */
export async function recordTrackPlayEvent(
  userId: string,
  trackId: string
): Promise<void> {
  requireAuthenticated();

  const track = await tracksService.getTrackById(trackId);  //Throws NotFoundError if track does not exist or is soft-deleted (or its album/artist)
  await tracksRepo.createTrackPlayEvent(userId, trackId, track.artistId);
}
