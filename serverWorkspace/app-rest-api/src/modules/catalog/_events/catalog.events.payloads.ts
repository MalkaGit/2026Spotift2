import type { AlbumType } from "../albums/types/album.model";
import {
  ACTOR_TYPE_ARTIST,
  AGGREGATE_TYPE_ALBUM,
  DOMAIN_CATALOG,
  EVENT_TYPE_ALBUM_RELEASED,
} from "./catalog.events.constants";

/**
 * This file defines the payloads of all the events produced by this catalog domain.
 * The shared activity-events module only stores them.
 *
 * Always treat this file as the source of truth for what goes into JSON payloads, even if they
 * are very similar to the ActivityEvent type used to store the canonical envelope.
 * This helps keep the catalog domain decoupled from transport/persistence details.
 */

/**
 * Catalog-owned payload for `catalog.album_released` events.
 *
 * - This is the domain snapshot that gets serialized into `activity_events.event_payload_json`.
 * - Envelope fields (`event_id`, `occurred_at`, `event_domain`, `event_type`,
 *   `aggregate_type`, `aggregate_id`, `schema_version`, `created_at`) live on the
 *   `activity_events` row and are not part of this type.
 * - Some values are intentionally duplicated between envelope and payload
 *   (for example `aggregate_id` and `album.id`) so the payload is self-contained
 *   and readable if moved to Kafka, SQS, logs, or another database.
 */
export interface AlbumReleasedEventPayload {
  album: {
    id: string;
    title: string;
    imageUrl: string | null;
    albumType: AlbumType;
  };
  releasedAt: Date;
  artists: {
    id: string;
    name: string;
  }[];
}

