/**
 * Error codes for the artists module.
 * Domain-scoped: all artist-related error codes are defined here.
 */
export const ArtistsErrorCode = {
  ARTIST_NOT_FOUND: "ARTIST_NOT_FOUND",
} as const;

export type ArtistsErrorCodeType = (typeof ArtistsErrorCode)[keyof typeof ArtistsErrorCode];
