/**
 * Input type for querying artist overview
 *
 * Used for:
 * - GET /artists/:id/overview
 *
 * Fields are not nullable since they get default values from the schema
 * via the validation middleware.
 *
 * @param topTracksLimit - Maximum number of top tracks to return (default: 10)
 *
 * Note: Structural validation (required fields, number ranges) is handled
 * by the corresponding Zod schema.
 */
export interface ArtistOverviewQueryInput {
  topTracksLimit: number;
}

