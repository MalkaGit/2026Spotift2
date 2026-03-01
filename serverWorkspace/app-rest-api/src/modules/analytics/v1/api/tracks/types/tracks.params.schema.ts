import { z } from "zod";

/**
 * Schema for POST /analytics/v1/tracks/:trackId/play path params.
 */
export const trackParamsSchema = z.object({
  trackId: z.uuid("Invalid track ID format"),
});
