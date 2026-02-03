import { TypedRequest, requestContext } from "@mycompanyname/lib-common";

import * as searchService from "./search.service";
import { SearchQueryInput, SearchQueryItem } from "./types";

import { Response, NextFunction } from "express";

/**
 * GET /search/v1/artists
 * Returns artists matching the search query with pagination and like status.
 * 
 * Notes:
 * - Results are ordered by name (alphabetically) and use SQL LIKE for pattern matching.
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

    const items: SearchQueryItem[] = await searchService.searchArtists(userId, input);

    res.status(200).json({ items });                       // Just structure response with items array, no need to wrap in output object
  } catch (err) {
    next(err);
  }
}

