/**
 * Album model (used by getTrackById join and elsewhere).
 */
export interface Album {
  id: string;
  name: string;
  imageUrl: string | null;
}
