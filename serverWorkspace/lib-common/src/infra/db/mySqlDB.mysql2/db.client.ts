/**
 * Phase 10.3
 * File module exporting functions
 * 
 * Goal:
 *    Create connection pool to MySQL database using mysql2 library
 *    Provides reusable database connection pool for the application
 * 
 * Architecture:
 *    - Uses mysql2/promise for async/await support
 *    - Connection pool manages multiple database connections efficiently
 *    - API is tied to mysql2 library and to MySQL database
 *    - Configuration is read from environment variables (.env file)
 * 
 * Flow:
 *    1. Loads environment variables from .env file
 *    2. Creates connection pool with configuration from environment variables
 *    3. Pool manages connections automatically (connection reuse, limits, etc.)
 *    4. Application code imports and uses the pool for database queries
 * 
 * Usage:
 *    - Import: import { pool } from "@server/lib-common"
 *    - Execute queries: const [rows] = await pool.execute('SELECT * FROM users WHERE id = ?', [userId])
 *    - Use in repositories/services for database operations
 * 
 * Configuration:
 *    - Read from .env file: DB_HOST, DB_USER, DB_PASSWORD, DB_NAME, DB_PORT, DB_CONNECTION_LIMIT
 *    - Connection pool settings: waitForConnections, connectionLimit
 * 
 * Dependencies:
 *    cd in serverWorkspace/packages/lib-common
 *    npm install mysql2
 *    npm install dotenv
 */
// Load environment variables if not already loaded (defensive: ensures .env is available)
// Note: dotenv.config() is idempotent - safe to call multiple times
import { config } from "dotenv";
config();

import { createPool } from "mysql2/promise";

export const pool = createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: Number(process.env.DB_PORT),
  waitForConnections: true,
  connectionLimit: Number(process.env.DB_CONNECTION_LIMIT),
});
