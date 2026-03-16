/**
 * Error codes for the catalog albums module.
 */
export const AlbumsErrorCode = {
  ALBUM_NOT_FOUND: "ALBUM_NOT_FOUND",
  ALBUM_ALREADY_RELEASED: "ALBUM_ALREADY_RELEASED",
} as const;

export type AlbumsErrorCodeType =
  (typeof AlbumsErrorCode)[keyof typeof AlbumsErrorCode];
