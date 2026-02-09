import { Response, NextFunction } from "express";
import { TypedRequest, requestContext } from "@mycompanyname/lib-common";
import * as artistsService from "./artists.service";

/**
 * DELETE /artists/:id
 * Deletes an artist.
 * 204 No Content on success.
 * 404 if artist not found; 403 if not the owner.
 */
export async function deleteArtist(
  req: TypedRequest<any, { id: string }>,
  res: Response,
  next: NextFunction
) {
  try {
    const userId: string = requestContext.getUserId()!;
    const artistId: string = req.params.id;
    const deleted: boolean = await artistsService.deleteArtist(userId, artistId);

    if (deleted) {
      res.status(204).end();
    } else {
      // Artist not found
      res.status(404).end();
    }
  } catch (err) {
    next(err);
  }
}
