import { Response, NextFunction } from "express";
import { TypedRequest, requestContext } from "@mycompanyname/lib-common";
import * as releasesService from "./releases.service";
import type { QueryReleaseFeedInput } from "./types";

/**
 * GET /me/feeds/v2/releases
 * Returns the "What's New" feed from activity_events for liked artists (album releases only).
 */
export async function getReleaseFeeds(
  req: TypedRequest<unknown, unknown, QueryReleaseFeedInput>,
  res: Response,
  next: NextFunction
) {
  try {
    const userId = requestContext.getUserId()!;
    const query = req.validatedQuery!;

    const output = await releasesService.getReleaseFeeds(userId, query);
    res.status(200).json(output);
  } catch (err) {
    next(err);
  }
}
