import { Response, NextFunction } from "express";
import { TypedRequest, requestContext } from "@mycompanyname/lib-common";
import * as releasesService from "./releases.service";
import type { QueryReleaseFeedInput } from "./types";

/**
 * GET /me/feeds/v1/releases
 *
 * Returns the user's "What's New" feed:
 *  - new albums released by artists the user follows
 *  - new podcast episodes released by shows the user follows
 * Note: for now we only support album releases, episodes are not supported yet
 *       (paging when data comes from different sources , albums.release date and eposiodes.release date is tricky)
 *
 * Version 1 (V1):
 *  - No CQRS projection tables,
 *   The feed is computed directly from source-of-truth tables
 *  (albums and episodes tables by release date)
*  - No events / outbox tables   

*
 * Write path:
 *  - Album release updates albums.released_at
 *  - Episode release updates episodes.released_at
 *
 * Read path:
 *  - The API aggregates data at read time by joining:
 *      likes + album_artists + albums  
 *      likes + shows + episodes 
 *
 * Pagination:
 *  - Uses cursor + limit instead of offset+limit pagination (offset+limit is not possible since data comes from different sources)
 *  - The cursor must represent the ordering of the feed
 *
 * Typical feed systems use:
 *      cursor = (eventTime, eventId)
 *
 * However in V1 there is no events table, so there is no eventId.
 * Instead we use a stable ordering based on:
 *
 *      cursor = (occurredAt, releasedObjectId)
 *
 * where:
 *  - occurredAt = album.released_at or episode.released_at
 *  - releasedObjectId = album.id or episode.id
 *
 * The cursor is optional. sent from client when requesting next page. 
 * client does not cacluate it. instead it sends the value it gest in the previous page response.
 * It is encoded as Base64 JSON and returned as nextPageCursor.
 */
export async function getReleaseFeeds(
  req: TypedRequest<unknown, unknown, QueryReleaseFeedInput>,
  res: Response,
  next: NextFunction
) {
  try {
    const userId = requestContext.getUserId()!;
    const query = req.validatedQuery!;

    const output = await releasesService.getReleaseFeeds(userId, query);
    res.status(200).json(output);
  } catch (err) {
    next(err);
  }
}
