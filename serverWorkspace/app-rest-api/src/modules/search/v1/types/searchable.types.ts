/**
 * Entity type for searchable entities
 * The array is used in the zod validator and type is used in the business logic.
 * When the array is updated, the type is updated automatically.
 */

// Named constants for each entity type (single source of truth)
export const SEARCHABLE_TYPE_ARTIST = 'artist' as const;
// Future: export const SEARCHABLE_TYPE_ALBUM = 'album' as const;
// Future: export const SEARCHABLE_TYPE_TRACK = 'track' as const;
// Future: export const SEARCHABLE_TYPE_PLAYLIST = 'playlist' as const;

// Array built from constants (used in Zod validators)
export const SEARCHABLE_TYPES = [SEARCHABLE_TYPE_ARTIST] as const;

export type SearchableType = typeof SEARCHABLE_TYPES[number];

