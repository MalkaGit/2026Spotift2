import { Response, NextFunction } from "express";
import { TypedRequest, requestContext } from "@mycompanyname/lib-common";
import * as tracksService from "./tracks.service";

/**
 * POST /analytics/v2/tracks/:trackId/play
 * Record a play event for the given track. Appends one row to track_events (event_type = 'play').
 * @returns 204 No Content on success
 * @returns 400 Bad Request if trackId is not a valid UUID
 * @returns 404 Not Found if the track does not exist
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
