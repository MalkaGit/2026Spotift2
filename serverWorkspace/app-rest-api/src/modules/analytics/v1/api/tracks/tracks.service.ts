/**
 * v1 play-track service: validate track, resolve artists + track/album, then update projection
 * tables in one transaction. No event table or worker; see _plans/uc00011-backend-play-track-operation-v1.plan.md.
 */
import { requireAuthenticated } from "@mycompanyname/lib-common";
import { tracksService } from "../../../../catalog/tracks";
import * as tracksRepo from "./tracks.repository.js";

/**
 * Applies a play for the given track by updating all v1 projection tables in one transaction
 * (track_stats, artist_stats total_plays, artist_top_tracks_stats, artist_top_tracks_denorm).
 * Does not update artist_stats.monthly_listeners.
 *
 * @throws NotFoundError if track does not exist or is soft-deleted (or its album)
 */
export async function applyTrackPlay(trackId: string): Promise<void> {
  requireAuthenticated();

  const track = await tracksService.getTrackById(trackId);
  const artistIds = await tracksService.getArtistIdsForTrack(trackId);
  await tracksRepo.applyTrackPlay(trackId, artistIds, track, track.album);
}
