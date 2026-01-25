//3
import { pool } from "./db.client";
import { logger } from "../../../utils/logger";

export async function testConnection() { 
    try { 
        const [rows] = await pool.query("SELECT NOW() as now"); 
        logger.info("DB connected:", rows); 

    } catch (err) {
         logger.fatal("DB connection error:", err);
    } finally { 
        await pool.end(); 
    } 
} 

//TO TEST:
// add here call to testConnection();
// and run: serverWorkspace\packages\lib-common> npx ts-node src/infra/db/mySqlDB.mysql2/dbTestConnection.ts
