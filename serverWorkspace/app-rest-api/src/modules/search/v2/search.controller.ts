import { TypedRequest, requestContext } from "@mycompanyname/lib-common";

import * as searchService from "./search.service";
import { SearchQueryInput, SearchItem } from "./types";

import { Response, NextFunction } from "express";

/**
 * GET /search/v2/artists
 * Returns artists matching the search query with pagination and like status.
 * 
 * Notes:
 * - Results are ordered by relevance score (descending) and use MySQL FULLTEXT search for pattern matching.
 * - Assumes request validation middleware has already parsed & typed req.validatedQuery as SearchQueryInput.
 * - This endpoint is PROTECTED. A valid JWT must be provided in the Authorization header.
 * - Errors → errorMiddleware (UnauthorizedError if not authenticated, ForbiddenError if not authorized)
 */
export async function searchArtists(
  req: TypedRequest<any, any, SearchQueryInput>,
  res: Response,
  next: NextFunction
) {
  try {
    const userId: string = requestContext.getUserId()!;     // userId is guaranteed to be non-null because authentication middleware throws if unauthenticated
    const input: SearchQueryInput = req.validatedQuery!;    // No 'as' needed - Validation middleware ensures req.validatedQuery is typed as SearchQueryInput

    const items: SearchItem[] = await searchService.searchArtists(userId, input);

    res.status(200).json({ items });                       // Just structure response with items array, no need to wrap in output object
  } catch (err) {
    next(err);
  }
}

