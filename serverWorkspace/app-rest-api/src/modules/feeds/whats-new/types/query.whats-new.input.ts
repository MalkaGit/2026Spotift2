/**
 * Query string shape for the "What's New" feed.
 *
 * Intended for e.g. `GET /me/feeds/whats-new` — pagination and filters.
 *
 * @param object_type - Optional filter: `album`, `episode` (comma-separated).
 * @param days - Look-back window in days. Default: 60, min: 1, max: 90.
 * @param limit - Max items per page. Default: 10, min: 1, max: 150.
 * @param cursor - Optional. Opaque base64url JSON `{ releaseDate, releasedObjectId }` (v1 releases). Omit or empty = first page.
 *
 * Structural validation: use a Zod schema alongside this type.
 */
export interface QueryWhatsNewInput {
  object_type?: WhatsNewObjectType[];
  days: number;
  limit: number;
  cursor?: string;
}

/** Allowed `object_type` values: album | episode */
export const WHATS_NEW_OBJECT_TYPES = ["album", "episode"] as const;
export type WhatsNewObjectType = (typeof WHATS_NEW_OBJECT_TYPES)[number];
