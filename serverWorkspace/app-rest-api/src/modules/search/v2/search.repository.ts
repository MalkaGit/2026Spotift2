import { SearchQueryInput } from './types/search.query.input';
import { SearchItem } from './types/search.item.model';
import { SEARCHABLE_TYPE_ARTIST } from './types/searchable.types';
import { mysqlPool, logger } from "@mycompanyname/lib-common";

/**
 * Search artists by name with pagination and enrichment (liked status)
 * 
 * Uses MySQL FULLTEXT search for pattern matching and orders results by relevance score (descending).
 * Relevance score is calculated by MySQL based on how well the search term matches the artist name.
 * 
 * @param userId - User ID (UUID) to check if artists are liked by this user
 * @param input - Search input containing query string, offset, and limit
 * @param input.q - Search query string (searches artist names using FULLTEXT search)
 * @param input.offset - Number of records to skip
 * @param input.limit - Maximum number of records to return
 * @returns Array of search items with like status, ordered by relevance score (descending)
 * @throws Database errors may be thrown (handled by error middleware)
 * 
 * @example
 * const items = await searchArtists("user-id", { q: "Taylor", offset: 0, limit: 20 });
 */
export async function searchArtists(
  userId: string,
  input: SearchQueryInput
): Promise<SearchItem[]> {

  const sql = `
    SELECT 
      a.id,
      a.name,
      a.image_url AS imageUrl,
      CASE 
        WHEN l.user_id IS NULL THEN FALSE 
        ELSE TRUE 
      END AS liked
    FROM artists a
    LEFT JOIN likes l
      ON l.entity_type = ?
      AND l.entity_id = a.id
      AND l.user_id = ?
    -- WHERE clause is required to filter results - returns only artists matching the search query (input.q)
    -- Without it, we would return ALL artists, not just matching ones
    WHERE MATCH(a.name) AGAINST(? IN NATURAL LANGUAGE MODE)
    ORDER BY MATCH(a.name) AGAINST(? IN NATURAL LANGUAGE MODE) DESC
    LIMIT ? OFFSET ?
  `;

  const params = [SEARCHABLE_TYPE_ARTIST, userId, input.q, input.q, input.limit, input.offset];
  
  logger.debug("searchArtists - SQL query", { sql: sql.replace(/\s+/g, ' ').trim(), params });
  const [rows] = await mysqlPool.query(sql, params);

  const result = rows as any[];

  return result.map((r: any) => ({
    id: r.id,
    name: r.name,
    imageUrl: r.imageUrl || undefined,
    entityType: SEARCHABLE_TYPE_ARTIST,
    liked: Boolean(r.liked)
  }));
}

