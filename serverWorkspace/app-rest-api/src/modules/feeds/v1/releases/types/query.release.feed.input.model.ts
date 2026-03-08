
/**
 * Input type for querying the release feed.
 *
 * Used for GET /me/feeds/v1/releases - pagination and filters.
 *
 * @param event_type - Optional filter: "release_album", "release_episode" (comma-separated). v1: only release_album is supported.
 * @param days - Look-back window in days. Only releases with released_at >= CURDATE() - INTERVAL days DAY are included. Default: 60, min: 1, max: 90.
 * @param limit - Maximum number of feed items to return per page. Default: 10, min: 1, max: 150.
 * @param cursor - Opaque pagination cursor. Base64-encoded JSON with (releaseDate, releasedObjectId). Pass empty string for first page; use nextCursor from response for subsequent pages.
 *
 * Note: Structural validation is handled by Zod schema.
 * Note: paging is done with cursor+limit instead of offset+limit since data comes from different sources (albums and episodes).
 * Note: cursor data is represented as string since we dont want to expose the internal details of the cursor to the client.
 */
export interface QueryReleaseFeedInput {
  event_type?: ReleaseFeedEventType[];
  days: number;
  limit: number;
  cursor: string;
}


/**
 * Event type values for the release feed filter.
 * Constants are the source of truth; array and type are derived for zod validation.
 */
export const RELEASE_FEED_EVENT_ALBUM = "release_album" as const;
export const RELEASE_FEED_EVENT_EPISODE = "release_episode" as const;

export const RELEASE_FEED_EVENT_TYPES = [
  RELEASE_FEED_EVENT_ALBUM,
  RELEASE_FEED_EVENT_EPISODE,
] as const;

export type ReleaseFeedEventType = (typeof RELEASE_FEED_EVENT_TYPES)[number];

