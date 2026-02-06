export type LikedEntityType = 'artist' | 'album' | 'playlist';

export interface LikesItem {
  id: string;
  likedEntityType: LikedEntityType;
  likedEntityId: string;
  likedEntityName: string;
  /** Image URL for the entity (artist, album, or playlist) when available. */
  likedEntityImageUrl?: string;
  createdAt: string;
}

export interface QueryLikesParams {
  sort?: 'created_at' | 'name';
  direction?: 'asc' | 'desc';
  offset?: number;
  limit?: number;
}

export interface AddLikeInput {
  entityType: LikedEntityType;
  entityId: string;
}
