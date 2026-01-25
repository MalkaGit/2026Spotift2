/**
 * Phase 10.2
 * File module exporting logger utilities
 * 
 * Goal:
 *    Central application logger that wraps pino and enriches logs with request context data
 *    API decouple consumers from the logging library (pino)
 *    Automatically includes correlationId and userId from request context in all log entries
 * 
 * Architecture:
 *    - Framework-agnostic: works in Express, Fastify, Next.js, or plain Node.js
 *    - Library-agnostic: pino is hidden behind this wrapper (can switch logging library without affecting consumers)
 *    - Uses request-context module to automatically enrich logs with correlationId and userId
 *    - Development: pretty logs with colors and human-readable timestamps
 *    - Production: JSON format (better for log aggregation tools)
 * 
 * Flow:
 *    1. Collect request context data 
 *    2. writes the log message with the request context data correlationId and userId from request context (if available)
 *    3. Logs are written in pretty format for development, JSON format for production
 * 
 * Usage:
 *    - Import: import { logger } from "@server/lib-common"
 *    - Use anywhere (app, controllers, domain, infra, utils): logger.info('Something happened')
 *    - Add custom fields: logger.info('User action', { action: 'login', ip: '127.0.0.1' })
 *    - Context (correlationId, userId) is automatically included in all logs
 * 
 * Configuration:
 *    - Log level: read from env.LOG_LEVEL (default: info in production, debug in development)
 *    - Environment: read from env.NODE_ENV (default: development)
 *    - Development: uses pino-pretty for human-readable logs
 *    - Production: uses JSON format for log aggregation tools
 * 
 * Dependencies:
 *    cd in serverWorkspace/packages/lib-common
 *    npm install dotenv
 *    npm install pino
 *    npm install --save-dev pino-pretty
 */


// Load environment variables if not already loaded (defensive: ensures .env is available)
// Note: dotenv.config() is idempotent - safe to call multiple times
import dotenv from 'dotenv';
dotenv.config();

import pino from 'pino';
import { requestContext } from "../../utils/request-context";

// Development: pretty logs with colors and human-readable timestamps
// Production: JSON format (better for log aggregation tools)
const isDevelopment = process.env.NODE_ENV !== 'production';

const baseLogger = pino({
  level: process.env.LOG_LEVEL || (isDevelopment ? 'debug' : 'info'),
  ...(isDevelopment && {
    //if development, use pretty logs. othewise, pino json logs
    transport: {
      target: 'pino-pretty',
      options: {
        colorize: true,
        translateTime: 'HH:MM:ss.l',
        ignore: 'pid,hostname',
        singleLine: false,
      },
    },
  }),
  timestamp: pino.stdTimeFunctions.isoTime, // ISO 8601 format for production
});


/**
 * Reads data from request context
 * If there is no active request (startup / background job), values will be undefined — which is OK.
 */
function buildContextFields() {
  return {
    userId: requestContext.getUserId(),                     // populated by auth middleware, read here
    correlationId: requestContext.getCorrelationId(),      //  populated by requestContext middleware
  };
}


//Logger wrapper
const logger = {

  debug(message: string, fields: Record<string, any> = {}) {
    baseLogger.debug(
      { ...buildContextFields(), ...fields },
      message
    );
  },

  info(message: string, fields: Record<string, any> = {}) {
    baseLogger.info(
      { ...buildContextFields(), ...fields },
      message
    );
  },

  warn(message: string, fields: Record<string, any> = {}) {
    baseLogger.warn(
      { ...buildContextFields(), ...fields },
      message
    );
  },

  error(message: string, fields: Record<string, any> = {}) {
    baseLogger.error(
      { ...buildContextFields(), ...fields },
      message
    );
  },

  fatal(message: string, fields: Record<string, any> = {}) {
    baseLogger.fatal(
      { ...buildContextFields(), ...fields },
      message
    );
  },
};

export { logger };
