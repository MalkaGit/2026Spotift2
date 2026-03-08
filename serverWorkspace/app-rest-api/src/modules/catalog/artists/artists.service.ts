import { tracksService } from "../albums/tracks";
import { albumsService } from "../albums";
import * as artistsRepo from "./artists.repository";
import { requireAuthenticated, requireRole } from "@mycompanyname/lib-common";
import { ForbiddenError, NotFoundError } from "@mycompanyname/lib-common";
import type { Artist } from "./types";
import { ArtistOverviewQueryInput, ArtistOverviewOutput } from "./types";
import { ArtistsErrorCode } from "./artists.error.codes";
import * as likesService from "../../likes";
import { LIKED_ENTITY_ARTIST } from "../../likes/types";
import { artistsService } from "../../analytics/v3/api/artists";


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

  const artist: Artist | null = await artistsRepo.findById(artistId);

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
 * Operation: Get artist overview with  like and stats information.
 *
 * Notes:
 * - User authentication is handled by JWT middleware (userId extracted from token).
 * - Structural validation (defaults, ranges) is handled by request validation middleware.
 * - Authorization: only users with "listener" role can access this overview.
 *
 * @param userId - Authenticated user ID (from request context)
 * @param artistId - Artist UUID
 * @param query - Query input (e.g. topTracksLimit)
 * @returns ArtistOverviewOutput for the given artist
 * @throws UnauthorizedError (401) if user is not authenticated
 * @throws ForbiddenError (403) if user is authenticated but not authorized (listener role required)
 * @throws NotFoundError if artist does not exist or is soft-deleted
 */
export async function getArtistOverview(
  userId: string,
  artistId: string,
  query: ArtistOverviewQueryInput
): Promise<ArtistOverviewOutput> {

  // BL: Authentication & Authorization - user must be authenticated and have listener role
  requireRole(["listener"]);

  // BL: Find artist by ID
  const artist: Artist | null = await artistsRepo.findById(artistId);
  if (!artist) {
    throw new NotFoundError(
      ArtistsErrorCode.ARTIST_NOT_FOUND,
      `Artist with id ${artistId} not found`
    );
  }

  // BL: Get is liked (via likesService), artist stats, and top tracks
  const [isLiked, artistStats, artistTopTracks] = await Promise.all([
    likesService.likeExists(userId, LIKED_ENTITY_ARTIST, artistId),         //:-) artist service calling likes service keeps boundary clear - no need to know how likes are implemented
    artistsRepo.getArtistStats(artistId),                                    //:-) artist service calling artist repository keeps boundary clear - no need to know how artist stats are implemented
    artistsRepo.getArtistTopTracks_V1_join(artistId, query.topTracksLimit),          //:-) artist service calling artist repository keeps boundary clear - no need to know how artist top tracks are implemented
  ]);

  // BL: Create overview output
  const overview: ArtistOverviewOutput = {
    artistId: artist.id,
    artistName: artist.name,
    headerImageUrl: artist.headerImageUrl,
    actionBarImageUrl: artist.actionBarImageUrl,
    isLiked,
    monthlyListeners: artistStats?.monthlyListeners ?? 0,
    totalPlays: artistStats?.totalPlays ?? 0,
    topTracks: artistTopTracks,
  };

  return overview;
}

/**
 * Get artist overview (v2) – top tracks from projection table, no join.
 * Same contract as getArtistOverview; only the top-tracks data source differs.
 */
export async function getArtistOverviewV2(
  userId: string,
  artistId: string,
  query: ArtistOverviewQueryInput
): Promise<ArtistOverviewOutput> {
  requireRole(["listener"]);

  const artist: Artist | null = await artistsRepo.findById(artistId);
  if (!artist) {
    throw new NotFoundError(
      ArtistsErrorCode.ARTIST_NOT_FOUND,
      `Artist with id ${artistId} not found`
    );
  }

  const [isLiked, artistStats, artistTopTracks] = await Promise.all([
    likesService.likeExists(userId, LIKED_ENTITY_ARTIST, artistId),
    artistsRepo.getArtistStats(artistId),
    artistsRepo.getArtistTopTracks_v2_denorm(artistId, query.topTracksLimit),
  ]);

  return {
    artistId: artist.id,
    artistName: artist.name,
    headerImageUrl: artist.headerImageUrl,
    actionBarImageUrl: artist.actionBarImageUrl,
    isLiked,
    monthlyListeners: artistStats?.monthlyListeners ?? 0,
    totalPlays: artistStats?.totalPlays ?? 0,
    topTracks: artistTopTracks,
  };
}

/**
 * Get artist overview (v3) – MS-ready: no join, no denorm. Get IDs from stat tables,
 * call catalog for tracks and albums by ids, compose in service.
 */
export async function getArtistOverviewV3(
  userId: string,
  artistId: string,
  query: ArtistOverviewQueryInput
): Promise<ArtistOverviewOutput> {
  requireRole(["listener"]);

  const artist: Artist | null = await artistsRepo.findById(artistId);
  if (!artist) {
    throw new NotFoundError(
      ArtistsErrorCode.ARTIST_NOT_FOUND,
      `Artist with id ${artistId} not found`
    );
  }

  // BL: Get artist stats and top track stats (MS-ready: analytics calls artists service, no join)
  const [artistStats, topTrackStats] = await Promise.all([
    artistsService.getArtistStats(artistId),
    artistsService.getTopTrackStatsByArtistId(artistId, query.topTracksLimit),
  ]);

  // BL: Get tracks by ids (MS-ready: catalog calls tracks service, no join)
  const trackIds = topTrackStats.map((s) => s.trackId);
  const tracksMap = await tracksService.getTracksByIds(trackIds);

  //BL: Get albums by ids (MS-ready: catalog calls albums service, no join)
  const albumIds = [...new Set([...tracksMap.values()].map((t) => t.albumId))];
  const albumsMap = await albumsService.getAlbumsByIds(albumIds);

  // BL: Create top tracks with album details
  const isLiked = await likesService.likeExists(userId, LIKED_ENTITY_ARTIST, artistId);

  const topTracks = [];
  let rank = 0;
  for (const stat of topTrackStats) {
    const track = tracksMap.get(stat.trackId);
    const album = track ? albumsMap.get(track.albumId) : null;
    if (track && album) {
      rank += 1;
      topTracks.push({
        rank,
        trackId: track.id,
        trackName: track.name,
        totalPlays: stat.totalPlays,
        durationMs: track.durationMs,
        albumId: track.albumId,
        albumImageUrl: album.imageUrl ?? "",
      });
    }
  }

  return {
    artistId: artist.id,
    artistName: artist.name,
    headerImageUrl: artist.headerImageUrl,
    actionBarImageUrl: artist.actionBarImageUrl,
    isLiked,
    monthlyListeners: artistStats?.monthlyListeners ?? 0,
    totalPlays: artistStats?.totalPlays ?? 0,
    topTracks,
  };
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

  const artist: Artist | null = await artistsRepo.findById(artistId);

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
