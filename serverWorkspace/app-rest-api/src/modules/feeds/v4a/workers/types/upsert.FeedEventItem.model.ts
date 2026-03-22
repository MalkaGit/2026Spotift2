/**
 * Minimal feed upsert DTO produced by the v4a worker pipeline.
 * Maps into the global `feeds` table.
 */
export type UpsertFeedEventItem = {
  event_id: string;
  event_occurred_at: Date;
  feed_type: string;
  feed_verb: string;
  feed_object_type: string;
  feed_object_id: string;
  feed_object_title: string;
  feed_object_sub_title: string | null;
  feed_object_image_url: string | null;
  feed_object_payload_json: string;
};
