import { Router } from "express";
import { createRequestValidator } from "@mycompanyname/lib-common";
import * as releasesController from "./releases.controller";
import { QueryReleaseFeedInputSchema } from "./types";

const releaseFeedsRouter = Router();

/**
 * GET /
 * Full path: GET /me/feeds/v1/releases
 * Returns the "what's new" feed of latest releases for entities the user liked.
 *
 * Query params: event_type, days, limit, cursor
 * Requires authentication.
 * Note: cursor is encoded as base64url of JSON { releaseDate, releasedObjectId } 
 *       (usually it is event time + event id but this time we dont have event id since we dont have events\feeds tablw yet)
 */
releaseFeedsRouter.get(
  "/",
  createRequestValidator({ query: QueryReleaseFeedInputSchema }),
  releasesController.getReleaseFeeds
);

export default releaseFeedsRouter;
