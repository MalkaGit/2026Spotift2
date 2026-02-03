import { SearchableType } from "./searchable.types";

/**
 * SearchItem represents a single search result item, 
 * including enriched information about the entity.
 * 
 * Reusable across different search endpoints:
 * - GET /search/v1/artists   - Returns array of SearchItem objects in response body: { items: SearchItem[] }
 * - GET /search/v1/albums    - Returns array of SearchItem objects (future)
 * - GET /search/v1/tracks    - Returns array of SearchItem objects (future)
 * - GET /search/v1/playlists - Returns array of SearchItem objects (future)
 * 
 * Each item contains information about a searchable entity (artist, album, track, or playlist),
 * including the entity's type, ID, name, image URL, and whether the current user has liked it.
 * 
 * Note: This is a domain model, not a DTO. We saved the need for a separate DTO since this model
 *       is good enough for both internal service/repository layers and external API contract.
 */
export interface SearchItem {
  id: string;
  entityType: SearchableType;
  name: string;
  ownerName?: string; //eg, artist name for album
  imageUrl?: string;
  liked: boolean;
}

