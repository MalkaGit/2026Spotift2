/**
 * Convenience helpers for working with individual MySQL connections.
 *
 * Most application code should use:
 *   - `mysqlPool` for simple one-off queries, or
 *   - `runInTransaction` for multi-step writes that must be atomic.
 *
 * This module is for cases where a feature really needs direct access to a
 * pooled connection (for example, advanced driver-specific options). It keeps
 * the mysql2 dependency and connection type alias localized to lib-common.
 */

import { pool } from "./db.client";
import type { MySqlConnection } from "./db.types";

/**
 * Get a MySQL connection from the shared pool.
 *
 * Callers are responsible for releasing the connection:
 *
 *   const conn = await getMySqlConnection();
 *   try {
 *     const [rows] = await conn.query("SELECT 1");
 *     // ...
 *   } finally {
 *     conn.release();
 *   }
 *
 * Prefer `runInTransaction` for transactional work instead of managing
 * `beginTransaction / commit / rollback` manually.
 */
export async function getMySqlConnection(): Promise<MySqlConnection> {
  return pool.getConnection();
}

