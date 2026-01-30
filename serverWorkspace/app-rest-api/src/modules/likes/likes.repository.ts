import { mysqlPool } from "@mycompanyname/lib-common";
import { logger } from "@mycompanyname/lib-common";
import { AddLikeInput, AddLikeOutput, LikedEntityType } from './types';

import { randomUUID } from "crypto";

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
  const sql = `SELECT 1 FROM user_likes WHERE user_id = ? AND entity_type = ? AND entity_id = ? LIMIT 1`;
  const params = [userId, entityType, entityId];
  
  logger.debug("exists - SQL query", { sql, params });
  const [rows] = await mysqlPool.query(sql, params);
  const result = rows as any[];
  
  return result.length > 0;
}

/**
 * Add a new like to some entity (eg, artist, album, playlist)
 * 
 * @param userId - User ID (UUID) of the user adding the like
 * @param input - Like input containing entityType and entityId
 * @param input.entityType - Type of liked entity (artist, album, or playlist)
 * @param input.entityId - ID of the liked entity being liked (must be valid UUID)
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
  const sql = `INSERT INTO user_likes (id, user_id, entity_type, entity_id, created_at)
   VALUES (?, ?, ?, ?, NOW())`;
  const params = [id, userId, input.entityType, input.entityId];
  
  logger.debug("addLike - SQL query", { sql, params: [id, userId, input.entityType, input.entityId] });
  await mysqlPool.query(sql, params);
  
  return { id };
}


/**
 * Helper: Check if an entity exists in the database
 * 
 * Validates that the entity (artist, album, or playlist) exists before allowing a like.
 * Without this meothd, best case is that db has foreign key and user gets generic error when inserting entity that deoes not exist
 * without this meothod,workst case is that we save like to entity that does not exist 
 * with this method, service can  return clear error code 
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
