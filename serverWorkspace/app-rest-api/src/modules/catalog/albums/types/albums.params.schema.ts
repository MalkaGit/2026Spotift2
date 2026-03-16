import { z } from "zod";

/**
 * Schema for POST /albums/:albumId/release/v1 path params.
 * Schema for POST /albums/:albumId/release/v2 path params
 * albumId: album UUID (same validation pattern as tracks).
 */
export const albumParamsSchema = z.object({
  albumId: z.uuid("Invalid album ID format"),
});
