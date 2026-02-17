import { z } from "zod";


/**
 * Schema for validating URL path parameters for artist endpoints.
 * Endpoints: GET /artists/:id, PATCH /artists/:id, DELETE /artists/:id, Get /artists/:id/overview
 * Request Part: params (URL path parameters)
 * Model: { id: string } (no DTO, this is domain model)
 *
 * Field Validation:
 * - id: Required string, must be valid UUID format
 */
export const artistParamsSchema = z.object({
  id: z.uuid("Invalid artist ID format"),
});
