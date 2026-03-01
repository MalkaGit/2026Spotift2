import { Response, NextFunction } from "express";
import { TypedRequest, requestContext } from "@mycompanyname/lib-common";
import * as tracksService from "./tracks.service.js";

/**
 * POST /analytics/v1/tracks/:trackId/play
 * Applies a play by directly updating projection tables (no event table; no worker).
 * @returns 204 No Content on success
 * @returns 400 invalid UUID (from validation middleware)
 * @returns 404 track not found
 */
export async function applyTrackPlay(
  req: TypedRequest<unknown, { trackId: string }>,
  res: Response,
  next: NextFunction
) {
  try {
    requestContext.getUserId(); // ensure authenticated (middleware already enforced)
    const trackId = req.params.trackId;
    await tracksService.applyTrackPlay(trackId);
    res.status(204).end();
  } catch (err) {
    next(err);
  }
}
