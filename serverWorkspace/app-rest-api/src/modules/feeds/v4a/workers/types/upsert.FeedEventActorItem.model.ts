/**
 * Minimal feed upsert DTO for `feed_actors`.
 */
export type UpsertFeedEventActorItem = {
  event_id: string;
  feed_type: string;
  actor_type: string;
  actor_id: string;
  actor_name: string;
  actor_image_url: string | null;
};
