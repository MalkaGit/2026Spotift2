import { Request, Response, NextFunction } from "express";
import { TypedRequest, requestContext, UnauthorizedError, logger } from "@mycompanyname/lib-common";
import { LoginUserInput, LoginUserOutput } from "./types";
import { RegisterUserInput, RegisterUserOutput } from "./types";
import { UserProfile } from "./types";

import * as userService from "./users.service";

/**
 * POST /users/register
 * Creates a new user.
 * 
 * Notes:
 * - Assumes request validation middleware has already parsed & typed req.body as RegisterUserInput.
 * - Errors → errorMiddleware (BadRequestError, ConflictError)
 */
export async function registerUser(
  req: TypedRequest<RegisterUserInput>,
  res: Response,
  next: NextFunction
) {
  try {
    const input: RegisterUserInput = req.body; // No 'as' needed - req.body is already typed as RegisterUserInput
    const output = await userService.register(input);
    res.status(201).json(output);
  } catch (err) {
    next(err);
  }
}

/**
 * POST /users/login
 * Authenticates a user and returns an access token.
 * 
 * Notes:
 * - Assumes request validation middleware has already parsed & typed req.body as LoginUserInput.
 * - Errors → errorMiddleware (UnauthorizedError for invalid credentials)
 */
export async function loginUser(
  req: TypedRequest<LoginUserInput>,
  res: Response,
  next: NextFunction
) {
  try {
    const input: LoginUserInput = req.body; // No 'as' needed - req.body is already typed as LoginUserInput
    const output: LoginUserOutput = await userService.login(input);
    res.status(200).json(output);
  } catch (err) {
    next(err);
  }
}

/**
 * GET /users/me
 * Returns the authenticated user's profile (test endpoint to verify JWT middleware).
 * 
 * Notes:
 * - This endpoint is PROTECTED. A valid JWT must be provided in the Authorization header.
 * - JWT middleware (app-level with publicRoutes) enforces authentication.
 * - This is a test endpoint that returns userId and userRole from request context.
 * - Errors → errorMiddleware (UnauthorizedError if not authenticated)
 */
export async function getUserProfile(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    // Get userId and role from request context (set by JWT auth middleware)
    const userId = requestContext.getUserId();
    const userRole = requestContext.getUserRole();
    
    // Log to verify JWT middleware populated context correctly
    logger.info("getUserProfile - JWT context verified", {
      userId,
      userRole,
    }); 
    
    // Return response with context data for testing
    res.status(200).json({
      userId,
      userRole,
    });
  } catch (err) {
    next(err);
  }
}
