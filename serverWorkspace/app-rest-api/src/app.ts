/**
 * Phase 11.1
 * File module exporting Express application setup
 * 
 * Goal:
 *  - Initialize Express app with global middlewares (JSON parsing, CORS, logging)
 *  - Register health check endpoint (used by load balancers, Kubernetes, ECS, monitoring tools)
 *  - Configure API routes
 *  - Set up error handling middleware (MUST be last)
 * 
 * Architecture:
 *  - Not framework-agnostic (tied to Express)
 *  - Separation of concerns: app configuration vs server startup (see server.ts)
 *  - Middleware order is critical for proper request processing
 * 
 * Flow:
 *  → request-context middleware              (correlation id is required for logging. it extract correletion id from request header , if exist. writes it to new request context and to response header)
 *  → JWT auth middleware getting list of public endpoints that donot require authentication 
 *  → request validation middleware           (parse string request into typed request object and store the typed values on the request)
 *  → router                                  (handles the request and returns the response)
 *  → controller                              (handles the request and returns the response)
 *  → service                                 (handles the business logic)
 *  → repository                              (handles the data access - not implemented yet)
 *  → response sent                           (writes the response to the response object)
 *  → request logging middleware logs summary (logs the request summary - can read userId from context set by JWT middleware above)
 *  → error handler middleware                (logs the errors if needed)
 * 
 * Dependencies:
 *  cd in serverWorkspace/packages/app-rest-api
 *  npm install express
 *  npm install --save-dev @types/express
 */


import express from "express";
import cors from "cors";
import { requestContextMiddleware } from "@mycompanyname/lib-common";
import { jwtAuthMiddleware } from "@mycompanyname/lib-common";
import { requestLoggerMiddleware } from "@mycompanyname/lib-common";
import { errorMiddleware } from "@mycompanyname/lib-common";
import { usersRouter } from "./modules/users";
import { albumsRouter } from "./modules/catalog/albums";
import { artistsRouter } from "./modules/catalog/artists";
import { tracksAnalyticsRouter as tracksAnalyticsV1Router } from "./modules/analytics/v1/api/tracks";
import { tracksAnalyticsRouter as tracksAnalyticsV2Router } from "./modules/analytics/v2/api/tracks";
import { tracksAnalyticsRouter as tracksAnalyticsV3Router } from "./modules/analytics/v3/api/tracks";
import { searchRouter as searchV1Router } from "./modules/search/v1";
import { searchRouter as searchV2Router } from "./modules/search/v2";
import { releaseFeedsRouter as releaseFeedsV1Router } from "./modules/feeds/v1/releases";
import { releaseFeedsRouter as releaseFeedsV2Router } from "./modules/feeds/v2/releases";
import { releaseFeedsRouter as releaseFeedsV3Router } from "./modules/feeds/v3/releases";
import { releaseFeedsRouter as releaseFeedsRouterV4a } from "./modules/feeds/v4a/releases";

const app = express();

app.use(requestContextMiddleware);

// CORS: allow frontend (e.g. http://localhost:5173) to call this API
app.use(cors({ origin: true, credentials: true }));

// Parse JSON request bodies
app.use(express.json());

// Define public routes that don't require authentication
// These routes will skip JWT verification entirely (even if token is present)
// This list is checked at the beginning of JWT middleware to avoid unnecessary processing
const publicRoutes = [
  { method: 'GET', path: '/health' },
  { method: 'POST', path: '/users/register' },
  { method: 'POST', path: '/users/login' },
];

// JWT Authentication middleware - required by default (secure by default)
// Verifies JWT token from Authorization: Bearer <token> header
// Extracts userId and role from token and stores in request context
// This keeps the app simple & explicit: public routes stay public by default,
// protected routes clearly declare that a valid JWT is required.
app.use(jwtAuthMiddleware({ publicRoutes }));

// Request logging middleware - logs request summary after response is sent
// IMPORTANT: This runs AFTER JWT middleware above, so it can read userId from request context
// The middleware listens to response 'finish' event, so it has access to context set by JWT middleware
app.use(requestLoggerMiddleware);

// Health check endpoint (used by load balancers, Kubernetes, ECS, monitoring tools)
// This is a public endpoint (no authentication required).
// Defined in publicRoutes array above, so JWT middleware skips it entirely.
app.get("/health", (_req, res) => {
  res.status(200).json({ status: "ok" });
});

// API Routes
app.use("/users", usersRouter);
app.use("/artists", artistsRouter);
app.use("/albums", albumsRouter);
app.use("/search/v1", searchV1Router);  //v1: read from domain tables (albums + album_artists) using sql like query
app.use("/search/v2", searchV2Router);  //v2: read from domain tables (albums + album_artists) using fulltext search
app.use("/me/feeds/v1/releases", releaseFeedsV1Router); // v1: read from domain tables (albums + album_artists)
app.use("/me/feeds/v2/releases", releaseFeedsV2Router); // v2: read from activity_events + activity_event_actors
app.use("/me/feeds/v3/releases", releaseFeedsV3Router); // v3: read from feed_events + feed_event_actors
app.use("/me/feeds/v4a/releases", releaseFeedsRouterV4a); // v4a: read from feed_events + feed_event_actors populated by v4a workers
app.use("/analytics/v1/tracks", tracksAnalyticsV1Router);
app.use("/analytics/v2/tracks", tracksAnalyticsV2Router);
app.use("/analytics/v3/tracks", tracksAnalyticsV3Router);

// Error Middleware (MUST be last - catches all errors from routes above)
app.use(errorMiddleware);

export default app;
