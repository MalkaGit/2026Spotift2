/**
 * Phase 11.2
 * File module exporting Express server
 * 
 * Goal:
 *  - Start the HTTP server and listen for incoming requests
 *  - Handle process-level crashes (uncaught exceptions and unhandled promise rejections)
 *  - Log fatal errors before application exit
 * 
 * Architecture:
 *  - Not framework-agnostic (tied to Express)
 *  - Separation of concerns: app configuration (app.ts) vs server startup (server.ts)
 *  - Process-level error handlers catch errors outside the HTTP request/response cycle
 * 
 * Flow:
 *  1. Load environment variables from .env file (MUST be first)
 *  2. Import app configuration from app.ts and logger
 *  3. Register process-level error handlers (BEFORE starting server)
 *  4. Parse PORT from environment variable (process.env.PORT is string, must parse to number)
 *  5. Start HTTP server listening on configured PORT
 *  6. Log server startup confirmation
 * 
 * Usage:
 *  - Application entry point: run this file to start the server
 *  - Equivalent to Program.cs in .NET applications
 *  - Run: npm start (or node dist/server.js after build)
 * 
 * Configuration:
 *  PORT Configuration:
 *  - Local machine: Uses PORT from .env file or environment variable, defaults to 3000
 *  - Cloud platforms (AWS ECS, Lambda, etc.): PORT is automatically set by the platform
 *    Example: AWS Lambda sets PORT=8080, ECS sets PORT based on container port mapping
 *  - process.env.PORT is always a string, must be parsed to number using parseInt()
 * 
 * Critical:
 *  - dotenv.config() MUST be called first, before any other imports that use process.env
 *  - Process-level error handlers must be registered before starting the server
 *  - Application exits with status code 1 on fatal errors (uncaught exceptions/rejections)
 * 
 * Dependencies:
 *  cd in serverWorkspace/packages/app-rest-api
 *  npm install express
 *  npm install dotenv
 *  npm install --save-dev @types/express
 */

// Load environment variables from .env file FIRST, before any other imports
// Critical: dotenv.config() must be called before any imports that use process.env
import dotenv from "dotenv";
dotenv.config();

import app from "./app";
import { logger } from "@mycompanyname/lib-common";

// Register process-level error handlers BEFORE starting server
// Handle uncaught exceptions (synchronous errors outside request/response cycle)
// Examples: syntax errors, undefined function calls, etc.
process.on("uncaughtException", (error: Error) => {
  logger.fatal("Uncaught Exception - Application will exit", {
    error: error.message,
    stack: error.stack,
    name: error.name,
  });
  process.exit(1);
});

// Handle unhandled promise rejections (async errors outside request/response cycle)
// Examples: rejected promises without .catch(), async functions without try/catch
process.on("unhandledRejection", (reason: unknown, promise: Promise<unknown>) => {
  const errorMessage = reason instanceof Error ? reason.message : String(reason);
  const errorStack = reason instanceof Error ? reason.stack : undefined;
  logger.fatal("Unhandled Rejection - Application will exit", {
    error: errorMessage,
    stack: errorStack,
    promise: promise.toString(),
  });
  process.exit(1);
});

// PORT: parse from environment variable (.env file or platform/cloud) or default to 3000
// process.env.PORT is always a string, so we need to parse it
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

// Start HTTP server and listen for incoming requests
app.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`);
});

