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
 *  → auth middleware                         (extracts user if from request context and writes it to the request context and to response header)
 *  → request validation middleware           (parse string request into typed request object and store the typed values on the request)
 *  → router                                  (handles the request and returns the response)
 *  → controller                              (handles the request and returns the response)
 *  → service                                 (handles the business logic)
 *  → repository                              (handles the data access - not implemented yet)
 *  → response sent                           (writes the response to the response object)
 *  → request logging middleware logs summary (logs the request summary)
 *  → error handler middleware                (logs the errors if needed)
 * 
 * Dependencies:
 *  cd in serverWorkspace/packages/app-rest-api
 *  npm install express
 *  npm install --save-dev @types/express
 */


import express from "express";
import {requestContextMiddleware} from "@mycompanyname/lib-common";
import {authMiddleware} from "@mycompanyname/lib-common";
import {requestLoggerMiddleware} from "@mycompanyname/lib-common";
import { errorMiddleware } from "@mycompanyname/lib-common";

const app = express();

app.use(requestContextMiddleware);

// Parse JSON request bodies
app.use(express.json());

// Authentication middleware - extracts user ID from x-user-id header
app.use(authMiddleware({ required: true }));

// Request logging middleware - logs request summary after response is sent
app.use(requestLoggerMiddleware);

// Health check endpoint (used by load balancers, Kubernetes, ECS, monitoring tools)
app.get("/health", (_req, res) => {
  res.status(200).json({ status: "ok" });
});

// API Routes
// Example: app.use("/api/songs", songRouter);

// Error Middleware (MUST be last - catches all errors from routes above)
app.use(errorMiddleware);

export default app;
