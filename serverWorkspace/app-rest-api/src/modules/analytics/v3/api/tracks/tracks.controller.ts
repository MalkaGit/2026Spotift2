import { Response, NextFunction } from "express";
import { TypedRequest, requestContext } from "@mycompanyname/lib-common";
import * as tracksService from "./tracks.service.js";

/**
 * POST /analytics/v3/tracks/:trackId/play
 * Records a play event for the track.
 * @returns 204 No Content on success
 * @returns 400 invalid UUID
 * @returns 404 track not found
 */
export async function recordTrackPlayEvent(
  req: TypedRequest<unknown, { trackId: string }>,
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
