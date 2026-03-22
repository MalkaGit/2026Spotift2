import { Router } from "express";
import { createRequestValidator } from "@mycompanyname/lib-common";
import * as releasesControllerV2 from "./releases.controller";
import { QueryReleaseFeedInputSchema } from "./types";

const releaseFeedsRouter = Router();

/**
 * GET /
 * Full path: GET /me/feeds/v2/releases
 * Returns the "what's new" feed from activity_events (no code shared with v1).
 * Query params: event_type, days, limit, cursor (cursor = base64url JSON { eventTime, eventId }).
 */
releaseFeedsRouter.get(
  "/",
  createRequestValidator({ query: QueryReleaseFeedInputSchema }),
  releasesControllerV2.getReleaseFeeds
);

export default releaseFeedsRouter;
