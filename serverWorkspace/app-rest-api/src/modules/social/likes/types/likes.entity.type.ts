/**
 * Entity type for likes.
 * Constants are the source of truth; array and type are derived for zod validation and business logic.
 */
export const LIKED_ENTITY_ARTIST = "artist" as const;
export const LIKED_ENTITY_ALBUM = "album" as const;
export const LIKED_ENTITY_PLAYLIST = "playlist" as const;

/** Array derived from constants - used in zod validators */
export const LIKED_ENTITY_TYPES = [
  LIKED_ENTITY_ARTIST,
  LIKED_ENTITY_ALBUM,
  LIKED_ENTITY_PLAYLIST,
] as const;

export type LikedEntityType = (typeof LIKED_ENTITY_TYPES)[number];

