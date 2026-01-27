/**
 * JWT Authentication Middleware for monolith app
 * 
 * Goal:
 *    Verifies JWT tokens from Authorization header 
 *    Stores user ID and user role in framework-agnostic request context
 *    controller can then read those from request context and pass them to the service
 * Avoid over engineering: 
 *    -no need for utils\secutiry\jwt.utils.ts for now. (simple and practical implementation)
 *    later, we can do it if we need it on addtiional places (like in the service layer)
 * Architecture:
 *    - Uses jsonwebtoken library to sign and verify JWT tokens
 *    - On login:
 *      * read UserEntity (with role and hashed password) (using users module -repository layer- on monolith or http call on microservice)
 *      * verify hashed password against the password provided by the user
 *      * return error if password is incorrect
 *      * Reads JWT secret from environment variable JWT_SECRET
 *      * Calls jsonwebtoken.sign() to create a JWT token
 *      * Token payload includes: sub (user ID), email, role, iat (issued at), exp (expires), etc.
 *    - Client application stores the token in local storage or cookie
 *    - On each request, client sends token in Authorization: Bearer <token> header
 *    - This JWT auth middleware handles the request on monolith:
 *      * Reads JWT secret from environment variable JWT_SECRET
 *      * Extracts token from Authorization header
 *      * Verifies token using jsonwebtoken.verify()
 *      * Stores user ID and user role in request context
 *    - Framework-dependent: Express-specific middleware implementation
 *    - Business code remains framework-agnostic (uses requestContext utility)
 *    - Reads JWT_SECRET from environment variable (process.env.JWT_SECRET)
 *    - User ID and role are stored as strings (simple and practical, framework-compatible)
 * 

 * Flow:
 *    This middleware runs on EVERY request at app level (registered via app.use()).
 *    It receives a list of public routes that don't require authentication.
 *    
 *    1. Check if current route matches any route in publicRoutes list
 *       - If match found: Skip JWT processing entirely, continue to next middleware
 *       - If no match: Continue to step 2 (authentication required)
 *    2. Check if user is already authenticated (prevents double execution if middleware runs multiple times)
 *       - If already authenticated: Skip verification, continue to next middleware
 *    3. Extract Bearer token from Authorization header
 *    4. Verify token using JWT_SECRET from environment
 *    5. Extract user ID from token payload.sub (standard JWT claim)
 *    6. Extract user role from token payload.role (custom JWT claim)
 *    7. As monoloth: 
 *       Store user ID and user role in request context (accessible via requestContext.getUserId() and requestContext.getUserRole())
 *       As api GW on microservices:
 *       write the x-user-id and x-role headers in the request sent to the next microservice
 *    8. If route is NOT in publicRoutes and token invalid/missing, throws UnauthorizedError (secure by default)
 * 
 * Usage:
 *    - Optional by default at app level: app.use(jwtAuthMiddleware({ publicRoutes }))
 * 
 * Dependencies:
 *    cd in serverWorkspace/lib-common
 *    npm install jsonwebtoken (provides sign and verify methods for JWT tokens)
 *    npm install --save-dev @types/jsonwebtoken
 * 
 * Environment Variables:
 *    JWT_SECRET - Secret key for signing/verifying JWT tokens (minimum 32 characters, required)
 *    JWT_ISSUER - Optional: Token issuer to verify (must match token's 'iss' claim)
 *    JWT_AUDIENCE - Optional: Token audience to verify (must match token's 'aud' claim)
 *
 * As we move form monolith to microservices, we need to consider the following:
 *   authentication- monolith Vs microservices (is password correct, what is user id and role) 
 *            on microservices, all requests reach api-gateway 
 *            request with authorization headers reach the api gateway 
 *            on API agateway,  the jwt middleware of the api gateway does the same logic of this middleware 
 *                              and request sent to the relevant microservice with the x-user-id and x-role headers in the response
 *            when request reaches the microservice,
 *                              the jwt middleware of the microservice just reads x-user and x-role from the request headres 
 *                              and stores then on the context
 *            in both cases (monolith and microservices),
 *            the controller can read the user id and the role from the context
 * 
 *      Note: authorization monolith Vs microservices (does the role of the user allow running the requested action)
 *            on monolith, authorization is handled by the monolith app (beackend api)
 *               in controller or the service layer
 *               it does not really matter where the authorization is handled, because the request context is the same
 *            on microservices, 
 *              authorization can be handled by the microservice that gets the role
 *              but many implement the authorization on the api gateway
 *              (to save the cost of call to the microservice) 
*/
import { verify, TokenExpiredError, JsonWebTokenError } from 'jsonwebtoken';
import { requestContext } from "../../utils/request-context";
import { UnauthorizedError } from "../../domain/errors/error.types";
import { logger } from "../../utils/logger";
import { Request, Response, NextFunction } from 'express';

