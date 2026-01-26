/**
 * Input type for user login
 *  - Used by: Service layer, Repository layer
 *  - Endpoint: POST /users/login
 *  - Request Part: body (JSON payload)
 * 
 * Note: This is a domain model, not a DTO.
 *       Structural validation is handled by Zod schema (user.login.input.schema.ts)
 */

export interface LoginUserInput {
    email: string;
    password: string;
  }