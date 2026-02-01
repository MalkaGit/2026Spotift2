import { mysqlPool } from "@mycompanyname/lib-common";
import { logger } from "@mycompanyname/lib-common";
import { AddLikeInput, AddLikeOutput, LikedEntityType, LikesItem, QueryLikesInput } from './types';
import { randomUUID } from "crypto";

/**
 * Helper function to map database row to LikeItem
 * Maps snake_case database fields to camelCase domain model
 * Handles date conversion and type casting
 * 
 * Note: This function is only called for rows where the entity exists (filtered in query).
 * The query filters out deleted entities, so name will always be present.
 * 
 * @param dbRow - Database row with camelCase fields (from SQL aliases)
 * @returns LikesItem with proper types
 */
function mapRowToLikesItem(dbRow: any): LikesItem {
  return {
    id: dbRow.id,
    likedEntityType: dbRow.likedEntityType as LikedEntityType,
    likedEntityId: dbRow.likedEntityId,
    likedEntityName: dbRow.likedEntityName, // Entity name from joined table (always present due to query filter)
    // MySQL returns TIMESTAMP as Date object, convert to ISO string
    createdAt: dbRow.createdAt instanceof Date 
      ? dbRow.createdAt.toISOString() 
      : new Date(dbRow.createdAt).toISOString(),
  };
}

/**
 * Check if a user has already liked a specific entity
 * 
 * @param userId - User ID (UUID)
 * @param entityType - Type of entity (artist, album, or playlist)
 * @param entityId - ID of the entity being checked
 * @returns true if like exists, false otherwise
 * @throws Database errors may be thrown (handled by error middleware)
 * 
 * @example
 * const alreadyLiked = await exists("123e4567-e89b-12d3-a456-426614174000", "artist", "artist-1");
 * if (alreadyLiked) {
 *   throw new ConflictError("User has already liked this entity");
 * }
 */
export async function exists(userId: string, entityType: LikedEntityType, entityId: string): Promise<boolean> {
  const sql = `SELECT 1 FROM likes WHERE user_id = ? AND entity_type = ? AND entity_id = ? LIMIT 1`;
  const params = [userId, entityType, entityId];
  
  logger.debug("exists - SQL query", { sql, params });
  const [rows] = await mysqlPool.query(sql, params);
  const result = rows as any[];
  
  return result.length > 0;
}

/**
 * Add a new like for an entity (artist, album, or playlist)
 * 
 * @param userId - User ID (UUID) of the user adding the like
 * @param input - Like input containing entityType and entityId
 * @param input.entityType - Type of liked entity (artist, album, or playlist)
 * @param input.entityId - ID of the liked entity (must be valid UUID)
 * @returns The generated UUID of the newly created like
 * @throws Database errors may be thrown (e.g., duplicate like constraint violations), handled by error middleware
 * 
 * @example
 * const result = await addLike("123e4567-e89b-12d3-a456-426614174000", {
 *   entityType: "artist",
 *   entityId: "artist-1"
 * });
 * // Returns: { id: "like-uuid-here" }
 */
export async function addLike(
  userId: string,
  input: AddLikeInput
): Promise<AddLikeOutput> {
  const id = randomUUID();
  const sql = `INSERT INTO likes (id, user_id, entity_type, entity_id, created_at)
   VALUES (?, ?, ?, ?, NOW())`;
  const params = [id, userId, input.entityType, input.entityId];
  
  logger.debug("addLike - SQL query", { sql, params: [id, userId, input.entityType, input.entityId] });
  await mysqlPool.query(sql, params);
  
  return { id };
}


/**
 * Check if an entity exists in the database
 * 
 * Validates that the entity (artist, album, or playlist) exists before allowing a like.
 * Without this method, the database would return a generic error if a foreign key constraint exists,
 * or worse, we could save a like to an entity that doesn't exist.
 * With this method, the service can return a clear, specific error code.
 * 
 * @param entityType - Type of entity (artist, album, or playlist)
 * @param entityId - ID of the entity being checked
 * @returns true if entity exists, false otherwise
 * @throws Database errors may be thrown (handled by error middleware)
 * 
 * @example
 * const exists = await entityExists("artist", "111a1e45-c1c2-4b56-a331-eba6bd9b9db8");
 * if (!exists) {
 *   throw new NotFoundError(LikesErrorCode.ENTITY_NOT_FOUND, "Artist not found");
 * }
 */
