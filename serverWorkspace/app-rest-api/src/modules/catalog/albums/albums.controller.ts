import { Response, NextFunction } from "express";
import { TypedRequest } from "@mycompanyname/lib-common";
import * as albumsService from "./albums.service";

/**
 * POST /albums/:albumId/release/v1
 * Marks an album as released (sets released_at = NOW()). Dev/admin only.
 * v1: direct update to albums.released_at.
 *
 * @requires Authentication - JWT token required
 * @requires Role - admin
 * @returns 204 No Content on success
 * @returns 400 invalid UUID
 * @returns 404 album not found
 * @returns 401 unauthorized
 * @returns 403 forbidden (not admin)
 */
export async function releaseAlbumV1(
  req: TypedRequest<unknown, { albumId: string }>,
  res: Response,
  next: NextFunction
) {
  try {
    const albumId = req.params.albumId;
    await albumsService.releaseAlbum(albumId);
    res.status(204).end();
  } catch (err) {
    next(err);
  }
}
