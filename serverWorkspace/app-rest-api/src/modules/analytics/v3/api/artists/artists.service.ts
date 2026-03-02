/**
 * Analytics v3 artists API. Exposes artist stats read for artist overview (catalog calls in-process).
 */
import * as artistsRepo from "./artists.repository";
import type { ArtistStats, ArtistTrackStats } from "./types";

export type { ArtistStats, ArtistTrackStats } from "./types";

export async function getArtistStats(
  artistId: string
): Promise<ArtistStats | null> {
  return artistsRepo.getArtistStats(artistId);
}

export async function getTopTrackStatsByArtistId(
  artistId: string,
  limit: number
): Promise<ArtistTrackStats[]> {
  return artistsRepo.getTopTrackStatsByArtistId(artistId, limit);
}
