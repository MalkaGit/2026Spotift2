export interface AddFeedEventActorsInput {
  eventId: string;
  actors: FeedEventActor[];
}

export interface FeedEventActor {
  actorType: string;
  actorId: string;
  actorName: string;
}
