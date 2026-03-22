export interface AddFeedEventActorsInput {
  eventId: string;
  feedType: string;
  actors: FeedEventActor[];
}

export interface FeedEventActor {
  actorType: string;
  actorId: string;
  actorName: string;
  actorImageUrl?: string | null;
}
