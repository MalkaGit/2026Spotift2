/**
 * Phase 10.8
 * File module exporting Express authentication middleware
 * 
 * Goal:
 *    Extract user ID from request header 
 *    and stores it in framework-agnostic request context
 * 
 * Architecture:
 *    - Works behind API Gateway
 *    - Framework-dependent: Express-specific middleware
 *    - Business code remains framework-agnostic (uses requestContext utility)
 *    - User ID is stored as string (simple and practical, framework-compatible)
 * 
 * Flow:
 *    1. API Gateway validates authentication token and handles authorization
 *    2. API Gateway redirects request to this microservice \ monolith app 
 *       with x-user-id header
 *    3. This middleware extracts user ID from x-user-id header 
 *       and stores the user ID in request context (accessible via requestContext.getUserId())
 *       Used for logging, service layer access, controllers
 *    4. If required=true and header missing, throws UnauthorizedError
 * 
 * Usage:
 *    - Required auth at app level (all routes): app.use(authMiddleware({ required: true }))
 *    - Optional auth at app level (all routes): app.use(authMiddleware({ required: false }))
 *    - Required auth at route level (specific routes): router.use(authMiddleware({ required: true }))
 *    - Example: optional at app level, required at song routes level
 * 
 * Dependencies:
 *    cd in serverWorkspace/packages/lib-common
 *    npm install express
 */ 

import { Request, Response, NextFunction } from 'express';
import { requestContext } from    "../../utils/request-context";
import { UnauthorizedError } from "../../domain/errors/error.types";



interface AuthMiddlewareOptions {
  /**
   * If true, throws UnauthorizedError when user ID is missing
   * If false, allows request to continue without user ID (optional auth)
   * @default false
   */
  required?: boolean;
}

/**
 * Authentication middleware
 * Extracts user ID from x-user-id header and stores it in request context (framework-agnostic)
 * 
 * @param options - Configuration options
 * @returns Express middleware function 
 */
export function authMiddleware(options: AuthMiddlewareOptions = {}) {
  return (req: Request, _res: Response, next: NextFunction) => {
    try {
      //read header value from request header
      const userIdHeader = 'x-user-id';
      const userId = req.headers[userIdHeader] || req.headers[userIdHeader.toLowerCase()];
      const userIdString = typeof userId === 'string' ? userId : undefined;
      
      //throw error if header does not exist
      if (!userIdString) {
        if (options.required) {
          throw new UnauthorizedError(
            'Authentication required. User ID not found in request header.'
          );
        }
        // auth header is missing and optional: continue without user ID
        return next();
      }
      
      // Store userId in request context (for logging, service layer, controllers)
      // Accessible via requestContext.getUserId() from any layer
      requestContext.setUserId(userIdString);
      
      next();
    } catch (err) {
      next(err);
    }
  };
}

