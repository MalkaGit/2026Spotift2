/**
 * Phase 10.10
 * File module exporting Express error handler middleware
 * 
 * Goal:
 *    Global error middleware that centralizes all error handling
 *    Handles three error types: 
 *        zod validation errors, 
 *        domain errors, 
 *        and unexpected errors
 *    When error occurs it 
 *       writes to log with appropriate log levels 
 *       and returns relevant HTTP response (status code and body)
 * 
 * Architecture:
 *    - application api is tied to domain error codes (for simplicity)
 *    - but validation error codes are mapped from Zod codes to stable, library-agnostic codes
 *        
 * Flow:
 *    1. Express calls this middleware when any error is thrown (via next(err))
 *    2. Errors are handled in order: validation → domain → unexpected
 *     3. ZodError:    request validation error 
 *                     log warning and return 
 *                     http status code 400 
 *                     and in body: { code: "REQUEST_VALIDATION_FAILED", errors: [{ field, code }] }
 *     4. DomainError: Business rule violation 
 *                     log warning and return 
 *                     http status code 400/401/403/404/409 based on error type
 *                         BadRequestError (400), UnauthorizedError (401), ForbiddenError (403), NotFoundError (404), ConflictError (409)
 *                     and in body:  { code: string, message: string }
 *     5. Unexpected:  Programming/database errors
 *                     logs full error and return
 *                     http status code 500 
 *                     and in body: { message: "Internal Server Error" }
 *     Logger automatically includes correlationId and userId from request context
 *
 * Usage:
 *    - Apply as last middleware: app.use(errorMiddleware)
 *    - Must be after all routes and other middleware
 *    - Automatically catches all errors thrown via next(err)
 * 
 * Dependencies:
 *    cd in serverWorkspace/packages/lib-common
 *    npm install express
 *    npm install zod
 * 
 * Notes:
 *    - Field paths use dot notation for nested fields (e.g., "user.address")
 *    - Root-level errors use field path "root"
 *    - Custom validation errors from schema.refine() must use stable error code strings
 *
 * Error Codes (with examples):
 * 
 * - invalid_type: Wrong data type provided
 *   Example: { field: "limit", code: "invalid_type" } when limit="abc" (expected number)
 * 
 * - too_small: Value below minimum (string length, number, array size)
 *   Example: { field: "title", code: "too_small" } when title="" (min length 1)
 *   Example: { field: "limit", code: "too_small" } when limit=0 (min 1)
 * 
 * - too_big: Value above maximum (string length, number, array size)
 *   Example: { field: "limit", code: "too_big" } when limit=200 (max 100)
 * 
 * - invalid_string: Invalid string format (general)
 *   Example: { field: "url", code: "invalid_string" } when url="not-a-url"
 * 
 * - uuid: Invalid UUID format
 *   Example: { field: "id", code: "uuid" } when id="not-a-uuid"
 * 
 * - url: Invalid URL format
 *   Example: { field: "url", code: "url" } when url="invalid-url"
 * 
 * - email: Invalid email format
 *   Example: { field: "email", code: "email" } when email="not-an-email"
 * 
 * - unrecognized_keys: Extra fields not allowed (strict mode)
 *   Example: { field: "root", code: "unrecognized_keys" } when body has extra fields
 * 
 * - custom: Custom validation error from schema.refine()
 *   Example: { field: "root", code: "at_least_one_field_required" } from custom refine message
 * 
 * - invalid: Unknown/unmapped error code
 *   Example: { field: "field", code: "invalid" } for unexpected validation errors
 * 
 * Field paths: dot notation for nested (e.g., "user.address"), 'root' for root-level errors
 * Returns: Array of errors (multiple validation failures possible in single request)
 */


import { Request, Response, NextFunction } from "express";
import { ZodError, ZodIssue } from "zod";
import { logger } from "../../utils/logger";
import {
  DomainError,
  UnauthorizedError,
  BadRequestError,
  NotFoundError,
  ForbiddenError,
  ConflictError,
} from "../../domain/errors";


interface FieldErrorDto {
  field: string;  // Field path (dot notation for nested, 'root' for root-level)
  code: string;   // Stable error code (library-agnostic)
}

function mapZodErrorCodeToDtoErrorCode(issue: ZodIssue): string {
  switch (issue.code) {
    case 'invalid_type':
      return 'invalid_type';

    case 'too_small':
      return 'too_small';

    case 'too_big':
      return 'too_big';

    case 'invalid_format':
      // Extract validation type (uuid, url, email, etc.) or default to invalid_string
      const validationType = 'validation' in issue ? (issue as any).validation : undefined;
      return validationType ?? 'invalid_string';

    case 'unrecognized_keys':
      return 'unrecognized_keys';

    case 'custom':
      // Schema authors must use stable error code strings in refine() messages
      return issue.message;

    default:
      return 'invalid';
  }
}

function mapZodErrorToDtoError(error: ZodError): FieldErrorDto[] {
  return error.issues.map((issue) => ({
    field: issue.path.length > 0 ? issue.path.join('.') : 'root',
    code: mapZodErrorCodeToDtoErrorCode(issue),
  }));
}

/**
 * Maps domain error instances to their HTTP status codes
 */
function getDomainErrorStatusCode(err: DomainError): number {
  if (err instanceof BadRequestError) return 400;
  if (err instanceof UnauthorizedError) return 401;
  if (err instanceof ForbiddenError) return 403;
  if (err instanceof NotFoundError) return 404;
  if (err instanceof ConflictError) return 409;
  // Fallback (should never happen if all domain errors are properly handled)
  return 500;
}

export function errorMiddleware(
  err: unknown,
  req: Request,
  res: Response,
  next: NextFunction
) {
  const baseLogContext = {
    method: req.method,
    path: req.path,
  };

  // Request validation errors
  if (err instanceof ZodError) {
    const validationErrors = mapZodErrorToDtoError(err);
    
    logger.warn("Request validation failed", {
      ...baseLogContext,
      errors: validationErrors,
    });

    return res.status(400).json({
      code: "REQUEST_VALIDATION_FAILED",
      errors: validationErrors,
    });
  }

  // Domain errors
  if (err instanceof DomainError) {
    const statusCode = getDomainErrorStatusCode(err);
    
    logger.warn("Domain error", {
      ...baseLogContext,
      code: err.code,
      message: err.message,
    });

    return res.status(statusCode).json({
      code: err.code,
      message: err.message,
    });
  }

  // Unexpected errors
  const errorMessage = err instanceof Error ? err.message : String(err);
  const errorStack = err instanceof Error ? err.stack : undefined;

  logger.error("Unexpected error", {
    ...baseLogContext,
    error: errorMessage,
    stack: errorStack,
  });

  return res.status(500).json({
    message: "Internal Server Error",
  });
}