export interface PublicRoute {
  method: string;
  path: string;
}

export interface JwtAuthMiddlewareOptions {
  /**
   * List of public routes that should skip JWT authentication entirely
   * If the current request matches a public route, JWT processing is skipped immediately
   * Routes NOT in this list will require authentication (secure by default)
   * This avoids unnecessary token validation for routes that don't need it
   */
  publicRoutes?: PublicRoute[];
}

interface JwtPayload {
  sub: string;        // Subject (user ID) - standard JWT claim
  email?: string;     // User email (optional)
  role?: string;      // User role (optional)
  iat?: number;       // Issued at
  exp?: number;        // Expiration
  iss?: string;        // Issuer
  aud?: string;        // Audience
}

/**
 * JWT Authentication Middleware
 * Verifies JWT tokens from Authorization: Bearer <token> header
 * 
 * @param options - Configuration options
 * @returns Express middleware function 
 */
export function jwtAuthMiddleware
(options: JwtAuthMiddlewareOptions = {}) {
  return (req: Request, _res: Response, next: NextFunction) => {
    try {
      
      // Check if current route is in public routes list - skip JWT processing immediately if so
      // eg, for user\register , user\login, health, etc. 
      // This is checked FIRST to avoid any unnecessary JWT processing for public routes
      // Public routes are defined at app level and passed to middleware
      if (options.publicRoutes) {
        const isPublicRoute = options.publicRoutes.some(
          route => route.method.toUpperCase() === req.method.toUpperCase() && 
                   (req.path === route.path || req.path.startsWith(route.path + '/'))
        );
        if (isPublicRoute) {
          // This is a public route - skip JWT authentication entirely
          // No token validation, no context population - just continue
          return next();
        }
      }
      
      
      // Get JWT secret (used on sign and verify methods)
      // TODO: P2 - we can do the validation on application startup
      const JWT_SECRET = process.env.JWT_SECRET;      
      if (!JWT_SECRET || JWT_SECRET.length < 32) {
        throw new Error(
          "JWT_SECRET is not configured or is too short. " +
          "Please set JWT_SECRET in .env file (minimum 32 characters)."
        );
      }

      // Extract Bearer token from Authorization header
      // If we reach here, the route is NOT in publicRoutes, so authentication is required
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        // Route is not public and no token provided - authentication required
        throw new UnauthorizedError(
          'Authentication required. Bearer token not found in Authorization header.'
        );
      }

      const token = authHeader.substring(7); // Remove 'Bearer ' prefix

      // Verify and decode JWT token
      let decoded: JwtPayload;
      try {
        decoded = verify(token, JWT_SECRET, {
          issuer: process.env.JWT_ISSUER,      // Optional: verify issuer
          audience: process.env.JWT_AUDIENCE,  // Optional: verify audience
        }) as JwtPayload;
      } catch (err) {
        if (err instanceof TokenExpiredError) {
          throw new UnauthorizedError('Token has expired');
        }
        if (err instanceof JsonWebTokenError) {
          throw new UnauthorizedError('Invalid token');
        }
        throw err;
      }

      // Extract user ID from token payload.sub (standard JWT claim)
      const userId = decoded.sub;
      if (!userId) {
        throw new UnauthorizedError('Token payload missing required "sub" claim');
      }
    
      // Store userId in request context (for logging, service layer, controllers)
      // Accessible via requestContext.getUserId() from any layer
      requestContext.setUserId(userId);

      // Extract user Role from token payload.role (standard JWT claim)
      const userRole = decoded.role;
      if (!userRole) {
        throw new UnauthorizedError('Token payload missing required "role" claim');
      }

      // Store user Role in request context (for logging, service layer, controllers)
      // Accessible via requestContext.getUserRole() from any layer
      requestContext.setUserRole(userRole);

      // Debug: Read user ID and role from context to verify they were stored correctly
      logger.debug("JWT auth - User authenticated and stored in context");
      
      next();
    } catch (err) {
      next(err);
    }
  };
}

