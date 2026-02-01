/**
 * Likes module - exports controller and types for cross-domain usage
 * 
 * This file provides a single entry point for the likes module.
 * Other modules (users, artists, albums, playlists) import from here to use likes functionality.
 * 
 */

// Export controller methods (used by other routers)
export { addLike, queryMyLikes } from "./likes.controller";


