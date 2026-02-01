import * as likesRepo from "./likes.repository";
import { LikesErrorCode } from "./likes.error.codes";
import { requireRole, requestContext } from "@mycompanyname/lib-common";
import { ConflictError, NotFoundError } from "@mycompanyname/lib-common";

import { AddLikeInput, AddLikeOutput } from "./types";
import {QueryLikesInput, LikesItem } from "./types";

/**
 * Operation: Add a like for a user
 * 
 * Note: User authentication is handled by JWT middleware (userId extracted from token).
 * Note: Structural validation (required fields, entityType enum, entityId UUID format) is handled by request validation middleware.
 * 
 * @param userId - User ID (UUID) of the user adding the like
 * @param input - Like input containing entityType and entityId
 * @param input.entityType - Type of entity being liked (artist, album, or playlist)
 * @param input.entityId - ID of the entity being liked (must be valid UUID)
 * @returns The generated UUID of the newly created like
 * @throws UnauthorizedError (401) if user is not authenticated
 * @throws ForbiddenError (403) if user is authenticated but not authorized (listener role required)
 * @throws NotFoundError if the entity (artist, album, or playlist) does not exist. 
 * @throws ConflictError if user has already liked this entity
 * 
 * 
 * @example
 * const result = await addLike("123e4567-e89b-12d3-a456-426614174000", {
 *   entityType: "artist",
 *   entityId: "artist-1"
 * });
 * // Returns: { id: "like-uuid-here" }
 */
export async function addLike(userId: string, input: AddLikeInput): Promise<AddLikeOutput> {
    
    //BL: Authentication & Authorization - user must be authenticated and have listener role
    requireRole(["listener"]);

    //BL: validate entity type input - hadled by request validation middleware - that the entity type is artist,album,playlist 
    
    //BL: Validate that liked entity exists to return clear error code and ensure data integrity
    const likedEntityExists = await likesRepo.entityExists(input.entityType, input.entityId);
    if (!likedEntityExists) {
        throw new NotFoundError(
            LikesErrorCode.LIKED_ENTITY_NOT_FOUND,
            `${input.entityType} with id ${input.entityId} not found`
        );
    }

    //BL: Check if user has already liked this entity
    const alreadyLiked = await likesRepo.exists(userId, input.entityType, input.entityId);
    if (alreadyLiked) {
        throw new ConflictError(
            LikesErrorCode.ALREADY_LIKED,
            `User has already liked this ${input.entityType}`
        );
    }

    //BL: Add the like
    const result = await likesRepo.addLike(userId, input);
    
    return result;
}


/**
 * Operation: Query likes for a user
 * 
 * Note: Structural validation (defaults, required fields, enum values, number ranges) is handled by request validation middleware.
 * 
 * @param userId - User ID (UUID) of the user whose likes to query
 * @param query - Query input containing pagination and sorting parameters
 * @param query.offset - Number of records to skip (default: 0)
 * @param query.limit - Maximum number of records to return (default: 20)
 * @param query.sort - Field to sort by: 'created_at' (default) or 'name'
 * @param query.direction - Sort direction: 'asc' or 'desc' (default: 'desc')
 * @returns Array of like items for the specified user (excludes likes where entity has been deleted)
 * @throws UnauthorizedError (401) if user is not authenticated
 * @throws ForbiddenError (403) if user is authenticated but not authorized (listener role required)
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
  query: QueryLikesInput
): Promise<LikesItem[]> {
  
  //BL: Authentication & Authorization - user must be authenticated and have listener role
  requireRole(["listener"]);
  
  //BL: Query user's likes with pagination and sorting
  const items :LikesItem[] = await likesRepo.queryLikesByUser(userId, query);
  
  return items;
}