import * as likesRepo from "./likes.repository";
import { LikesErrorCode } from "./likes.error.codes";
import { requireRole, requestContext } from "@mycompanyname/lib-common";
import { ConflictError, NotFoundError } from "@mycompanyname/lib-common";

import { AddLikeInput, AddLikeOutput } from "./types";

/**
 * Operation: Add a like for the current user
 * 
 * Note: Structural validation (required fields, entityType enum, entityId UUID format) is handled by request validation middleware.
 * 
 * @param input - Like input containing entityType and entityId
 * @param input.entityType - Type of entity being liked (artist, album, or playlist)
 * @param input.entityId - ID of the entity being liked (must be valid UUID)
 * @returns The generated UUID of the newly created like
 * @throws UnauthorizedError (401) if user is not authenticated
 * @throws ForbiddenError (403) if user is authenticated but not authorized (listener role required)
 * @throws NotFoundError if the entity (artist, album, or playlist) does not exist. 
 * @throws ConflictError if user has already liked this entity
 * 
 * Note: User authentication is handled by JWT middleware (userId extracted from token).
 * 
 * @example
 * const result = await addLike({
 *   entityType: "artist",
 *   entityId: "artist-1"
 * });
 * // Returns: { id: "like-uuid-here" }
 */
export async function addLike(input: AddLikeInput): Promise<AddLikeOutput> {
    
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

    const userId: string = requestContext.getUserId()!;

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