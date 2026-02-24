import { z } from "zod";

/**
 * Schema for POST /analytics/v2/track/:trackId/play path params.
 * - id: track UUID
 */
export const trackParamsSchema = z.object({
  trackId: z.uuid("Invalid track ID format"),
});
