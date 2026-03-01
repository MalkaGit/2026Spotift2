import { z } from "zod";

/**
 * Schema for POST /analytics/v2/tracks/:trackId/play path params.
 * trackId: track UUID (same validation as v1/v3).
 */
export const trackParamsSchema = z.object({
  trackId: z.uuid("Invalid track ID format"),
});
