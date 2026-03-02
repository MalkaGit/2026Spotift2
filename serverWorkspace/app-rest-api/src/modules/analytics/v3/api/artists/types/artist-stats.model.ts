/**
 * Artist stats from artist_stats table (monthly_listeners, total_plays).
 * Used by artist overview v3 (MS-ready: catalog calls analytics artists service, no join).
 */
export interface ArtistStats {
  monthlyListeners: number;
  totalPlays: number;
}
