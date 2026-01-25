/**
 * Schema for user registration request validation
 *  - Endpoint: POST /users/register
 *  - Request Part: body (JSON payload)
 *  - Model: RegisterUserInput
 * 
 * Field Validation:
 *  - email: Required string, must be valid email format
 *  - password: Required string, minimum length 8 characters (structural validation)
 *              Password complexity/strength validation is handled in service layer
 * 
 * Note: This schema handles structural validation only.
 *       Business rules (password complexity) are validated in the service layer.
 */

import { z } from 'zod';                           //serverWorkspace\app-rest-api>npm install zod

export const registerUserSchema = z
  .object({
    email: z.string().email(),
    password: z.string().min(8, "Password must be at least 8 characters long"),
  })
  .strict(); // ❗ throws on unknown field

