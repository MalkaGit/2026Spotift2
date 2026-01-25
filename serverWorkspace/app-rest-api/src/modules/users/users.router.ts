import { Router } from 'express';
import { createRequestValidator } from "@mycompanyname/lib-common";
import { registerUserSchema } from "./types/user.register.input.schema";
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

export default userRouter;