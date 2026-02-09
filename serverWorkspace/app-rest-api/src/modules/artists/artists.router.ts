import * as artistsController from "./artists.controller";
import { Router } from "express";
import { createRequestValidator } from "@mycompanyname/lib-common";
import { artistParamsSchema } from "./artists.params.schema";

const artistsRouter = Router();

/**
 * DELETE /artists/:id
 * Deletes the artist. Protected: JWT required. Only the user who manages the artist (artists.user_id) can delete.
 * 204 No Content on success; 404 if artist not found; 403 if not owner.
 */
artistsRouter.delete(
  "/:id",
  createRequestValidator({ params: artistParamsSchema }),
  artistsController.deleteArtist
);

export default artistsRouter;
