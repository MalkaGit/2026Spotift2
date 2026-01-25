/**
 * Input type for user registration
 *  - Used by: Service layer, Repository layer
 *  - Endpoint: POST /users/register
 *  - Request Part: body (JSON payload)
 * 
 * Note: This is a domain model, not a DTO.
 *       Structural validation is handled by Zod schema (user.register.input.schema.ts)
 */

export interface RegisterUserInput {
    email: string;
    password: string;
    // role defaults to 'listener', can be upgraded later on
  }
  
  