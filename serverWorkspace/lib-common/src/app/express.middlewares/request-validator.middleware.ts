/**
 * Phase 10.6
 * File module exporting Express middleware for request validation
 * 
 * Goal:
 *    Provide runtime type safety for request inputs using Zod schemas
 *    Validates and parses request body, params, and query string parameters
 *    Enables controllers to work with typed request data instead of untyped strings
 * 
 * Architecture:
 *    - Framework-dependent: Express-specific middleware
 *    - Uses Zod for schema validation and parsing
 *    - Validated data is written to req.body, req.params, and req.validatedQuery
 *    - req.query is immutable in Express, so validated query goes to req.validatedQuery
 *    - Throws ZodError on validation failure (handled by error middleware as 400 Bad Request)
 * 
 * Flow:
 *    1. Middleware receives request and Zod schemas (body, query, params)
 *    2. Parses each request part (body, query, params) using corresponding schema
 *    3. If validation succeeds:
 *       - Writes parsed typed data to req.body (overwrites original)
 *       - Writes parsed typed data to req.params (overwrites original)
 *       - Writes parsed typed data to req.validatedQuery (req.query is immutable)
 *    4. If validation fails:
 *       - Throws ZodError and passes to next(err)
 *       - Error middleware handles ZodError and returns 400 Bad Request
 * 
 * Usage:
 *    - router Create validator using createRequestValidator
 *               const validator = createRequestValidator({ body: songSchema, params: idSchema, query: querySchema })
 *    - router apply validator to route: router.post('/songs', validator, controller)
 *    - controller can use TypedRequest<SongInput, {id: string}, QueryInput> for type safety
 * 
 * Dependencies:
 *    cd in serverWorkspace/packages/lib-common
 *    npm install express
 *    npm install zod
 */

import { Request, Response, NextFunction } from 'express';
import { ZodTypeAny } from 'zod';


/**
 * Creates Express middleware for request validation using Zod schemas
 * 
 * @param schemas - Zod schemas for validating body, query, and params (all optional)
 * @returns Express middleware function that validates and parses request data
 * 
 * @example
 *   const validator = createRequestValidator({
 *     body: songCreateSchema,
 *     params: z.object({ id: z.string() }),
 *     query: querySchema
 *   });
 *   router.post('/songs/:id', validator, controller);
 */
export function createRequestValidator(schemas: {
  body?: ZodTypeAny;      // Schema for request body validation
  query?: ZodTypeAny;      // Schema for query string validation
  params?: ZodTypeAny;     // Schema for path parameters validation
}) {
  return (req: Request, _res: Response, next: NextFunction) => {
    try {
      if (schemas.body) {
        //parse the request body using schemas.body
        //and store the parsed typed data in  req.body (of type any) 
        req.body = schemas.body.parse(req.body);
      }

      if (schemas.params) {
        //parse the request params using schemas.params
        //and store the parsed typed data in req.params (of type ParamsDictionary)
        req.params = schemas.params.parse(req.params) as Request['params'];
      }

      if (schemas.query) {
        //parse the request query using schemas.query
        //and store the parsed typed data in req.validatedQuery (of type any)         
        //since Express does not allow overriding req.query 
        const parsedQuery = schemas.query.parse(req.query);
        req.validatedQuery = parsedQuery;
      }

    
      next();
    } catch (err) {
      next(err);
    }
  };
}
