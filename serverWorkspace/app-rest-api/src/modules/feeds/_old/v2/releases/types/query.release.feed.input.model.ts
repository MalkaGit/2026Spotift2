/**
 * V2 input type for querying the release feed (no dependency on v1).
 * Used for GET /me/feeds/v2/releases – reads from activity_events table directly.
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
