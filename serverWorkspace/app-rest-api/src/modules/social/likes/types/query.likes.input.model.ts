/**
 * Input type for querying likes
 * 
 * Used for pagination and sorting when retrieving likes.
 * Fileds are not nullable since they get default values from the schema by validation middleware
 * Reusable across different query endpoints:
 * - GET /users/me/likes - query user's likes
 * - GET /artists/:id/likes - query likes for an artist
 * - GET /albums/:id/likes - query likes for an album
 * 
 * @param sort - Field to sort by: 'created_at' (default) or 'name'
 * @param direction - Sort direction: 'asc' or 'desc' (default: 'desc')
 * @param offset - Number of records to skip (default: 0)
 * @param limit - Maximum number of records to return (default: 20)
 * 
 * Note: Structural validation (required fields, enum values, number ranges) is handled by Zod schema.
 *       No field selection (fields, include) - returns fixed LikeItem model.
 *       
 *       Filtering: Currently not implemented. If needed in the future, filters can be added
 *       (e.g., by entityType). The simplest and most common approach is equality (=) operators.
 *       Complex operators (>, <, LIKE) and OR operators are not planned to keep the API simple.
 * 
 */
export interface QueryLikesInput {
    sort: 'created_at' | 'name';
    direction: 'asc' | 'desc';
    offset: number;
    limit: number;
  }

