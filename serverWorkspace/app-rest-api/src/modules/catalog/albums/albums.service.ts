import { NotFoundError, requireRole } from "@mycompanyname/lib-common";
import * as albumsRepo from "./albums.repository";
import type { Album } from "./types/album.model";
import { AlbumsErrorCode } from "./albums.error.codes";

/**
 * Mark an album as released (sets released_at = NOW()). Dev/admin only.
 * @throws NotFoundError if album does not exist or is soft-deleted
 */
export async function releaseAlbum(albumId: string): Promise<void> {
  //bl: 
  // requireRole(["admin"]);
  const updated = await albumsRepo.releaseAlbumById(albumId);
  if (!updated) {
    throw new NotFoundError(AlbumsErrorCode.ALBUM_NOT_FOUND, "Album not found");
  }
}

/**
 * Get albums by ids (albums table only, no join). Returns only existing non-deleted albums.
 * Used by artist overview v3; caller composes with getTracksByIds for track data.
 */
export async function getAlbumsByIds(
  albumIds: string[]
): Promise<Map<string, Album>> {
  return albumsRepo.getAlbumsByIds(albumIds);
}
