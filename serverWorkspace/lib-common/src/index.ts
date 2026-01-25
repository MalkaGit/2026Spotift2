/**
 * PACKAGE PUBLIC API
 * ==================
 * This is the package entry point.
 * It defines modules that can be imported by package name.
 * So if we change the file name or the folder name,
 * the import statement will still work.
 */

// Line below allows: import { Logger1 } from "@mycompanyname/lib-common"  (that is te package name in package.json)
export { Logger1 } from "./utils/logger1";


// Line below allows: import { withRequestContext, requestContext } from "@mycompanyname/lib-common";
export { withRequestContext, requestContext } from "./utils/request-context";

// Line below allows: import { logger } from "@mycompanyname/lib-common";
export { logger } from "./utils/logger";

// Line below allows: import { mysqlPool } from "@server/lib-common";
export { mysqlPool} from "./infra/db/mySqlDB.mysql2";

// Line below allows: import { testMySqlConnection } from "@server/lib-common";
export {testMySqlConnection} from "./infra/db/mySqlDB.mysql2";

// Line below allows: import { BadRequestError, NotFoundError, etc. } from "@server/lib-common";
// Note: Error codes are now domain-scoped and defined in each domain module, not in lib-common
export { 
  DomainError,
  BadRequestError,
  UnauthorizedError,
  ForbiddenError,
  NotFoundError,
  ConflictError
} from "./domain/errors";

// Line below allows: import { TypedRequest } from "@server/lib-common";
export type {
  TypedRequest
} from "./app/express.types";

// Line below allows: import { createRequestValidator } from "@server/lib-common";
export { createRequestValidator } from "./app/express.middlewares";

// Line below allows: import { requestContextMiddleware } from "@server/lib-common";
export { requestContextMiddleware } from "./app/express.middlewares";

// Line below allows: import { authMiddleware } from "@server/lib-common";
export { authMiddleware } from "./app/express.middlewares";

// Line below allows: import { requestLoggerMiddleware } from "@server/lib-common";
export { requestLoggerMiddleware } from "./app/express.middlewares";

// Line below allows: import { errorMiddleware } from "@server/lib-common";
export { errorMiddleware } from "./app/express.middlewares";