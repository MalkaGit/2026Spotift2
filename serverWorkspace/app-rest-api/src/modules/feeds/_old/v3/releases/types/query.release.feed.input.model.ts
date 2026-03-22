/**
 * V3 input type for querying the release feed.
 * Same shape as v2, but scoped to feeds v3.
 *
 * Pagination: `cursor` is opaque base64url JSON `{ "lastFeedId": "<bigint>" }`
 * (see `feeds.feed_id` ordering). Empty string requests the first page.
 */
export interface QueryReleaseFeedInput {
  event_type?: ReleaseFeedEventType[];
  days: number;
  limit: number;
  cursor: string;
}

export const RELEASE_FEED_EVENT_ALBUM = "release_album" as const;
export const RELEASE_FEED_EVENT_EPISODE = "release_episode" as const;

export const RELEASE_FEED_EVENT_TYPES = [
  RELEASE_FEED_EVENT_ALBUM,
  RELEASE_FEED_EVENT_EPISODE,
] as const;

export type ReleaseFeedEventType = (typeof RELEASE_FEED_EVENT_TYPES)[number];

