export interface AddFeedEventInput<TEventPayload = unknown> {
  eventId: string;
  eventOccurredAt: Date;
  feedType: string;
  feedVerb: string;
  feedObjectType: string;
  feedObjectId: string;
  feedObjectTitle: string;
  feedObjectSubTitle: string | null;
  feedObjectImageUrl: string | null;
  eventPayload: TEventPayload;
}
