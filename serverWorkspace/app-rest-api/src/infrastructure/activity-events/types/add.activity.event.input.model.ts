/**
 * Generic envelope for inserting any type of event into `activity_events`.
 * This layer stays generic: it does not know about specific domains or payload shapes.
 * Design notes:
 * - The addActivity repository method does not know about specific event type 
 * - Clear envelope vs payload separation
 *   envelop is used for querying the actitivty events table
 *   payload is used for the event specific data that can be used later on (eg, analytics workers populating stat tables, feeds workers populating feeds frojection tables - feed_events&feed_event_actors etc)
 * - some fields are duplicated in the activity_event table and in the payload.
 *   This is intentional
 *   It allows use to query the activity events by those fields
 *   It allows use to use the payload for other purposes (eg, analytics workers populating stat tables, feeds workers populating feeds from projection tables - feed_events&feed_event_actors etc)
 *   We do it since the payload should often be understandable on its own, 
 *   even if moved to Kafka, SQS, outbox, logs, or another database.
 */
export interface AddActivityEventInput<TEventPayload = unknown> {
  eventId: string;
  eventOccurredAt: Date;
  eventStreamName: string;
  eventType: string;         
  aggregateType: string;     
  aggregateId: string;      
  eventPayload: TEventPayload;
  schemaVersion: number;
}

