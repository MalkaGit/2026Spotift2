/**
 * Schema for user login request validation
 *  - Endpoint: POST /users/login
 *  - Request Part: body (JSON payload)
 *  - Model: LoginUserInput
 * 
 * Field Validation:
 *  - email: Required string, must be valid email format
 *  - password: Required string (structural validation only)
 *              Password verification is handled in service layer
 * 
 * Note: This schema handles structural validation only.
 *       Authentication (password verification) is handled in the service layer.
 */

import { z } from 'zod';                           //serverWorkspace\app-rest-api>npm install zod

export const loginUserSchema = z
  .object({
    email: z.string().email(),
    password: z.string(),
  })
  .strict(); // ❗ throws on unknown field

