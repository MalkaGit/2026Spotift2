import { AlbumType } from "../../../catalog/albums/types/album.model";

/**
 * Output model for the "What's New" feed
 */
export interface WhatsNewOutput {
  items: WhatsNewItem[];
  cursor?: string; // base64url JSON { releaseDate, releasedObjectId } (ordered by released_at DESC, album id ASC)
}

export interface WhatsNewItem {
  feedActors: WhatsNewActor[];
  feedVerb: "released";
  feedObject: WhatsNewObject;
  eventOccurredAt: string;
}

export interface WhatsNewActor {
  type: "artist" | "show";
  id: string;
  name: string;
}

export interface WhatsNewObject {
  type: "album" | "episode";
  id: string;
  title: string;
  subTitle?: string;
  imageUrl: string;
  //fields used when object is an episode
  episodeDurationMs?: number;
  //fields used when object is an album
  albumType?: AlbumType;
}
