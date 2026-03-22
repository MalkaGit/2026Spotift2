import { Response, NextFunction } from "express";
import { TypedRequest, requestContext } from "@mycompanyname/lib-common";
import * as releasesService from "./releases.service";
import type { QueryReleaseFeedInput } from "./types";

/**
 * GET /me/feeds/v4a/releases
 * Returns the "What's New" feed from `feeds` for liked artists/shows.
 * `feeds` / `feed_actors` are maintained by v4a workers consuming activity_events.
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

