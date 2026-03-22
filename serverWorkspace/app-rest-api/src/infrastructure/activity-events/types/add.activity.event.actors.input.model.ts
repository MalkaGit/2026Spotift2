/**
 * Input model for inserting actor rows for a single activity event.
 *
 * This is the generic shape used by the activity-events repository when writing
 * into `activity_event_actors`, independent of any specific domain event.
 */
export interface AddActivityEventActorsInput {
  eventId: string;
  actors: ActivityEventActor[];
}


/**
 * A single actor row for an activity event.
 * Mirrors one row in the `activity_event_actors` table.
 */
export interface ActivityEventActor {
  actorType: string;
  actorId: string;
  actorName: string;
}
