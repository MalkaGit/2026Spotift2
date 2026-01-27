import { Request, Response, NextFunction } from "express";
import { TypedRequest, requestContext, UnauthorizedError } from "@mycompanyname/lib-common";
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
 * Returns the authenticated user's profile.
 * 
 * Notes:
 * - This endpoint is PROTECTED. A valid JWT must be provided in the Authorization header.
 * - Errors → errorMiddleware (UnauthorizedError if not authenticated, NotFoundError if user doesn't exist)
 */
export async function getUserProfile(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    // Get userId from request context (set by JWT auth middleware)
    // Defensive check: JWT middleware should have set userId, but we validate to prevent runtime errors
    const userId = requestContext.getUserId();
    if (!userId) {
      // This should not happen if JWT middleware is properly configured
      // But we handle it defensively to provide a clear error message
      throw new UnauthorizedError(
        "Authentication required. User ID not found in request context."
      );
    }
    
    // Call service to get user profile
    const profile: UserProfile = await userService.getUserProfile(userId);
    
    res.status(200).json(profile);
  } catch (err) {
    next(err);
  }
}