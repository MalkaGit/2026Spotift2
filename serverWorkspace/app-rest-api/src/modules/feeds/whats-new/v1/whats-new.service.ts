import { BadRequestError } from "@mycompanyname/lib-common";
import type { QueryWhatsNewInput, WhatsNewOutput } from "../types";
import * as whatsNewRepository from "./whats-new.repository";
import { WhatsNewErrorCode } from "./whats-new.error.codes";

 /**
 * v1 service for What's New feed - reading from source of truth tables only
 *
 * Product API goal:
 * - unified feed of recent releases for followed artists/shows
 * - ordered by release time descending
 * - cursor pagination
 *
 * v1 limitation:
 * - reads albums only
 * - episode support is intentionally blocked for now
 *   because paging across two independent source tables
 *   (albums + episodes) is deferred to a later version
 *
 * Service responsibility:
 * - enforce v1 business rules
 * - adapt HTTP query DTO to repository parameters
 */
export async function getWhatsNewFeeds(
  userId: string,
  query: QueryWhatsNewInput
): Promise<WhatsNewOutput> {

  //bl: reject requests for episodes (not implemented yet since supprting cursor paging over two different sources, albums and episodes, is tricky. we will support it once we read from single table).
  if (query.object_type?.includes("episode")) {
    throw new BadRequestError(
      WhatsNewErrorCode.EPISODE_NOT_IMPLEMENTED,
      "episode is not implemented yet; use album or omit object_type"
    );
  }

  return whatsNewRepository.getWhatsNewFeeds(
    userId,
    query.days,
    query.limit,
    query.cursor
  );
}
