/**
 * Output type for user login
 *  - Used by: Service layer, Controller layer
 *  - Endpoint: POST /users/login
 *  - Response: JSON payload
 * 
 * Note: This is a domain model, not a DTO.
 */

export interface LoginUserOutput {
    accessToken: string;
    expiresIn: number; // seconds
  }