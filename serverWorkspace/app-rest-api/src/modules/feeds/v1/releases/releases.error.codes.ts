/**
 * Release feed domain error codes
 *
 * These error codes are part of the Release Feed API contract.
 * They are used by the frontend to display appropriate error messages to users.
 *
 * Architecture:
 *   - Domain-scoped: All release-feed-related error codes are defined here
 *   - Machine-readable: String constants for programmatic error handling
 *   - Independent of HTTP: Same error code can map to different HTTP status codes if needed
 *   - Naming convention: Use "FEED_" prefix to avoid conflicts with other domains
 *
 * Usage:
 *   - In releases service: throw new BadRequestError(ReleasesErrorCode.RELEASE_EPISODE_NOT_IMPLEMENTED, "...")
 *   - Frontend checks error.code to determine which error message to show
 *
 * Error Code Categories:
 *   - BadRequestError codes (400): Invalid or unsupported request parameters
 */

export const ReleasesErrorCode = {
  // BadRequestError codes (400)
  RELEASE_EPISODE_NOT_IMPLEMENTED: "FEED_RELEASE_EPISODE_NOT_IMPLEMENTED",
} as const;

export type ReleasesErrorCode =
  (typeof ReleasesErrorCode)[keyof typeof ReleasesErrorCode];
