import { requireAuthenticated } from "@mycompanyname/lib-common";
import * as tracksRepo from "./tracks.repository";
import { tracksService  } from "../../../../catalog/tracks";
import { Track } from "../../../../catalog/tracks/types/track.model";

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

  const track: Track = await tracksService.getTrackById(trackId);  //Exception is thrown if track does not exist or is soft-deleted (or its album/artist)
  await tracksRepo.createTrackPlayEvent(userId, trackId, track.artistId);
}
