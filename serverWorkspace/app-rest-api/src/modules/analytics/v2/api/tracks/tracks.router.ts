import { Router } from "express";
import { createRequestValidator } from "@mycompanyname/lib-common";
import * as tracksController from "./tracks.controller";
import { trackParamsSchema } from "./types";

const router = Router();

/**
 * POST /analytics/v2/tracks/:trackId/play
 * Records a play event for the track (body ignored).
 * Returns 204 No Content; 400 invalid UUID; 404 track not found.
 */
router.post(
  "/:trackId/play",
  createRequestValidator({ params: trackParamsSchema }),
  tracksController.recordTrackPlayEvent
);

export default router;
