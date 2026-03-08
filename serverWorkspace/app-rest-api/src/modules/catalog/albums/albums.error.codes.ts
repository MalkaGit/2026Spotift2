/**
 * Error codes for the catalog albums module.
 */
export const AlbumsErrorCode = {
  ALBUM_NOT_FOUND: "ALBUM_NOT_FOUND",
} as const;

export type AlbumsErrorCodeType =
  (typeof AlbumsErrorCode)[keyof typeof AlbumsErrorCode];
