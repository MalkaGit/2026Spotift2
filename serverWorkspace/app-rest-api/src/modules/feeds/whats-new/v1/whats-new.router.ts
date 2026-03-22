import { Router } from "express";
import { createRequestValidator } from "@mycompanyname/lib-common";
import * as whatsNewController from "./whats-new.controller";
import { QueryWhatsNewInputSchema } from "../types";

const whatsNewRouter = Router();

/**
 * GET /
 * Full path: GET /me/feeds/whats-new
 * Query: object_type (album, episode), days, limit, cursor (base64url { releaseDate, releasedObjectId }).
 */
whatsNewRouter.get(
  "/",
  createRequestValidator({ query: QueryWhatsNewInputSchema }),
  whatsNewController.getWhatsNewFeeds
);

export default whatsNewRouter;
