import { httpClient } from './httpClient';
import type { ArtistOverviewOutput } from '@/types/ArtistOverview';

export async function getArtistOverview(artistId: string): Promise<ArtistOverviewOutput> {
  // Use v2 backend endpoint (denormalized top tracks, same response shape)
  const { data } = await httpClient.get<ArtistOverviewOutput>(`/artists/${artistId}/overview/v2`);
  return data;
}
