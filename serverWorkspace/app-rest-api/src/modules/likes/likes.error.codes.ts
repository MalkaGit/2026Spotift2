/**
 * Likes domain error codes
 * 
 * These error codes are part of the Likes API contract.
 * They are used by the frontend to display appropriate error messages to users.
 * 
 * Architecture:
 *    - Domain-scoped: All likes-related error codes are defined here
 *    - Machine-readable: String constants for programmatic error handling
 *    - Independent of HTTP: Same error code can map to different HTTP status codes if needed
 *    - Naming convention: Use "LIKES_" prefix to avoid conflicts with other domains
 * 
 * Usage:
 *    - In likes service: throw new ConflictError(LikesErrorCode.ALREADY_LIKED, "User has already liked this entity")
 *    - Frontend checks error.code to determine which error message to show
 * 
 * Error Code Categories:
 *    - ConflictError codes (409): Resource conflicts (e.g., duplicate like)
 */

export const LikesErrorCode = {
    // ConflictError codes (409)
    ALREADY_LIKED: "LIKES_ALREADY_LIKED",
    // NotFoundError codes (404)
    LIKED_ENTITY_NOT_FOUND: "LIKED_ENTITY_NOT_FOUND",
} as const;

// Type for TypeScript autocomplete and type checking
export type LikesErrorCode = typeof LikesErrorCode[keyof typeof LikesErrorCode];

