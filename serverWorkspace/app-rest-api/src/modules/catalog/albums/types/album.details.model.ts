import type { AlbumType } from "./album.model";



export interface AlbumDetails {
  id: string;
  name: string;
  albumType: AlbumType;
  imageUrl: string | null;
  /** When the album was released; null if not yet released. */
  releasedAt: Date | null;
  artists: readonly AlbumDetailsArtist[];
}


export interface AlbumDetailsArtist {
  id: string;
  name: string;
}
