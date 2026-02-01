import { LikedEntityType } from "./likes.entity.type";

/**
 * LikeItem represents a single liked entity in the  likes list.
 * 
 * Used in:
 * - GET /users/me/likes - Returns array of LikeItem objects in response body: { items: LikeItem[] }
 * In the future, it can be used for other endpoints as well.
 * - eg. GET /artists/:id/likes - Returns array of LikeItem objects in response body: { items: LikeItem[] }
 * Each item contains information about a liked entity (artist, album, or playlist),
 * including the entity's type, ID, name, and when it was liked.
 */
export interface LikesItem {
    id: string;
    likedEntityType: LikedEntityType;
    likedEntityId: string;
    likedEntityName: string;
    createdAt: string;                 // ISO 8601 format
  }