/**
 * Input type for search operation
 * 
 * Used for pagination and search query when retrieving search results.
 * Fields are not nullable since they get default values from the schema by validation middleware.
 * Reusable across different search endpoints:
 * - GET /search/v2/artists - search artists by name
 * - GET /search/v2/albums - search albums by name (future)
 * - GET /search/v2/tracks - search tracks by name (future)
 * - GET /search/v2/playlists - search playlists by name (future)
 * 
 * Note: Each endpoint searches a single entity type (artists, albums, tracks, or playlists).
 *       The query parameter (q) searches within that specific entity type only.
 * 
 * @param q - Search query string (searches entity names)
 * @param offset - Number of records to skip (default: 0)
 * @param limit - Maximum number of records to return (default: 20)
 * 
 * Note: Structural validation (required fields, number ranges) is handled by Zod schema.
 *       No semantic validation on search query (typeahead, emojis, partial tokens, non-latin are allowed).
 *       
 *       Ordering: No order by parameter needed. Each search engine handles ordering automatically:
 *       - v1 (LIKE): orders alphabetically by name (required for consistent pagination)
 *       - v2 (MySQL FULLTEXT): orders by text relevance score
 *       - v3 (hetrogenious tables search): (MySQL FULLTEXT) allow search artist+album+track+playlist in single query
 *       - v4 (Elasticsearch): orders by text score and popularity
 *       Sorting is critical for pagination - without it, results may appear in different orders
 *       across page requests, causing duplicates or missed results.
 *       
 *       This is a domain model, not a DTO. We saved the need for a separate DTO since this model
 *       is good enough for both internal service/repository layers and external API contract.
 */
export interface SearchQueryInput {
  q: string;
  offset: number;
  limit: number;
}

