/**
 * User domain error codes
 * 
 * These error codes are part of the Users API contract.
 * They are used by the frontend to display appropriate error messages to users.
 * 
 * Architecture:
 *    - Domain-scoped: All user-related error codes are defined here
 *    - Machine-readable: String constants for programmatic error handling
 *    - Independent of HTTP: Same error code can map to different HTTP status codes if needed
 *    - Naming convention: Use "USER_" prefix to avoid conflicts with other domains
 * 
 * Usage:
 *    - In user service: throw new BadRequestError(UserErrorCode.PASSWORD_TOO_WEAK, "Password is too weak")
 *    - In user service: throw new ConflictError(UserErrorCode.USER_ALREADY_EXISTS, "User already exists")
 *    - Frontend checks error.code to determine which error message to show
 * 
 * Error Code Categories:
 *    - BadRequestError codes (400): Invalid request parameters
 *    - UnauthorizedError codes (401): Authentication failures
 *    - ConflictError codes (409): Resource conflicts (e.g., duplicate email)
 *    - NotFoundError codes (404): Entity not found (if needed in future)
 */

export const UserErrorCode = {
    // BadRequestError codes (400)
    PASSWORD_TOO_WEAK: "USER_PASSWORD_TOO_WEAK",
    
    // UnauthorizedError codes (401)
    INVALID_CREDENTIALS: "USER_INVALID_CREDENTIALS",
    
    // ConflictError codes (409)
    USER_ALREADY_EXISTS: "USER_ALREADY_EXISTS",
    
    // NotFoundError codes (404)
    USER_NOT_FOUND: "USER_NOT_FOUND",
  } as const;
  
  // Type for TypeScript autocomplete and type checking
  export type UserErrorCode = typeof UserErrorCode[keyof typeof UserErrorCode];
  
  