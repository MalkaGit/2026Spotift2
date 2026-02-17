import * as artistsController from "./artists.controller";
import { Router } from "express";
import { createRequestValidator } from "@mycompanyname/lib-common";
import {
  artistParamsSchema,
  ArtistOverviewQueryInputSchema,
} from "./types";

const artistsRouter = Router();

/**
 * DELETE /artists/:id
 * Deletes an artist and all its likes in a single transaction.
 *
 * Flow: Request → Validation Middleware (params) → JWT Auth Middleware (app-level) → Controller → Service → Repository
 * Errors → errorMiddleware (ForbiddenError if not owner). 404 returned by controller when artist not found.
 *
 * Notes:
 * - This route is PROTECTED. A valid JWT must be provided in the Authorization header.
 * - App-level jwtAuthMiddleware({ publicRoutes }) handles authentication.
 * - This route is NOT in publicRoutes, so authentication is required automatically.
 * - Only the user who owns the artist (artists.user_id) can delete. Ownership checked in service layer.
 * - Params validated by artistParamsSchema (id must be valid UUID).
 * - Returns 204 No Content on success; 404 if artist not found; 403 if not owner.
 */
artistsRouter.delete(
  "/:id",
  createRequestValidator({ params: artistParamsSchema }),
  artistsController.deleteArtist
);

/**
 * GET /artists/:id/overview
 * Returns artist overview information.
 *
 * Flow: Request → Validation Middleware (params + query) → JWT Auth Middleware (app-level)
 *       → Controller → Service → Repository
 * Errors → errorMiddleware (UnauthorizedError if not authenticated, ForbiddenError if not authorized, NotFoundError if artist missing).
 *
 * Notes:
 * - This route is PROTECTED. A valid JWT must be provided in the Authorization header.
 * - App-level jwtAuthMiddleware({ publicRoutes }) handles authentication.
 * - This route is NOT in publicRoutes, so authentication is required automatically.
 * - Only users with "listener" role can access overview (enforced in service layer).
 * - Params validated by artistParamsSchema; query validated by ArtistOverviewQueryInputSchema.
 */
artistsRouter.get(
  "/:id/overview",
  createRequestValidator({
    params: artistParamsSchema,
    query: ArtistOverviewQueryInputSchema,
  }),
  artistsController.getArtistOverview
);

export default artistsRouter;
