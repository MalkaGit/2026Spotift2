import * as artistsRepo from "./artists.repository";
import { requireAuthenticated } from "@mycompanyname/lib-common";
import { ForbiddenError } from "@mycompanyname/lib-common";
import { ArtistEntity } from "./artists.repository";


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
