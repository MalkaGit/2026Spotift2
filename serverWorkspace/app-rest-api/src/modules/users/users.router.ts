import { Router } from 'express';
import { createRequestValidator } from "@mycompanyname/lib-common";
import { registerUserSchema, loginUserSchema } from "./types";
import * as userController from "./users.controller";

const userRouter = Router();

/**
 * POST /users/register
 * Creates a new user account.
 * 
 * Flow: Request → Validation Middleware → Controller → Service → Repository
 * Errors → errorMiddleware (BadRequestError, ConflictError)
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
 */
userRouter.post(
  '/login',
  createRequestValidator({ body: loginUserSchema }),
  userController.loginUser
);

export default userRouter;