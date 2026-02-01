import { Router } from 'express';
import { createRequestValidator, jwtAuthMiddleware } from "@mycompanyname/lib-common";

import * as userController from "./users.controller";
import { registerUserSchema, loginUserSchema } from "./types";

import * as likesController from "../likes/likes.controller";
import { AddLikeInputSchema, QueryLikesInputSchema } from "../likes/types";

const userRouter = Router();

/**
 * POST /users/register
 * Creates a new user account.
 *
 * Flow: Request → Validation Middleware → Controller → Service → Repository
 * Errors → errorMiddleware (BadRequestError, ConflictError)
 *
 * Notes:
 * - This route is PUBLIC (no authentication required).
 * - Defined in app.ts publicRoutes array, so JWT middleware skips it entirely.
 */
userRouter.post(
  '/register',
  createRequestValidator({ body: registerUserSchema }),
  userController.registerUser
);

/**
 * POST /users/login
 * Authenticates a user and returns an access token.
 *
 * Flow: Request → Validation Middleware → Controller → Service → Repository
 * Errors → errorMiddleware (UnauthorizedError for invalid credentials)
 *
 * Notes:
 * - This route is PUBLIC (no authentication required).
 * - Defined in app.ts publicRoutes array, so JWT middleware skips it entirely.
 */
userRouter.post(
  '/login',
  createRequestValidator({ body: loginUserSchema }),
  userController.loginUser
);

/**
 * GET /users/me
 * Returns the authenticated user's profile.
 *
 * Flow: Request → JWT Auth Middleware (app-level) → Controller → Service → Repository
 * Errors → errorMiddleware (UnauthorizedError if not authenticated, NotFoundError if user doesn't exist)
 *
 * Notes:
 * - This route is PROTECTED. A valid JWT must be provided in the Authorization header.
 * - App-level jwtAuthMiddleware({ publicRoutes }) handles authentication.
 * - This route is NOT in publicRoutes, so authentication is required automatically.
 * - Returns user profile (email, role, createdAt) - excludes sensitive fields like passwordHash.
 */
userRouter.get(
  '/me',
  userController.getMe
);

/**
 * POST /users/me/likes
 * Adds a like for the current user.
 *
 * Flow: Request → Validation Middleware → JWT Auth Middleware (app-level) → Controller → Service → Repository
 * Errors → errorMiddleware (UnauthorizedError if not authenticated, ConflictError if already liked)
 *
 * Notes:
 * - This route is PROTECTED. A valid JWT must be provided in the Authorization header.
 * - App-level jwtAuthMiddleware({ publicRoutes }) handles authentication.
 * - This route is NOT in publicRoutes, so authentication is required automatically.
 * - Only users with "listener" role can add likes (enforced in service layer).
 * - This route calls the likes controller (cross-domain routing).
 */
userRouter.post(
  '/me/likes',
  createRequestValidator({ body: AddLikeInputSchema }),
  likesController.addLike
);

/**
 * GET /users/me/likes
 * Returns the authenticated user's likes with pagination and sorting, without orphaned likes 
 *
 * Flow: Request → Validation Middleware → JWT Auth Middleware (app-level) → Controller → Service → Repository
 * Errors → errorMiddleware (UnauthorizedError if not authenticated)
 *
 * Notes:
 * - This route is PROTECTED. A valid JWT must be provided in the Authorization header.
 * - App-level jwtAuthMiddleware({ publicRoutes }) handles authentication.
 * - This route is NOT in publicRoutes, so authentication is required automatically.
 * - Supports query parameters: offset, limit, sort, direction (validated by QueryLikesInputSchema).
 * - This route calls the likes controller (cross-domain routing).
 */
userRouter.get(
  '/me/likes',
  createRequestValidator({ query: QueryLikesInputSchema }),
  likesController.queryMyLikes
);

export default userRouter;