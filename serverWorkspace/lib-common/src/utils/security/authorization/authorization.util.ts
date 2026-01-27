/**
 * Authorization Utility 
 * for validating authorization in service layer
 * 
 * Goal:
 *    Enforces role-based access control (RBAC) at the service layer
 *    Checks if the authenticated user's role is authorized for a specific operation
 *    Throws ForbiddenError (403) if user is not authorized
 * 
 * Architecture:
 *    - Framework-agnostic: works in any layer (controllers, services, repositories)
 *    - Uses request context to read user role (set by JWT auth middleware)
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
 *    1. JWT auth middleware runs first and stores user role in request context
 *    2. Service method calls requireRole(['role1', 'role2'])
 *    3. Function reads user role from request context (or uses provided role parameter)
 *    4. Checks if user role is in the allowed roles list
 *    5. If authorized: returns normally (no error)
 *    6. If not authorized: throws ForbiddenError (403) with descriptive message
 * 
 * Usage:
 *    - Basic usage (single role):
 *      requireRole(['admin']);
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
 *        requireRole(['admin']); // Only admin can delete others' songs
 *      }
 *      // Owner can always delete their own songs (no check needed)
 * 
 *    - In controller (authorization handled in service):
 *      await userService.deleteUser(userId); // Service handles authorization
 * 
 * Dependencies:
 *    - requestContext utility (for reading user role)
 *    - ForbiddenError (domain error type)
 * 
 * As we move to microservices
 *    - om microservices, 
 *      the api gategay should also handle authorization befre callnig the microserice 
 *      to save (costy) api call
 *      api gateway can handle authorization in middleware\controller\service
 */

import {logger} from "../../logger/logger.util";
import { requestContext } from "../../request-context";
import { ForbiddenError } from "../../../domain/errors/error.types";

/**
 * Checks if a user role is authorized for an operation
 * 
 * This function reads the user role from request context (set by JWT auth middleware)
 * and verifies it's in the allowed roles list. If not authorized, throws ForbiddenError.
 * 
 * @param allowedRoles - Array of roles that are allowed to perform this operation
 * @param userRole - Optional user role. If not provided, reads from request context
 * @throws ForbiddenError if user role is not in the allowed roles list
 * 
 * @example
 * // In service - reads role from context
 * export async function deleteUser(userId: string) {
 *   requireRole(['admin']);
 *   await userRepo.deleteById(userId);
 * }
 * 
 * @example
 * // Multiple roles allowed
 * export async function createSong(input: CreateSongInput) {
 *   requireRole(['artist', 'admin']);
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
 *     requireRole(['admin']); // Only admin can delete others' songs
 *   }
 *   await songRepo.deleteById(songId);
 * }
 */
export function requireRole(allowedRoles: string[], userRole?: string): void {
  // If userRole not provided, read from request context
  const role = userRole ?? requestContext.getUserRole();
  
  // If no role found, user is not authenticated
  if (!role) {
    throw new ForbiddenError(
      'User role not found. Authentication required before authorization check.'
    );
  }
  
  // Check if user role is in the allowed roles list
  if (!allowedRoles.includes(role)) {
    throw new ForbiddenError(
      `Access denied. Required role: ${allowedRoles.join(' or ')}. Current role: ${role}.`
    );
  }
  
  logger.debug("requireRole - request authorized successfully", {
    allowedRoles,
    role,
  }); 
  // User is authorized - function returns normally (no error)
}

