import { Router } from 'express';
import { createRequestValidator, jwtAuthMiddleware } from "@mycompanyname/lib-common";
import { registerUserSchema, loginUserSchema } from "./types";
import * as userController from "./users.controller";

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

export default userRouter;