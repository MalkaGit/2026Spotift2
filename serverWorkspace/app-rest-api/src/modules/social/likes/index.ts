/**
 * Likes module - exports controller and selected service methods for cross-domain usage
 *
 * This file provides a single entry point for the likes module.
 * Other modules (users, artists, albums, playlists) import from here to use likes functionality.
 */

// Export controller methods (used by other routers / HTTP layer)
export { addLike, queryMyLikes } from "./likes.controller";

// Export small cross-module helper for other domains (e.g. artists)
export { likeExists } from "./likes.service";
