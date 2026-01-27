/**
 * FOLDER MODULE: FOLDER BARREL EXPORT
 * ====================================
 * This is the folder entry point.
 * It allows imports from the folder path instead of the specific file.
 * 
 * Example: import { requireRole } from "./utils/security/authorization";
 *          instead of: import { requireRole } from "./utils/security/authorization/authorization.util";
 */

export { requireRole } from "./authorization.util";

