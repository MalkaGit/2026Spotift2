import { Router } from "express";
import { createRequestValidator } from "@mycompanyname/lib-common";
import * as albumsController from "./albums.controller";
import { albumParamsSchema } from "./types/albums.params.schema";

const albumsRouter = Router();

/**
 * POST /albums/:albumId/release/v1
 * Marks an album as released (sets released_at = NOW()). Dev/admin only.
 * v1: direct update to albums.released_at.
 *
 * Returns 204 No Content; 400 invalid UUID; 404 album not found; 401/403 if not authenticated or not admin.
 */
albumsRouter.post(
  "/:albumId/release/v1",
  createRequestValidator({ params: albumParamsSchema }),
  albumsController.releaseAlbumV1
);

albumsRouter.post(
  "/:albumId/release/v2",
  createRequestValidator({ params: albumParamsSchema }),
  albumsController.releaseAlbumV2
);

export default albumsRouter;
