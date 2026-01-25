import { Response, NextFunction } from "express";
import { TypedRequest } from "@mycompanyname/lib-common";
import { RegisterUserInput } from "./types";
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
