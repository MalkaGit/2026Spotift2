import { Router } from "express";
import { createRequestValidator } from "@mycompanyname/lib-common";
import * as releasesControllerV3 from "./releases.controller";
import { QueryReleaseFeedInputSchema } from "./types";

const releaseFeedsRouter = Router();

/**
 * GET /
 * Full path: GET /me/feeds/v3/releases
 * Returns the "what's new" feed from feed_events / feed_event_actors.
 * Query params: event_type, days, limit, cursor (cursor = base64url JSON { eventTime, eventId }).
 */
releaseFeedsRouter.get(
  "/",
  createRequestValidator({ query: QueryReleaseFeedInputSchema }),
  releasesControllerV3.getReleaseFeeds
);

export default releaseFeedsRouter;

