import { requireRole } from "@mycompanyname/lib-common";
import { SearchQueryInput } from './types/search.query.input';
import { SearchItem } from './types/search.item.model';
import * as searchRepo from './search.repository';

/**
 * Operation: Search artists by name with pagination and enrichment
 * 
 * Notes:
 * - using like, ORDER BY name (to ensure consistent pagination)
 * - later on we will use full text search for better relevance score
 * - since this is monolithic application, we use join for enrichment
 * - User authentication is handled by JWT middleware (userId extracted from token).
 * - Structural validation (defaults, required fields) is handled by request validation middleware.
 * 
 * @param userId - User ID (UUID) of the user performing the search
 * @param input - Search input containing query string, offset, and limit
 * @param input.q - Search query string (searches artist names using SQL LIKE)
 * @param input.offset - Number of records to skip
 * @param input.limit - Maximum number of records to return
 * @returns Array of search items with like status, ordered by name (alphabetically)
 * @throws UnauthorizedError (401) if user is not authenticated
 * @throws ForbiddenError (403) if user is authenticated but not authorized (listener role required)
 * 
 * @example
 * const items = await searchArtists("user-id", { q: "Taylor", offset: 0, limit: 20 });
 */
export async function searchArtists(
  userId: string,
  input: SearchQueryInput
): Promise<SearchItem[]> {
  
  //BL: Authentication & Authorization - user must be authenticated and have listener role
  requireRole(["listener"]);
  
  //BL: Search artists with pagination and like status enrichment
  return searchRepo.searchArtists(userId, input);
}

