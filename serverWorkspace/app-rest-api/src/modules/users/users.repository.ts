import { mysqlPool } from "@mycompanyname/lib-common";
import { logger } from "@mycompanyname/lib-common";
import { randomUUID } from "crypto";
import { UserEntity } from "./types/user.entity";

/**
 * Register a new user in the database
 * 
 * @param email - User email address (must be unique)
 * @param passwordHash - Pre-hashed password (should be hashed by service layer using bcrypt)
 * @param role - User role ('listener' or 'artist', defaults to 'listener' in DB if not provided)
 * @returns The generated UUID of the newly created user
 * @throws Database errors may be thrown (e.g., duplicate email constraint violations), handled by error middleware
 * 
 * @example
 * const userId = await registerUser("user@example.com", hashedPassword, "listener");
 */
export async function registerUser(email: string, passwordHash: string, role: string): Promise<string> {
  const id = randomUUID();
  const sql = `INSERT INTO users (id, email, password_hash, role) VALUES (?, ?, ?, ?)`;
  const params = [id, email, passwordHash, role];
  
  logger.debug("createUser - SQL query", { sql, params: [id, email, '[REDACTED]', role] });
  await mysqlPool.query(sql, params);
  
  return id;
}

/**
 * Check if a user with the given email already exists
 * 
 * @param email - Email address to check
 * @returns true if user exists, false otherwise
 * @throws Database errors may be thrown (handled by error middleware)
 * 
 * @example
 * const userExists = await exists("user@example.com");
 * if (userExists) {
 *   throw new ConflictError("User already exists");
 * }
 */
export async function exists(email: string): Promise<boolean> {
  const sql = `SELECT 1 FROM users WHERE email = ? LIMIT 1`;
  const params = [email];
  
  logger.debug("exists - SQL query", { sql, params });
  const [rows] = await mysqlPool.query(sql, params);
  const result = rows as any[];
  
  return result.length > 0;
}

/**
 * Find a user by email
 * 
 * @param email - Email address to find
 * @returns UserEntity if found, null otherwise
 * @throws Database errors may be thrown (handled by error middleware)
 * 
 * @example
 * const user = await findByEmail("user@example.com");
 * if (user) {
 *   return user;
 * }
 */
export async function findByEmail(email: string): Promise<UserEntity | null> {
  const sql = `SELECT id, email, password_hash, role, created_at FROM users WHERE email = ? LIMIT 1`;
  const params = [email];
  
  logger.debug("findByEmail - SQL query", { sql, params });
  const [rows] = await mysqlPool.query(sql, params);
  const result = rows as any[];
  
  if (result.length === 0) {
    return null;
  }
  
  // Map database result (snake_case) to UserEntity (camelCase)
  // This is necessary because the database returns snake_case fields
  // but our domain model uses camelCase
  const dbRow = result[0];
  return {
    id: dbRow.id,
    email: dbRow.email,
    passwordHash: dbRow.password_hash,
    role: dbRow.role,
    createdAt: dbRow.created_at,
  };
}
