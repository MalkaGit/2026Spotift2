/**
 * Catalog events constants.
 *
 */

export const DOMAIN_CATALOG = "catalog" as const;

export const EventTypes = {
  ALBUM_RELEASED: "catalog.album_released",
  EPISODE_RELEASED: "catalog.episode_released",
} as const;

export const ActorTypes = {
  ARTIST: "artist",
  SHOW: "show",
} as const;

export const AggregateTypes = {
  ALBUM: "album",
  EPISODE: "episode",
} as const;

