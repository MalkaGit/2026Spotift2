/**
 * Entity type for likes
 * The array is used in the zod validator and type is used in the business logic.
 * when the array is updated, the type is updated automatically.
 */
export const LIKED_ENTITY_TYPES = ['artist', 'album', 'playlist'] as const;

export type LikedEntityType = typeof LIKED_ENTITY_TYPES[number];

