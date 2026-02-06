import type { LikesItem } from '@/types';

/** Number of liked items that are artists. Used for onboarding rule and display. */
export function getArtistCount(items: LikesItem[]): number {
  return items.filter((i) => i.likedEntityType === 'artist').length;
}
