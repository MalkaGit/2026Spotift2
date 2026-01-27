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
 * Returns the authenticated user's profile (test endpoint to verify JWT middleware).
 *
 * Flow: Request → JWT Auth Middleware (app-level) → Controller
 * Errors → errorMiddleware (UnauthorizedError if not authenticated)
 *
 * Notes:
 * - This route is PROTECTED. A valid JWT must be provided in the Authorization header.
 * - App-level jwtAuthMiddleware({ publicRoutes }) handles authentication.
 * - This route is NOT in publicRoutes, so authentication is required automatically.
 * - This is a test endpoint that returns userId and userRole from request context.
 */
userRouter.get(
  '/me',
  userController.getUserProfile
);

export default userRouter;