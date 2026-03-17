import type {
  ReleaseFeedOutput,
  QueryReleaseFeedInput,
} from "./types";
import * as releasesRepository from "./releases.repository";

/**
 * V4a release feed service: reads from feed_events / feed_event_actors
 * projections maintained by v4a workers.
 */
export async function getReleaseFeeds(
  userId: string,
  query: QueryReleaseFeedInput
): Promise<ReleaseFeedOutput> {
  return releasesRepository.getReleaseFeeds(userId, query);
}

