import { Response, NextFunction } from "express";
import { TypedRequest, requestContext } from "@mycompanyname/lib-common";
import * as artistsService from "./artists.service";

/**
 * DELETE /artists/:id
 * Deletes an artist.
 *
 * @requires Authentication - JWT token required
 * @returns 204 No Content on success
 * @returns 404 if artist not found
 * @returns 403 if not the owner (ForbiddenError)
 */
export async function deleteArtist(
  req: TypedRequest<any, { id: string }>,
  res: Response,
  next: NextFunction
) {
  try {
    const userId: string = requestContext.getUserId()!;                           // userId guaranteed non-null; auth middleware throws if unauthenticated
    const artistId: string = req.params.id;
    const deleted: boolean = await artistsService.deleteArtist(userId, artistId);

    if (deleted) {
      res.status(204).end(); // Artist deleted successfully, No Content
    } else {
      res.status(404).end(); // Artist not found, Not Found
    }
  } catch (err) {
    next(err);
  }
}


