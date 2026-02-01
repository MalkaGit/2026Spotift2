import { LikedEntityType } from "./liked.entity.type";

/**
 * Input type for add user like operation
 * 
 * @param entityType - Type of entity that can be liked (artist, album, or playlist)
 * @param entityId - UUID of the entity being liked
 */
export interface AddLikeInput {
    entityType: LikedEntityType;
    entityId: string;
}