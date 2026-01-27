/**
 * Output type for user profile
 *  - Used by: Service layer, Controller layer
 *  - Endpoint: GET /users/me
 *  - Response: JSON payload
 * 
 * Note: 
 * - for simplicity, the model is also the DTO
 * - Excludes sensitive fields like passwordHash and id for security.
 * - The createdAt field is returned as an ISO 8601 string (not a Date object).
 */

export interface UserProfile {
    email: string;
    role: string; // User's role (e.g., 'listener', 'artist', 'admin')
    createdAt: string; // Account creation timestamp in ISO 8601 format (e.g., "2024-01-01T00:00:00.000Z")
  }