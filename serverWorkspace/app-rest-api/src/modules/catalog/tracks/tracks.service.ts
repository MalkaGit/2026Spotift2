import { NotFoundError } from "@mycompanyname/lib-common";
import * as trackRepo from "./tracks.repository";
import type { Track } from "./types/track.model";
import { TrackErrorCode } from "./tracks.error.codes";

/**
 * Get track by id. Throws NotFoundError if track or album is not found or soft-deleted.
 */
export async function getTrackById(trackId: string): Promise<Track> {
  const track = await trackRepo.getTrackById(trackId);
  if (track === null) {
    throw new NotFoundError(
      TrackErrorCode.TRACK_NOT_FOUND,
      "Track not found"
    );
  }
  return track;
}
