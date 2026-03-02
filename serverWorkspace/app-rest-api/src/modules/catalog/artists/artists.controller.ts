import { Response, NextFunction } from "express";
import { TypedRequest, requestContext } from "@mycompanyname/lib-common";
import * as artistsService from "./artists.service";
import { ArtistOverviewQueryInput, ArtistOverviewOutput } from "./types";

/**
 * DELETE /artists/:id
 * Deletes an artist.
 *
 * @requires Authentication - JWT token required
 * @returns 204 No Content on success
 * @returns 404 if artist not found
 * @returns 403 if not the owner (ForbiddenError)
 */
export async function deleteArtist(
  req: TypedRequest<any, { id: string }>,
  res: Response,
  next: NextFunction
) {
  try {
    const userId: string = requestContext.getUserId()!;                           // userId guaranteed non-null; auth middleware throws if unauthenticated
    const artistId: string = req.params.id;
    const deleted: boolean = await artistsService.deleteArtist(userId, artistId);

    if (deleted) {
      res.status(204).end(); // Artist deleted successfully, No Content
    } else {
      res.status(404).end(); // Artist not found, Not Found
    }
  } catch (err) {
    next(err);
  }
}

/**
 * GET /artists/:id/overview
 * Returns artist overview (v1) with top tracks from stat table (with join).
 *
 * @requires Authentication - JWT token required
 * @returns 200 OK with ArtistOverviewOutput body
 * @returns 404 if artist not found
 */
export async function getArtistOverview(
  req: TypedRequest<any, { id: string }, ArtistOverviewQueryInput>,
  res: Response,
  next: NextFunction
) {
  try {
    const userId: string = requestContext.getUserId()!;
    const artistId: string = req.params.id;
    const query: ArtistOverviewQueryInput = req.validatedQuery!;

    const overview: ArtistOverviewOutput =
      await artistsService.getArtistOverview(userId, artistId, query);

    res.status(200).json(overview);
  } catch (err) {
    next(err);
  }
}

/**
 * GET /artists/:id/overview/v2
 * Returns artist overview (v2) with top tracks from projection table (no join).
 * Same response shape as GET /artists/:id/overview.
 */
export async function getArtistOverviewV2(
  req: TypedRequest<any, { id: string }, ArtistOverviewQueryInput>,
  res: Response,
  next: NextFunction
) {
  try {
    const userId: string = requestContext.getUserId()!;
    const artistId: string = req.params.id;
    const query: ArtistOverviewQueryInput = req.validatedQuery!;

    const overview: ArtistOverviewOutput =
      await artistsService.getArtistOverviewV2(userId, artistId, query);

    res.status(200).json(overview);
  } catch (err) {
    next(err);
  }
}

/**
 * GET /artists/:id/overview/v3
 * Returns artist overview (v3) MS-ready: stats from analytics, tracks/albums by ids from catalog, composed in service.
 * Same response shape as GET /artists/:id/overview.
 */
export async function getArtistOverviewV3(
  req: TypedRequest<any, { id: string }, ArtistOverviewQueryInput>,
  res: Response,
  next: NextFunction
) {
  try {
    const userId: string = requestContext.getUserId()!;
    const artistId: string = req.params.id;
    const query: ArtistOverviewQueryInput = req.validatedQuery!;

    const overview: ArtistOverviewOutput =
      await artistsService.getArtistOverviewV3(userId, artistId, query);

    res.status(200).json(overview);
  } catch (err) {
    next(err);
  }
}

