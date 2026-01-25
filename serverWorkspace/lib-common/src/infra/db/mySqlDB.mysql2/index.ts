/**
 * FOLDER IS NOW MODULE: FOLDER BARREL EXPORT
 * ===========================================
 * This is the folder entry point.
 * It allows imports from the folder path instead of the specific file.
 * 
 * Example: import { pool } from "./infra/db/mySqlDB.mysql2";
 *          instead of: import { pool } from "./infra/db/mySqlDB.mysql2/db.client";
 */

export { pool as mysqlPool } from "./db.client";
export { testConnection as testMySqlConnection} from "./db.client.tester";    


