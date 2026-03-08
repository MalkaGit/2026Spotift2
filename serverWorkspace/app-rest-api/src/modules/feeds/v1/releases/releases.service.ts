import type { ReleaseFeedOutput, QueryReleaseFeedInput } from "./types";
import * as releasesRepository from "./releases.repository";
import { BadRequestError } from "@mycompanyname/lib-common";
import { ReleasesErrorCode } from "./releases.error.codes";

/**
 * Get release feeds for the current user.
 * v1: only release_album is supported; release_episode returns 400.
 * Note: this is a monolith, not a modular monolith, so we can access any table in the db directly (without calling other service)
 */
export async function getReleaseFeeds(
  userId: string,
  query: QueryReleaseFeedInput
): Promise<ReleaseFeedOutput> {

  //bl: reject requests for episodes (not implemented yet since supprting cursor paging over two different sources, albums and episodes, is tricky. we will support it once we read from single table).
  if (query.event_type?.includes("release_episode")) {
    throw new BadRequestError(
      ReleasesErrorCode.RELEASE_EPISODE_NOT_IMPLEMENTED,
      "release_episode is not implemented yet; use release_album or omit event_type"
    );
  }

  //bl: get release feeds for the current user (starts from likes for single query).
  return releasesRepository.getReleaseFeeds(userId, query);
}
