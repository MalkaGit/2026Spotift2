import { logger, type MySqlConnection } from "@mycompanyname/lib-common";
import type { AddActivityEventInput } from "./types/add.activity.event.input.model";
import type { AddActivityEventActorsInput } from "./types/add.activity.event.actors.input.model";

const LOG_SCOPE = "activityEvents.repository";


/**
 * Insert any kind of event into activity_events.
 * Notes:
 * -This reposiotry layer is generic and does not depend on specific event type (album released, episode released, etc.)
 * -This method can run in transaction. For that, it gets the connection as parameter.
 * -Does NOT write activity_event_actors; callers handle that separately.
*/
export async function insertActivityEvent<TEventPayload>(
  conn: MySqlConnection,
  event: AddActivityEventInput<TEventPayload>
): Promise<void> {
  const payloadJson = JSON.stringify(event.eventPayload);

  const sqlEvent = `
    INSERT INTO activity_events (
      event_id,
      event_time,
      event_domain,
      event_type,
      aggregate_type,
      aggregate_id,
      event_payload_json,
      schema_version
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `;
  const paramsEvent = [
    event.eventId,
    event.eventTime,
    event.eventDomain,
    event.eventType,
    event.aggregateType,
    event.aggregateId,
    payloadJson,
    event.schemaVersion,
  ];

  logger.debug(`${LOG_SCOPE}.insertActivityEvent - insert activity_events`, {
    sql: sqlEvent.replace(/\s+/g, " ").trim(),
    params: paramsEvent,
  });
  await conn.query(sqlEvent, paramsEvent);
}

/**
 * Insert actor rows for a given event into activity_event_actors.
 * -This method can run in transaction. For that, it gets the connection as parameter.
 * -This method execute single statement that inserts serveral rows to the actors table
*/
export async function insertActivityEventActors(
  conn: MySqlConnection,
  input: AddActivityEventActorsInput
): Promise<void> {
  if (input.actors.length === 0) return;

  const valuesPlaceholders = input.actors.map(() => "(?, ?, ?, ?)").join(", ");
  const sqlActor = `
    INSERT INTO activity_event_actors (
      event_id,
      actor_type,
      actor_id,
      actor_name
    )
    VALUES ${valuesPlaceholders}
  `;

  const paramsActor = input.actors.flatMap((actor) => [
    input.eventId,
    actor.actorType,
    actor.actorId,
    actor.actorName,
  ]);

  logger.debug(`${LOG_SCOPE}.insertActivityEventActors - insert activity_event_actors`, {
    sql: sqlActor.replace(/\s+/g, " ").trim(),
    params: paramsActor,
  });

  await conn.query(sqlActor, paramsActor);
}
