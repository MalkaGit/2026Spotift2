import { NotFoundError } from "@mycompanyname/lib-common";
import * as trackRepo from "./tracks.repository";
import type { Track } from "./types/track.model";
import { TrackErrorCode } from "./tracks.error.codes";

/**
 * Returns the track by id. Throws NotFoundError if track or album is not found or soft-deleted.
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

/**
 * Returns artist ids for a track.
 * Empty array if the track has no rows in track_artists.
 */
export async function getArtistIdsForTrack(trackId: string): Promise<string[]> {
  return trackRepo.getArtistIdsForTrack(trackId);
}

/**
 * Returns artist ids for the given track ids  for the given track ids. 
 * Empty input → empty Map.
 * Used by analytics worker to expand play events via track_artists.
 */
export async function getArtistIdsByTrackIds(
  trackIds: string[]
): Promise<Map<string, string[]>> {
  return trackRepo.getArtistIdsByTrackIds(trackIds);
}
