import { httpClient } from './httpClient';
import type { ArtistOverviewOutput } from '@/types/ArtistOverview';

export async function getArtistOverview(artistId: string): Promise<ArtistOverviewOutput> {
  const { data } = await httpClient.get<ArtistOverviewOutput>(`/artists/${artistId}/overview`);
  return data;
}
