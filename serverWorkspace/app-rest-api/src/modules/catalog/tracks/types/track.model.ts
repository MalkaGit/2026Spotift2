/**
 * Track (minimal). Tracks table only, no join. Returned by getTracksByIds.
 * Caller composes with getAlbumsByIds when album details are needed.
 */
export interface Track {
  id: string;
  name: string;
  durationMs: number;
  albumId: string;
}
