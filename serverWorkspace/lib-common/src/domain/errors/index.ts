/**
 * FOLDER IS NOW MODULE: FOLDER BARREL EXPORT
 * ===========================================
 * This is the folder entry point.
 * It allows imports from the folder path instead of the specific file.
 * 
 * Example: import { BadRequestError } from "./domain/errors";
 *          instead of: import { BadRequestError } from "./domain/errors/error.types";
 * 
 * Note: Error codes are now domain-scoped and defined in each domain module,
 * not in lib-common. See ERROR_ARCHITECTURE_ANALYSIS.md for details.
 */

export { 
  DomainError,
  BadRequestError,
  UnauthorizedError,
  ForbiddenError,
  NotFoundError,
  ConflictError
} from "./error.types";

