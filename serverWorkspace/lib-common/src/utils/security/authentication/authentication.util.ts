/**
 * Authentication Utility 
 * for validating authentication in service layer
 * 
 * Goal:
 *    Enforces authentication at the service layer
 *    Checks if a user is authenticated (userId exists in request context)
 *    Throws UnauthorizedError (401) if user is not authenticated
 * 
 * Architecture:
 *    - Framework-agnostic: works in any layer (controllers, services, repositories)
 *    - Uses request context to read userId (set by JWT auth middleware)
 *    - Business logic: authentication checks belong in the service layer, not just the API layer
 *    - No dependencies on Express or any framework
 *    - Can be reused in CLI tools, background jobs, or other entry points
 * 
 * Why Service-Level Authentication is Better Than Middleware Only:
 *    - Authentication is business logic ("is user authenticated?" is a business rule)
 *    - More flexible for complex scenarios (can check additional conditions)
 *    - Easier to test (no need to mock Express request/response objects)
 *    - Better separation of concerns (controllers handle HTTP, services handle business logic)
 *    - Framework-agnostic (works with Express, Fastify, or direct service calls)
 *    - Defensive programming: double-check even if middleware already validated
 * 
 * Flow:
 *    1. JWT auth middleware runs first and stores userId in request context
 *    2. Service method calls requireAuthenticated()
 *    3. Function reads userId from request context
 *    4. If authenticated: returns normally (no error)
 *    5. If not authenticated: throws UnauthorizedError (401) with descriptive message
 * 
 * Usage:
 *    - Basic usage in service:
 *      requireAuthenticated();
 *      const userId = requestContext.getUserId()!; // Guaranteed to be string after requireAuthenticated
 *      await userRepo.findById(userId);
 * 
 *    - When you only need authentication (no role check):
 *      requireAuthenticated();
 *      const userId = requestContext.getUserId()!;
 *      await userRepo.findById(userId);
 * 
 *    - Note: If you need both authentication and authorization, use requireRole() instead:
 *      requireRole(['admin']); // Checks authentication automatically
 *      await userRepo.deleteById(userId);
 * 
 * Dependencies:
 *    - requestContext utility (for reading userId)
 *    - UnauthorizedError (domain error type)
 */

import { logger } from "../../logger/logger.util";
import { requestContext } from "../../request-context";
import { UnauthorizedError } from "../../../domain/errors/error.types";

/**
 * Requires that a user is authenticated
 * 
 * This function reads the userId from request context (set by JWT auth middleware)
 * and verifies it exists. If not authenticated, throws UnauthorizedError.
 * 
 * @throws UnauthorizedError if user is not authenticated (userId not found in request context)
 * 
 * @example
 * // In service - ensures user is authenticated
 * export async function getMe(): Promise<UserProfile> {
 *   requireAuthenticated();
 *   const userId = requestContext.getUserId()!; // Guaranteed to be string
 *   return await userRepo.findById(userId);
 * }
 * 
 * @example
 * // When you only need authentication without role checks
 * export async function getMyProfile(): Promise<Profile> {
 *   requireAuthenticated();
 *   const userId = requestContext.getUserId()!;
 *   return await profileRepo.findByUserId(userId);
 * }
 */
export function requireAuthenticated(): void {
  const userId = requestContext.getUserId();
  
  // If no userId found, user is not authenticated
  if (!userId) {
    throw new UnauthorizedError(
      "Authentication required. User ID not found in request context."
    );
  }
  
  logger.debug("requireAuthenticated - user authenticated successfully", {
    userId,
  });
  // User is authenticated - function returns normally (no error)
}

