/**
 * Authorization Utility 
 * for validating authorization in service layer
 * 
 * Goal:
 *    Enforces role-based access control (RBAC) at the service layer
 *    Checks authentication first (userId must exist), then checks if the authenticated user's role is authorized
 *    Throws UnauthorizedError (401) if user is not authenticated
 *    Throws ForbiddenError (403) if user is authenticated but not authorized
 * 
 * Architecture:
 *    - Framework-agnostic: works in any layer (controllers, services, repositories)
 *    - Uses request context to read user id and user role (set by JWT auth middleware)
 *    - Business logic: authorization rules belong in the service layer, not the API layer
 *    - No dependencies on Express or any framework
 *    - Can be reused in CLI tools, background jobs, or other entry points
 * 
 * Why Service-Level Authorization is Better Than Middleware:
 *    - Authorization is business logic ("who can do what" is a business rule)
 *    - More flexible for complex rules (can access business context, check ownership, etc.)
 *    - Easier to test (no need to mock Express request/response objects)
 *    - Better separation of concerns (controllers handle HTTP, services handle business logic)
 *    - Framework-agnostic (works with Express, Fastify, or direct service calls)
 * 
 * Flow:
 *    1. JWT auth middleware runs first and stores userId and user role in request context
 *    2. Service method calls requireRole(['role1', 'role2'])
 *    3. Function checks authentication first (userId must exist) - throws UnauthorizedError (401) if not authenticated
 *    4. Function reads user role from request context (or uses provided role parameter)
 *    5. If no role found: throws UnauthorizedError (401) - authentication issue
 *    6. Checks if user role is in the allowed roles list
 *    7. If authorized: returns normally (no error)
 *    8. If not authorized: throws ForbiddenError (403) with descriptive message
 * 
 * Usage:
 *    - Basic usage (single role) - authentication is checked automatically:
 *      requireRole(['admin']);
 *      const userId = requestContext.getUserId()!; // Guaranteed to be string after requireRole
 *      await userRepo.deleteById(userId);
 * 
 *    - Multiple roles allowed:
 *      requireRole(['artist', 'admin']);
 *      await songRepo.create(song);
 * 
 *    - Complex business rules with ownership check:
 *      const song = await songRepo.findById(songId);
 *      const currentUserId = requestContext.getUserId();
 *      if (song.artistId !== currentUserId) {
 *        requireRole(['admin']); // Only admin can delete others' songs (auth checked automatically)
 *      }
 *      // Owner can always delete their own songs (no check needed)
 * 
 *    - In controller (authorization handled in service):
 *      await userService.deleteUser(userId); // Service handles authentication and authorization
 * 
 * Dependencies:
 *    - requestContext utility (for reading userId and user role)
 *    - UnauthorizedError (domain error type) - for authentication failures
 *    - ForbiddenError (domain error type) - for authorization failures
 * 
 * As we move to microservices
 *    - om microservices, 
 *      the api gategay should also handle authorization befre callnig the microserice 
 *      to save (costy) api call
 *      api gateway can handle authorization in middleware\controller\service
 */

import {logger} from "../../logger/logger.util";
import { requestContext } from "../../request-context";
import { UnauthorizedError, ForbiddenError } from "../../../domain/errors/error.types";

/**
 * Checks if a user is authenticated and authorized for an operation
 * 
 * This function first checks authentication (userId must exist), then checks authorization
 * (user role must be in the allowed roles list). Authorization implies authentication.
 * 
 * @param allowedRoles - Array of roles that are allowed to perform this operation
 * @throws UnauthorizedError (401) if user is not authenticated (no userId or no role)
 * @throws ForbiddenError (403) if user is authenticated but not authorized (wrong role)
 * 
 * @example
 * // In service - authentication and authorization checked automatically
 * export async function deleteUser(userId: string) {
 *   requireRole(['admin']);
 *   const currentUserId = requestContext.getUserId()!; // Guaranteed to be string after requireRole
 *   await userRepo.deleteById(userId);
 * }
 * 
 * @example
 * // Multiple roles allowed
 * export async function createSong(input: CreateSongInput) {
 *   requireRole(['artist', 'admin']); // Auth checked automatically
 *   await songRepo.create(song);
 * }
 * 
 * @example
 * // Complex business rule with ownership check
 * export async function deleteSong(songId: string) {
 *   const song = await songRepo.findById(songId);
 *   const currentUserId = requestContext.getUserId();
 *   
 *   if (song.artistId !== currentUserId) {
 *     requireRole(['admin']); // Only admin can delete others' songs (auth checked automatically)
 *   }
 *   await songRepo.deleteById(songId);
 * }
 */
export function requireRole(allowedRoles: string[]): void {
  // Step 1: Check authentication - userId must exist
  const userId = requestContext.getUserId();
  if (!userId) {
    throw new UnauthorizedError(
      "Authentication required. User ID not found in request context."
    );
  }
  
  // Step 2: Get user role from request context (always use the authenticated user's role)
  const role = requestContext.getUserRole();
  
  // Step 3: If no role found, treat as authentication failure (role should exist if userId exists)
  if (!role) {
    throw new UnauthorizedError(
      "Authentication required. User role not found in request context."
    );
  }
 
  // Step 4: Check authorization - role must be in allowed roles list
  if (!allowedRoles.includes(role)) {
    throw new ForbiddenError(
      `Access denied. Required role: ${allowedRoles.join(' or ')}. Current role: ${role}.`
    );
  }
  
  logger.debug("requireRole - request authenticated and authorized successfully", {
    userId,
    allowedRoles,
    role,
  }); 
  // User is authenticated and authorized - function returns normally (no error)
}

