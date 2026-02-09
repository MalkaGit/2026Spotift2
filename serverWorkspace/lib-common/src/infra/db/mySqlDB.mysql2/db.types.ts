/**
 * Re-export mysql2 PoolConnection as MySqlConnection 
 * so consuming packages can type pool connections without depending on mysql2 directly. 
 * Egm when likes repository in app-rest-api uses the pool connection type,
 * the app-rest-api does not need to depend on mysql2 directly.
 * This way, lib-common remains the single place that depends on the driver; 
 */
export type { PoolConnection as MySqlConnection } from "mysql2/promise";

