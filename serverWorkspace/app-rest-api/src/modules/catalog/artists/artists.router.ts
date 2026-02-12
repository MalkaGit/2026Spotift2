import * as artistsController from "./artists.controller";
import { Router } from "express";
import { createRequestValidator } from "@mycompanyname/lib-common";
import { artistParamsSchema } from "./types/artists.params.schema";

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

export default artistsRouter;
