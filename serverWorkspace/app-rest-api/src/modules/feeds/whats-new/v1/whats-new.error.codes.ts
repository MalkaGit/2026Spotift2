/**
 * What's New feed — domain error codes (API contract).
 * Used with `BadRequestError` for unsupported query combinations (same idea as `feeds/_old/v1/releases`).
 */
export const WhatsNewErrorCode = {
  EPISODE_NOT_IMPLEMENTED: "FEED_WHATS_NEW_EPISODE_NOT_IMPLEMENTED",
} as const;

export type WhatsNewErrorCode =
  (typeof WhatsNewErrorCode)[keyof typeof WhatsNewErrorCode];
