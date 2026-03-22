import type { ReleaseFeedOutput, QueryReleaseFeedInput } from "./types";
import * as releasesRepository from "./releases.repository";

/**
 * V2 release feed service: reads from activity_events.
 * Supports both release_album (artist) and release_episode (show); improved over v1.
 * Query params (e.g. event_type) are passed through to the repository.
 */
export async function getReleaseFeeds(
  userId: string,
  query: QueryReleaseFeedInput
): Promise<ReleaseFeedOutput> {
  return releasesRepository.getReleaseFeeds(userId, query);
}
