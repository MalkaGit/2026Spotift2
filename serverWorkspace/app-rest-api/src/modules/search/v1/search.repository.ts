import { SearchQueryInput } from './types/search.query.input';
import { SearchItem } from './types/search.item.model';
import { SEARCHABLE_TYPE_ARTIST } from './types/searchable.types';
import { mysqlPool, logger } from "@mycompanyname/lib-common";

/**
 * Search artists by name with pagination and enrichment (liked status)
 * 
 * Uses SQL LIKE for pattern matching and orders results alphabetically by name.
 * ORDER BY name ensures consistent pagination - results appear in the same order across page requests.
 * 
 * @param userId - User ID (UUID) to check if artists are liked by this user
 * @param input - Search input containing query string, offset, and limit
 * @param input.q - Search query string (searches artist names using LIKE pattern matching)
 * @param input.offset - Number of records to skip
 * @param input.limit - Maximum number of records to return
 * @returns Array of search items with like status, ordered by name (alphabetically)
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
    WHERE a.name LIKE CONCAT('%', ?, '%')
    ORDER BY a.name ASC
    LIMIT ? OFFSET ?
  `;

  const params = [SEARCHABLE_TYPE_ARTIST, userId, input.q, input.limit, input.offset];
  
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

