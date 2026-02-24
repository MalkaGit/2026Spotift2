/**
 * Track model returned by getTrackById.
 * Track is considered present only when not soft-deleted and its album is not soft-deleted.
 */
export interface Track {
  id: string;
  name: string;
  durationMs: number;
  artistId: string;
}
