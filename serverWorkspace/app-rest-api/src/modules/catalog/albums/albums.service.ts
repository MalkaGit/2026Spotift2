import * as albumsRepo from "./albums.repository";
import type { Album } from "./types/album.model";

/**
 * Get albums by ids (albums table only, no join). Returns only existing non-deleted albums.
 * Used by artist overview v3; caller composes with getTracksByIds for track data.
 */
export async function getAlbumsByIds(
  albumIds: string[]
): Promise<Map<string, Album>> {
  return albumsRepo.getAlbumsByIds(albumIds);
}
