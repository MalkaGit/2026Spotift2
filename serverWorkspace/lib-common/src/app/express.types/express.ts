/**
 * Phase 10.5
 * File module exporting Express type definitions
 * 
 * Goal:
 *    Declare TypedRequest<TBody, TParams, TQuery> for type-safe Express request handling
 *    Provides type safety for req.body, req.params, and req.validatedQuery
 *    TBody, TParams, TQuery are optional generic type parameters
 * 
 * Architecture:
 *    - Extends Express Request interface with validatedQuery property
 *    - TypedRequest provides generic type parameters for body, params, and validatedQuery
 *    - Request-validation middleware uses Zod to parse and validate request data
 *    - Framework-dependent: Express-specific types
 *    - Request context (correlationId, userId, userRole) is NOT stored on request object
 *      but in framework-agnostic requestContext utility (AsyncLocalStorage)
 * 
 * Flow:
 *    1. Request-validation middleware uses Zod to parse and validate request data
 *    2. Validated data is written to req.validatedQuery (for query string parameters)
 *    3. Controller uses TypedRequest<TBody, TParams, TQuery> to get typed access
 *    4. Controller can safely access req.body, req.params, req.validatedQuery with full type safety
 * 
 * Usage:
 *    - Import: import { TypedRequest } from "@server/lib-common"
 *    - In controller: (req: TypedRequest<SongUpdateInput, {id: string}, any>) => { ... }
 *    - Access typed body: req.body (type: SongUpdateInput)
 *    - Access typed params: req.params (type: {id: string})
 *    - Access typed validatedQuery: req.validatedQuery (type: TQuery)
 * 
 * Dependencies:
 *    cd in serverWorkspace/packages/lib-common
 *    npm install express
 *    npm install --save-dev @types/express
 * 
 * Important:
 *    - Request context (correlationId, userId, userRole) is accessed via requestContext utility, not req.context
 *    - Use requestContext.getCorrelationId(), requestContext.getUserId(), etc. to access context
 */

import { Request as ExpressRequest } from 'express';

/**
 * MODULE AUGMENTATION: Extend Express Request interface
 * Adds validatedQuery property to all Express Request objects
 * Type is 'any' here because generics aren't allowed in global type declarations
 * Actual typing is provided by TypedRequest<TBody, TParams, TQuery> generic type
 */
declare global {
  namespace Express {
    interface Request {
      // Validated query string parameters (set by request-validator middleware)
      // Optional because not all routes validate query strings
      validatedQuery?: any;
    }
  }
}

/**
 * TypedRequest: Strongly-typed request for Express handlers
 * Provides type safety for body, params, and validatedQuery
 * 
 * @template TBody - Type for req.body (default: any)
 * @template TParams - Type for req.params (default: any)
 * @template TQuery - Type for req.validatedQuery (default: any)
 * 
 * @example
 *   // Update song endpoint - typed body and params
 *   TypedRequest<SongUpdateInput, {id: string}, any>
 *   - body: SongUpdateInput (the song data to update)
 *   - params: {id: string} (the song ID)
 * 
 * @example
 *   // Read songs endpoint - typed validated query string
 *   TypedRequest<any, any, QueryInput>
 *   - validatedQuery: QueryInput (parsed query string)
 *     Contains: sort (comma-separated string split into string array), offset: number, limit: number
 */
export type TypedRequest<TBody = any, TParams = any, TQuery = any> = 
ExpressRequest & {
  body: TBody;
  params: TParams;
  validatedQuery?: TQuery;
};

// Export {} makes this file a module (required for declare global to work)
export {};

