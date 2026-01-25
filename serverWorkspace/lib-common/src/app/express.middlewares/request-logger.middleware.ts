/**
 * Phase 10.9
 * File module exporting Express middleware for request logging
 * 
 * Goal:
 *    After response is sent with status code < 500,*  
 *    log one line for the request 
 *    - If request takes more than 500ms, log as warning; 
 *    - otherwise, log as info
 
 * Note: 
 *    - if status code >= 500, 
 *      error handler middleware should log it (not this middleware)
 * 
 * Architecture:
 *    - Runs automatically for every request
 *    - No need to log manually in controllers
 *    - Framework-dependent: Express-specific middleware
 *    - Library-agnostic: uses logger wrapper API (not tied to pino, winston, etc.)
 *    - Reads correlationId and userId from framework-agnostic request context
 * 
 * Flow:
 *    1. Request context middleware writes correlationId to request context
 *    2. Auth middleware writes userId to request context
 *    3. This middleware records start time when request arrives
 *    4. Listens to response 'finish' event (when response is fully sent)
 *    5. Calculates duration and reads correlationId, userId from request context
 *    6. Skips logging if status code >= 500 (error handler middleware logs these)
 *    7. Logs warning if duration >= threshold (default 500ms), otherwise logs info
 * 
 * Usage:
 *    - Apply as middleware: app.use(requestLoggerMiddleware)
 * 
 * Dependencies:
 *    cd in serverWorkspace/packages/lib-common
 *    npm install express
 *    npm install dotenv
 *  
 * Configuration:
 *    - SLOW_REQUEST_THRESHOLD_MS: threshold for slow request warning (default: 500ms)
 *    - Read from environment variable: process.env.SLOW_REQUEST_THRESHOLD_MS
 * What to Log:
 *    - method (GET, POST, etc.)
 *    - url (complete URL including query parameters)
 *    - statusCode (HTTP status code)
 *    - durationMs (request processing time in milliseconds)
 *    - correlationId (from request context, for log aggregation)
 *    - userId (from request context, if exists)
 * 
 * What NOT to Log:
 *    - headers (may contain secrets)
 *    - query params (unless specifically needed)
 *    - request body (by default, for security) 
*/


// Load environment variables if not already loaded (defensive: ensures .env is available)
// Note: dotenv.config() is idempotent - safe to call multiple times
import dotenv from 'dotenv';
dotenv.config();

import { Request, Response, NextFunction } from 'express';
import { requestContext } from    "../../utils/request-context";
import { logger } from "../../utils/logger";

const SLOW_REQUEST_THRESHOLD_MS = Number(process.env.SLOW_REQUEST_THRESHOLD_MS) || 500;

export function requestLoggerMiddleware (req: Request, res: Response, next: NextFunction) {
  const startTime = Date.now();

  // Log when response is fully sent
  res.on('finish', () => {
    const durationMs = Date.now() - startTime;
    const fullUrl = req.originalUrl || req.url || req.path;
    
    const logData = {
      method: req.method,
      url: fullUrl,
      path: req.route?.path || req.path,
      statusCode: res.statusCode,
      durationMs,
      correlationId: requestContext.getCorrelationId(),
      userId: requestContext.getUserId(),
    };

    // if error responses (>= 500), error handler middleware logs it. Skipping log.
    if (res.statusCode >= 500) return;

    // Log warning for slow requests, info for normal requests
    if (durationMs >= SLOW_REQUEST_THRESHOLD_MS) {
      logger.warn('Slow HTTP request', logData);
    } else {
      logger.info('HTTP request completed', logData);
    }
  });

  next();
}
