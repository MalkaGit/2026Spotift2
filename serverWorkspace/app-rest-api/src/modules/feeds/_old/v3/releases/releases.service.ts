import type { ReleaseFeedOutput, QueryReleaseFeedInput } from "./types";
import * as releasesRepository from "./releases.repository";

/**
 * V3 release feed service: reads from `feeds` / `feed_actors`.
 * Response shape and query params mirror v2.
 */
export async function getReleaseFeeds(
  userId: string,
  query: QueryReleaseFeedInput
): Promise<ReleaseFeedOutput> {
  return releasesRepository.getReleaseFeeds(userId, query);
}

