import { Router } from "express";
import { createRequestValidator } from "@mycompanyname/lib-common";
import * as tracksController from "./tracks.controller.js";
import { trackParamsSchema } from "./types/index.js";

const router = Router();

/**
 * POST /analytics/v1/tracks/:trackId/play
 * Applies a play by directly updating projection tables (no event table; no worker).
 * Returns 204 No Content; 400 invalid UUID; 404 track not found.
 */
router.post(
  "/:trackId/play",
  createRequestValidator({ params: trackParamsSchema }),
  tracksController.applyTrackPlay
);

export default router;
