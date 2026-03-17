import { Router } from "express";
import { createRequestValidator } from "@mycompanyname/lib-common";
import * as releasesController from "./releases.controller";
import { QueryReleaseFeedInputSchema } from "./types";

const releaseFeedsRouter = Router();

/**
 * GET /
 * Full path: GET /me/feeds/v4a/releases
 * Returns the "what's new" feed from feed_events / feed_event_actors
 * projections maintained by v4a workers.
 * Query params: event_type, days, limit, cursor (cursor = base64url JSON { eventTime, eventId }).
 */
releaseFeedsRouter.get(
  "/",
  createRequestValidator({ query: QueryReleaseFeedInputSchema }),
  releasesController.getReleaseFeeds
);

export default releaseFeedsRouter;

