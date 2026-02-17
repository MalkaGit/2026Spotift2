/**
 * Schema for validating query string parameters for artist overview
 *
 * Used for:
 * - GET /artists/:id/overview
 *
 * Request Part: query string parameters
 * Model: ArtistOverviewQueryInput
 *
 * Field Validation:
 * - topTracksLimit: Optional number, coerced from string, defaults to 10,
 *   must be a positive integer and not exceed 50 (to cap payload size).
 */
import { z } from "zod";

export const ArtistOverviewQueryInputSchema = z.object({
  topTracksLimit: z.coerce.number().int().positive().max(10).default(50),
});

