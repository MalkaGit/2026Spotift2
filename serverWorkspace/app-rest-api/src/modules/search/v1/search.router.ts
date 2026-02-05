import { createRequestValidator } from "@mycompanyname/lib-common";

import * as searchController from "./search.controller";
import { SearchQueryInputSchema } from "./types";

import { Router } from 'express';

const router = Router();

/**
 * GET /search/v1/artists
 * Returns artists matching the search query with pagination and enrichment (liked status).
 *
 * Flow: Request → Validation Middleware → JWT Auth Middleware (app-level) → Controller → Service → Repository
 * Errors → errorMiddleware (UnauthorizedError if not authenticated, ForbiddenError if not authorized)
 *
 * Notes:
 * - This route is PROTECTED. A valid JWT must be provided in the Authorization header.
 * - App-level jwtAuthMiddleware({ publicRoutes }) handles authentication.
 * - This route is NOT in publicRoutes, so authentication is required automatically.
 * - Only users with "listener" role can search artists (enforced in service layer).
 * - Supports query parameters: q (search term), offset, limit (validated by SearchQueryInputSchema).
 */
router.get(
  '/artists',
  createRequestValidator({ query: SearchQueryInputSchema }),
  searchController.searchArtists
);

export default router;

