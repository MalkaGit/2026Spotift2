/**
 * Catalog events constants.
 *
 */

export const EVENTS_STREAM = "catalog" as const;

/** Feed projection `feeds.feed_type` for the "what's new" release feed. */
export const FEED_TYPE_WHATS_NEW = "whats_new" as const;

export const EventTypes = {
  CATALOG_ALBUM_RELEASED: "catalog.album_released",
  CATALOG_EPISODE_RELEASED: "catalog.episode_released",
} as const;

export const ActorTypes = {
  ARTIST: "artist",
  SHOW: "show",
} as const;

export const AggregateTypes = {
  ALBUM: "album",
  EPISODE: "episode",
} as const;

