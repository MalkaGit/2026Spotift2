/**
 * MySQL (mysql2/promise) transaction runner.
 *
 * Design goals:
 * - Provide a small, stable transaction interface (DbTransaction) for repositories.
 * - Provide runInTransaction for application services to orchestrate multi-repository writes.
 * - Keep mysql2-specific details inside this module so the rest of the app imports only from lib-common.
 *
 * Example usage in a service:
 *
 *   import { runInTransaction, type DbTransaction } from "@mycompanyname/lib-common";
 *   import * as albumsRepo from "../modules/catalog/albums/albums.repository";
 *
 *   await runInTransaction(async (tx: DbTransaction) => {
 *     const album = await albumsRepo.getAlbumById(tx, albumId);
 *     await albumsRepo.updateAlbum(tx, album);
 *     // call other repositories that accept the same tx instance...
 *   });
 *
 * If we later change the SQL driver or MySQL client, only this file (and db.client.ts)
 * need to be updated; services and repositories keep the same imports and signatures.
 */

import type { PoolConnection, RowDataPacket, ResultSetHeader } from "mysql2/promise";
import { pool } from "./db.client";

/**
 * Minimal transaction interface that repositories should depend on.
 * It intentionally does not expose mysql2 types so the rest of the app
 * is insulated from the concrete driver.
 */
export interface DbTransaction {
  query<T extends RowDataPacket[] | RowDataPacket[][] = RowDataPacket[]>(
    sql: string,
    params?: unknown[]
  ): Promise<[T, ResultSetHeader] | [T]>;

  execute<T = ResultSetHeader>(
    sql: string,
    params?: unknown[]
  ): Promise<[T, ResultSetHeader] | [T]>;
}

/**
 * Internal wrapper that adapts a mysql2 PoolConnection to our DbTransaction interface.
 */
class MySqlDbTransaction implements DbTransaction {
  constructor(private readonly conn: PoolConnection) {}

  query<T extends RowDataPacket[] | RowDataPacket[][] = RowDataPacket[]>(
    sql: string,
    params: unknown[] = []
  ) {
    return this.conn.query<T>(sql, params);
  }

  execute<T = ResultSetHeader>(sql: string, params: unknown[] = []) {
    return this.conn.execute<T>(sql, params);
  }
}

/**
 * Run the given callback inside a single database transaction.
 *
 * - Begins a transaction on a pooled connection
 * - Passes a DbTransaction wrapper into the callback
 * - Commits on success, rolls back on error
 * - Always releases the connection back to the pool
 *
 * Services should call this helper instead of managing transactions directly.
 */
export async function runInTransaction<T>(work: (tx: DbTransaction) => Promise<T>): Promise<T> {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const tx = new MySqlDbTransaction(conn);
    const result = await work(tx);
    await conn.commit();
    return result;
  } catch (err) {
    try {
      await conn.rollback();
    } catch {
      // ignore rollback errors – original error is more important
    }
    throw err;
  } finally {
    conn.release();
  }
}

