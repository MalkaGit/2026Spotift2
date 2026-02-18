import * as artistsRepo from "./artists.repository";
import { requireAuthenticated, requireRole } from "@mycompanyname/lib-common";
import { ForbiddenError, NotFoundError } from "@mycompanyname/lib-common";
import { ArtistEntity, ArtistStatEntity } from "./artists.repository";
import { ArtistOverviewQueryInput, ArtistOverviewOutput } from "./types";
import { ArtistsErrorCode } from "./artists.error.codes";


/**
 * Delete an artist using a transaction that also deletes all likes for that artist.
 * Only the user who owns the artist (artists.user_id) can delete.
 *
 * @param userId - Authenticated user ID (from request context)
 * @param artistId - Artist UUID
 * @returns true if the artist existed and was deleted, false if not found (allowing controller to return 404 or 204)
 * @throws ForbiddenError if artist exists but user_id !== userId
 */
export async function deleteArtist(
  userId: string,
  artistId: string
): Promise<boolean> {
  requireAuthenticated();

  const artist: ArtistEntity | null = await artistsRepo.findById(artistId);

  // BL: Artist not found
  if (!artist) {
    return false;
  }

  // BL: Artist exists but is not owned by the current user
  if (artist.userId !== userId) {
    throw new ForbiddenError("You can only delete artists you manage.");
  }

  // BL: perform transactional delete (Artist exists and is owned by the user)
  await artistsRepo.deleteByIdCascade(artistId);
  return true;
}



/**
 * Operation: Get artist overview with stats information.
 *
 * Notes:
 * - User authentication is handled by JWT middleware (userId extracted from token).
 * - Structural validation (defaults, ranges) is handled by request validation middleware.
 * - Authorization: only users with "listener" role can access this overview.
 *
 * @param artistId - Artist UUID
 * @param query - Query input (e.g. topTracksLimit)
 * @returns ArtistOverviewOutput for the given artist
 * @throws UnauthorizedError (401) if user is not authenticated
 * @throws ForbiddenError (403) if user is authenticated but not authorized (listener role required)
 * @throws NotFoundError if artist does not exist or is soft-deleted
 */
export async function getArtistOverview(
  artistId: string,
  query: ArtistOverviewQueryInput
): Promise<ArtistOverviewOutput> {

  // BL: Authentication & Authorization - user must be authenticated and have listener role
  requireRole(["listener"]);

  // BL: Find artist by ID
  const artist : ArtistEntity | null = await artistsRepo.findById(artistId);
  if (!artist) {
    throw new NotFoundError(
      ArtistsErrorCode.ARTIST_NOT_FOUND,
      `Artist with id ${artistId} not found`
    );
  }

  // BL: Get artist stats and top tracks (using artist repository !)
  const [artistStats, artistTopTracks] = await Promise.all([
    artistsRepo.getArtistStats(artistId),
    artistsRepo.getArtistTopTracks(artistId, query.topTracksLimit),
  ]);

  // BL: Create overview output
  const overview: ArtistOverviewOutput = {
    artistId: artist.id,
    artistName: artist.name,
    headerImageUrl: artist.headerImageUrl,
    actionBarImageUrl: artist.actionBarImageUrl,
    monthlyListeners: artistStats?.monthlyListeners ?? 0,
    topTracks: artistTopTracks,
  };

  return overview;
}








/**
 * OLDER VERSION OF DELETE ARTIST - DELETE ARTIST WITH NO TRANSACTION
 * Delete an artist using the legacy V1 behaviour (no transaction, does not delete likes).
 * This is kept for reference and potential future reuse.
 */
/*
export async function deleteArtist(
  userId: string,
  artistId: string
): Promise<boolean> {
  requireAuthenticated();

  const artist: ArtistEntity | null = await artistsRepo.findById(artistId);

  // Artist not found
  if (!artist) {
    return false;
  }

  // Artist exists but is not owned by the current user
  if (artist.userId !== userId) {
    throw new ForbiddenError("You can only delete artists you manage.");
  }

  // Artist exists and is owned by the user - perform delete (artist only, no likes)
  await artistsRepo.deleteById(artistId);
  return true;
}
*/
