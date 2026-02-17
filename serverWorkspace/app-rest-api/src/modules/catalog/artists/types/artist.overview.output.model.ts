/**
 * Artist top track item in the overview output.
 */
export interface ArtistOverviewTrackItem {
    /** 1-based rank of the track in the top list (1 = most played) */
    rank: number;
  trackId: string;
  trackName: string;
  totalPlays: number;
  durationMs: number;
  albumId: string;
  albumImageUrl: string;
}

/**
 * Output model for the "artist overview" endpoint (v1).
 */
export interface ArtistOverviewOutput {
  /** Artist UUID */
  artistId: string;

  /** Display name of the artist */
  artistName: string;

  /** Header image URL for the artist (banner) */
  headerImageUrl: string | null;

  /** Current monthly listeners for the artist (from artist_stats) */
  monthlyListeners: number;

  /** Artist's top tracks with aggregate stats */
  topTracks: ArtistOverviewTrackItem[];
}

