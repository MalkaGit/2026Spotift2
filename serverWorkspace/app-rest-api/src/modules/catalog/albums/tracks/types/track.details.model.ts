import type { Album } from "../..";

/**
 * Track model returned by getTrackById.
 * Track is considered present only when not soft-deleted and its album is not soft-deleted.
 */
export interface TrackDetails {
  id: string;
  name: string;
  durationMs: number;
  album: Album;
}
