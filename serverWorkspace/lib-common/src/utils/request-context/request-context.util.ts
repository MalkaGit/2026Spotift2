/**
 * Phase 10.1
 * File module exporting request context utilities
 * 
 * Goal:
 *    Framework-agnostic request-scoped context store using Node's AsyncLocalStorage
 *    Provides access to request metadata (correlationId, userId, userRole) from ANY layer:
 *    controllers, services, repositories, utils (logger), etc.
 * 
 * Architecture:
 *    - Uses AsyncLocalStorage (Node.js built-in) for request-scoped storage
 *    - Context is automatically propagated through async operations (promises, callbacks)
 *    - Framework-agnostic: works in Express, Fastify, Next.js, or plain Node.js
 *    - Library-agnostic: does not depend on any logger, DB, or framework
 * 
 * Flow:
 *    1. Middleware/entrypoint initializes context using withRequestContext(() => { ... })
 *    2. Middleware sets values (correlationId, userId, userRole) using typed helpers
 *    3. Any layer can read values using typed getters (getUserId, getCorrelationId, etc.)
 *    4. Logger automatically includes context in logs without needing to pass values explicitly
 * 
 * Usage:
 *    - request context middleare Initialize context suing withRequestContext
 *    - request context middleare calls requestContext.setCorrelationId
 *    - auth middleware calls           requestContext.setUserId,requestContext.setUserRole
 *    - any layer (app controllers domain , infra, utils) can
 *      read the context values using requestContext.getUserId(), requestContext.getCorrelationId(), requestContext.getUserRole()
 * 
 * Important:
 *    - Only code running inside withRequestContext(...) can read/write context values
 *    - Context values are all strings (correlationId, userId, userRole)
 */

import { AsyncLocalStorage } from 'node:async_hooks';


//RequestContextData: Internal type 
interface RequestContextData {
  correlationId?: string;   // Set by request-context middleware, string or undefined
  userId?: string;          // Set by auth middleware, string or undefined
  userRole?: string;        // Set by auth/authorization middleware, string or undefined
}

// Global AsyncLocalStorage instance - one per Node.js process
const als = new AsyncLocalStorage<RequestContextData>();

/**
 * Creates request-scoped context and runs the callback function
 * All code inside nextFunction() can access the context via requestContext helpers
 * 
 * @param nextFunction - Callback that runs within the request context scope
 * 
 * @example
 *   withRequestContext(() => {
 *     requestContext.setCorrelationId('abc-123');
 *     requestContext.setUserId('user-123');
 *     // All async operations here can access the context
 *     processRequest();
 *   });
 */
export function withRequestContext(nextFunction: () => void) {
  als.run({}, nextFunction);
}


/**
 * requestContext: Framework-agnostic request context accessor
 * Provides API to read/write request-scoped data 
 */
export const requestContext = {

    getCorrelationId: (): string | undefined => als.getStore()?.correlationId,
    setCorrelationId: (correlationId: string): void => {
      const store = als.getStore();
      if (store) store.correlationId = correlationId;
    },

    getUserId: (): string | undefined => als.getStore()?.userId,
    setUserId: (userId: string): void => {
      const store = als.getStore();
      if (store) store.userId = userId;
    },

    getUserRole: (): string | undefined => als.getStore()?.userRole,
    setUserRole: (userRole: string): void => {
      const store = als.getStore();
      if (store) store.userRole = userRole;
    },
  };
