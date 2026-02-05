/**
 * Schema for search request validation
 * 
 * Used for:
 * - GET /search/v1/artists - search artists by name
 * - GET /search/v1/albums - search albums by name (future)
 * - GET /search/v1/tracks - search tracks by name (future)
 * - GET /search/v1/playlists - search playlists by name (future)
 * 
 * Request Part: query string parameters
 * Model: SearchQueryInput
 * 
 * Field Validation:
 *  - q: Optional string, defaults to empty string (no semantic validation - search is fuzzy by nature)
 *  - offset: Optional number, coerced from string, defaults to 0, must be non-negative
 *  - limit: Optional number, coerced from string, defaults to 20, must be positive
 * 
 * Note: This schema handles structural validation only.
 *       No semantic validation on search query (typeahead, emojis, partial tokens, non-latin are allowed).
 *       Each endpoint searches a single entity type - the query works for that specific entity only.
 */
import { z } from 'zod';

export const SearchQueryInputSchema = z.object({
  q: z.string().default(""),
  offset: z.coerce.number().nonnegative().default(0),
  limit: z.coerce.number().positive().default(20),
});

