import { Response, NextFunction } from "express";
import { TypedRequest } from "@mycompanyname/lib-common";
import { LoginUserInput, LoginUserOutput } from "./types";
import { RegisterUserInput, RegisterUserOutput } from "./types";

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