export async function entityExists(entityType: LikedEntityType, entityId: string): Promise<boolean> {
  let sql: string;
  let params: string[];
  
  switch (entityType) {
    case 'artist':
      sql = `SELECT 1 FROM artists WHERE id = ? LIMIT 1`;
      params = [entityId];
      break;
    case 'album':
      // TODO: Implement when albums table is created
      // sql = `SELECT 1 FROM albums WHERE id = ? LIMIT 1`;
      // params = [entityId];
      // break;
      throw new Error(`Entity type 'album' validation not yet implemented`);
    case 'playlist':
      // TODO: Implement when playlists table is created
      // sql = `SELECT 1 FROM playlists WHERE id = ? LIMIT 1`;
      // params = [entityId];
      // break;
      throw new Error(`Entity type 'playlist' validation not yet implemented`);
    default:
      throw new Error(`Unknown entity type: ${entityType}`);
  }
  
  logger.debug("entityExists - SQL query", { sql, params, entityType });
  const [rows] = await mysqlPool.query(sql, params);
  const result = rows as any[];
  
  return result.length > 0;
}



/**
 * Query likes for a user with pagination and sorting, 
 * Automatically filters out likes pointing to deleted entities (artists, albums, playlists).
 * 
 * Returns likes for a specific user with support for pagination and sorting.
 * Joins with entity tables to get entity names.
 * 
 * COALESCE Usage:
 * - COALESCE(artists.name, albums.name, playlists.name) returns the first non-NULL value
 * - Since each like points to only one entity type, only one of the three names will be non-NULL
 * - Used in SELECT to get the entity name and in WHERE to filter out deleted entities
 * 
 * Filtering Deleted Entities:
 * Since the likes table has an entity_id field that is not a foreign key (to artist, album, playlist),
 * there are NO FOREIGN KEY constraints on entity_id (heterogeneous table design).
 * This means we can have "orphaned" likes pointing to non-existent entities.
 * 
 * We filter them out here to:
 * 1. Provide better UX - users only see actionable likes (entities that still exist)
 * 2. Ensure data integrity - avoid showing likes with empty/missing entity names
 * 3. Prevent broken links - frontend doesn't need to handle missing entities
 * 
 * The WHERE clause checks that at least one entity name exists (artist, album, or playlist).
 * If all entity names are NULL, it means the entity was deleted and we exclude that like.
 * 
 * @param userId - User ID (UUID) whose likes to query
 * @param input - Query input containing pagination and sorting parameters
 * @param input.offset - Number of records to skip
 * @param input.limit - Maximum number of records to return
 * @param input.sort - Field to sort by: 'created_at' or 'name'
 * @param input.direction - Sort direction: 'asc' or 'desc'
 * @returns Array of like items with entity names (excludes likes where entity has been deleted)
 * @throws Database errors may be thrown (handled by error middleware)
 * 
 * @example
 * const result = await queryLikesByUser("123e4567-e89b-12d3-a456-426614174000", {
 *   offset: 0,
 *   limit: 20,
 *   sort: 'created_at',
 *   direction: 'desc'
 * });
 * // Returns: [{ id: "...", likedEntityType: "artist", likedEntityId: "...", likedEntityName: "Artist Name", createdAt: "..." }, ...]
 */
export async function queryLikesByUser(
  userId: string,
  input: QueryLikesInput
): Promise<LikesItem[]> {
  // Build ORDER BY clause based on sort field and direction
  // Using whitelist approach for security (input is validated by Zod, but defense in depth)
  const sortField = input.sort === 'name' 
    ? 'COALESCE(artists.name, albums.name, playlists.name)' 
    : 'l.created_at';
  const sortDirection = input.direction === 'asc' ? 'ASC' : 'DESC';
  
  const sql = `
    SELECT 
      l.id,
      l.entity_type AS likedEntityType,
      l.entity_id AS likedEntityId,
      COALESCE(artists.name, albums.name, playlists.name) AS likedEntityName,
      l.created_at AS createdAt
    FROM likes l
    LEFT JOIN artists ON l.entity_type = 'artist' AND l.entity_id = artists.id
    LEFT JOIN albums ON l.entity_type = 'album' AND l.entity_id = albums.id
    LEFT JOIN playlists ON l.entity_type = 'playlist' AND l.entity_id = playlists.id
    WHERE l.user_id = ?
      AND COALESCE(artists.name, albums.name, playlists.name) IS NOT NULL
    ORDER BY ${sortField} ${sortDirection}
    LIMIT ? OFFSET ?
  `;
  
  const params = [userId, input.limit, input.offset];
  
  logger.debug("queryLikesByUser - SQL query", { sql: sql.replace(/\s+/g, ' ').trim(), params });
  const [rows] = await mysqlPool.query(sql, params);
  const result = rows as any[];
  
  // Map database rows to LikesItem
  return result.map(mapRowToLikesItem);
}
