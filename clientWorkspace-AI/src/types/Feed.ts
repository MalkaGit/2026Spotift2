export type ReleaseFeedEventType = 'release_album' | 'release_episode';

export interface ReleaseFeedActor {
  type: 'artist' | 'show';
  id: string;
  name: string;
}

export interface ReleaseFeedObject {
  type: 'album' | 'episode';
  id: string;
  title: string;
  imageUrl: string;
  episodeDurationMs?: number;
  albumType?: 'album' | 'single' | 'compilation';
}

export interface ReleaseFeedItem {
  feedActors: ReleaseFeedActor[];
  feedVerb: 'released';
  feedObject: ReleaseFeedObject;
  occurredAt: string;
}

export interface ReleaseFeedResponse {
  items: ReleaseFeedItem[];
  nextCursor?: string;
}

export interface QueryReleaseFeedParams {
  event_type?: ReleaseFeedEventType | ReleaseFeedEventType[];
  days?: number;
  limit?: number;
  cursor?: string;
}
