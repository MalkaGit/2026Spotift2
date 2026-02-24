import { Response, NextFunction } from "express";
import { TypedRequest, requestContext } from "@mycompanyname/lib-common";
import * as tracksService from "./tracks.service";

/**
 * POST /analytics/v2/tracks/:trackId/play
 * Records a play event for the track (to db or queue)
 * @requires Authentication - JWT token required
 * @returns 204 No Content on success
 * @returns 400 invalid UUID or invalid body (handled by validation middleware)
 * @returns 404 track not found
 */
export async function recordTrackPlayEvent(
  req: TypedRequest<any, { trackId: string }>,
  res: Response,
  next: NextFunction
) {
  try {
    const userId = requestContext.getUserId()!;
    const trackId = req.params.trackId;
    await tracksService.recordTrackPlayEvent(userId, trackId);
    res.status(204).end();
  } catch (err) {
    next(err);
  }
}
