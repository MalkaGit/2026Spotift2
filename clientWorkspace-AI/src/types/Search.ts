export interface SearchItem {
  id: string;
  entityType: string;
  name: string;
  ownerName?: string;
  imageUrl?: string;
  liked: boolean;
}

export interface SearchArtistsParams {
  q: string;
  offset?: number;
  limit?: number;
}
