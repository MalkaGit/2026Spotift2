import { NotFoundError } from "@mycompanyname/lib-common";
import * as trackRepo from "./tracks.repository";
import { Track, TrackDetails } from "./types";
import { TrackErrorCode } from "./tracks.error.codes";

/**
 * Returns the track (with nested album) by id. Throws NotFoundError if track or album is not found or soft-deleted.
 *
 * Boundary: today album and track are in catalog (same DB), so a single query with join is used.
 * If track and album move to different services, the implementation can switch to calling the
 * album service without changing this method's contract.
 */
export async function getTrackById(trackId: string): Promise<TrackDetails> {
  const result = await trackRepo.getTrackById(trackId);
  if (result === null) {
    throw new NotFoundError(
      TrackErrorCode.TRACK_NOT_FOUND,
      "Track not found"
    );
  }
  return result;
}


/**
 * Get tracks by ids (tracks table only, no join). Returns only existing non-deleted tracks.
 * Used by artist overview v3; caller composes with getAlbumsByIds for album data.
 */
export async function getTracksByIds(
  trackIds: string[]
): Promise<Map<string, Track>> {
  return trackRepo.getTracksByIds(trackIds);
}

/**
 * Returns artist ids for a track.
 * Empty array if the track has no rows in track_artists.
 */
export async function getArtistIdsForTrack(trackId: string): Promise<string[]> {
  return trackRepo.getArtistIdsForTrack(trackId);
}

/**
 * Returns artist ids per track id for the given track ids. Empty input → empty Map.
 * Used by analytics (e.g. worker or v1 API) to expand play events via track_artists.
 */
export async function getArtistIdsByTrackIds(
  trackIds: string[]
): Promise<Map<string, string[]>> {
  return trackRepo.getArtistIdsByTrackIds(trackIds);
}
