/**
 * Types module - exports all likes-related types
 * 
 * This file provides a single entry point for importing likes types.
 * It follows the same pattern as the users module.
 */

export { LikedEntityType, LIKED_ENTITY_TYPES } from "./liked.entity.type";
export { AddLikeInput } from "./add.like.input.model";
export { AddLikeOutput } from "./add.like.output";
export { AddLikeInputSchema } from "./add.like.input.schema";
export { LikesItem  } from "./likes.item.model";
export { QueryLikesInput } from "./query.likes.input.model";
export { QueryLikesInputSchema } from "./query.likes.input.schema";