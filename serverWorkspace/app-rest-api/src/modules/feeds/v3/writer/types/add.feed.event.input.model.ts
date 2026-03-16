export interface AddFeedEventInput<TEventPayload = unknown> {
  eventId: string;
  eventTime: Date;
  eventDomain: string;
  eventType: string;
  aggregateType: string;
  aggregateId: string;
  eventPayload: TEventPayload;
}
