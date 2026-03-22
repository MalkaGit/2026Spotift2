import type { ReleaseFeedOutput, QueryReleaseFeedInput } from "./types";
import * as releasesRepository from "./releases.repository";

/**
 * V4a release feed service: reads from `feeds` / `feed_actors`.
 */
export async function getReleaseFeeds(
  userId: string,
  query: QueryReleaseFeedInput
): Promise<ReleaseFeedOutput> {
  return releasesRepository.getReleaseFeeds(userId, query);
}

