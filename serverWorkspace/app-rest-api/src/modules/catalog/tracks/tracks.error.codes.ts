/**
 * Error codes for the catalog tracks module.
 */
export const TrackErrorCode = {
  TRACK_NOT_FOUND: "TRACK_NOT_FOUND",
} as const;

export type TrackErrorCodeType =
  (typeof TrackErrorCode)[keyof typeof TrackErrorCode];
