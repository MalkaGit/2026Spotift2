/**
 * Phase 10.4
 * File module exporting domain error types
 * 
 * Goal:
 *    Define domain-specific error classes with error codes and messages
 *    Domain errors are thrown by domain layer and handled by API layer (error handler middleware)
 *    Error codes are machine-readable and independent of HTTP status codes
 * 
 * Architecture:
 *    - Domain errors have error code (string) that is independent of HTTP
 *    - Domain errors have human-readable message
 *    - Error codes are machine-readable for programmatic error handling
 *    - Framework-agnostic: errors are domain concepts, not tied to Express/HTTP
 *    - Error codes are domain-scoped (e.g., "USER_PASSWORD_TOO_WEAK", "SONG_NOT_FOUND")
 * 
 * Flow:
 *    1. Domain layer throws domain errors (BadRequestError, NotFoundError, etc.)
 *    2. Error handler middleware (API layer) catches domain errors
 *    3. Middleware maps domain error to HTTP response with HTTP status code and domain error code
 *    4. Frontend receives HTTP status code and domain error code for error handling
 * 
 * Usage:
 *    - In domain layer: throw new BadRequestError("USER_PASSWORD_TOO_WEAK", "Password is too weak")
 *    - In domain layer: throw new NotFoundError("SONG_NOT_FOUND", "Song with id 123 not found")
 *    - Error handler middleware automatically converts to HTTP response
 * 
 * Error Code Naming Convention:
 *    - Use domain prefix: "USER_", "SONG_", "AUTH_", etc.
 *    - Use descriptive names: "USER_PASSWORD_TOO_WEAK", "SONG_NOT_FOUND"
 *    - Define error codes in each domain module (not in lib-common)
 * 
 * Error Types:
 *    - BadRequestError (400): Invalid request according to business rules
 *    - UnauthorizedError (401): Authentication required but missing
 *    - ForbiddenError (403): Operation forbidden by business rules
 *    - NotFoundError (404): Requested entity not found
 *    - ConflictError (409): Conflict occurs (e.g., duplicate entry)
 */

  /**
   * Base class for all domain-specific errors.
   */
  export abstract class DomainError extends Error {
    readonly code: string;
    readonly details?: unknown;
  
    protected constructor(
      code: string,
      message: string,
      details?: unknown
    ) {
      super(message);
      this.name = this.constructor.name;
      this.code = code;
      this.details = details;
      // Ensure stack traces show where error was thrown, not constructed
      if (Error.captureStackTrace) {
        Error.captureStackTrace(this, this.constructor);
      }
    }
  }
  
  

  /**
   * Thrown when the request is invalid according to business rules (400)
   * 
   * @example
   * throw new BadRequestError("USER_PASSWORD_TOO_WEAK", "Password is too weak");
   */
    export class BadRequestError extends DomainError {
      constructor(code: string, message: string, details?: unknown) {
        super(code, message, details);
      }
    }
  
  /**
   * Thrown when authentication is required but missing (401)
   * 
   * @example
   * throw new UnauthorizedError("Authentication required");
   */
  export class UnauthorizedError extends DomainError {
    constructor(message: string, details?: unknown) {
      super("UNAUTHORIZED", message, details);
    }
  }
  
  /**
   * Thrown when an operation is forbidden by business rules (403)
   * 
   * @example
   * throw new ForbiddenError("User does not have permission");
   */
  export class ForbiddenError extends DomainError {
    constructor(message: string, details?: unknown) {
      super("FORBIDDEN", message, details);
    }
  }
  
  /**
   * Thrown when a requested entity is not found (404)
   * 
   * @example
   * throw new NotFoundError("SONG_NOT_FOUND", "Song with id 123 not found");
   */
  export class NotFoundError extends DomainError {
    constructor(code: string, message: string, details?: unknown) {
      super(code, message, details);
    }
  }
  

  
  /**
   * Thrown when a conflict occurs (e.g., duplicate entry) (409)
   * 
   * @example
   * throw new ConflictError("USER_ALREADY_EXISTS", "User with email already exists");
   */
  export class ConflictError extends DomainError {
    constructor(code: string, message: string, details?: unknown) {
      super(code, message, details);
    }
  }
  