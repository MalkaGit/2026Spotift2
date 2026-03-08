/**
 * Catalog albums - exports Album type, albums service, and router.
 */
export type { Album } from "./types/album.model";
export * as albumsService from "./albums.service";
export { default as albumsRouter } from "./albums.router";
