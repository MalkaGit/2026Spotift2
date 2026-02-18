export interface ArtistOverviewTrackItem {
  rank: number;
  trackId: string;
  trackName: string;
  totalPlays: number;
  durationMs: number;
  albumId: string;
  albumImageUrl: string;
}

export interface ArtistOverviewOutput {
  artistId: string;
  artistName: string;
  headerImageUrl: string | null;
  actionBarImageUrl: string | null;
  monthlyListeners: number;
  topTracks: ArtistOverviewTrackItem[];
  isLiked: boolean;
}
