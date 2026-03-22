/**
 * V4a output model for release feed.
 * Same conceptual shape as v3; used when reading from `feeds`.
 */
export interface ReleaseFeedOutput {
  items: ReleaseFeedItem[];
  cursor?: string;
}

export interface ReleaseFeedItem {
  feedActors: ReleaseFeedActor[];
  feedVerb: "released";
  feedObject: ReleaseFeedObject;
  occurredAt: string;
}

export interface ReleaseFeedActor {
  type: "artist" | "show";
  id: string;
  name: string;
}

export interface ReleaseFeedObject {
  type: "album" | "episode";
  id: string;
  title: string;
  imageUrl: string;
  episodeDurationMs?: number;
  albumType?: ReleaseFeedAlbumType;
}

export type ReleaseFeedAlbumType = "album" | "single" | "compilation";

