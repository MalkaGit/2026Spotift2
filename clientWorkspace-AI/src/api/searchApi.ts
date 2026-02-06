import { httpClient } from './httpClient';
import type { SearchItem, SearchArtistsParams } from '@/types';

export interface SearchArtistsResponse {
  items: SearchItem[];
}

export async function searchArtists(params: SearchArtistsParams): Promise<SearchArtistsResponse> {
  const { data } = await httpClient.get<SearchArtistsResponse>('/search/v2/artists', { params });
  return data;
}
