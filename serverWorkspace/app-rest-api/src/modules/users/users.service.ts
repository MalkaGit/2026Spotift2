import { hash } from "bcrypt";                           //serverWorkspace\app-rest-api>npm install bcrypt                              //serverWorkspace\app-rest-api>npm install bcrypt
import { BadRequestError, ConflictError } from "@mycompanyname/lib-common";
import { RegisterUserInput, RegisterUserOutput } from "./types";
import { UserErrorCode } from "./users.error.codes";
import * as userRepo from "./users.repository";

// Password hashing configuration
const SALT_ROUNDS = 10;

/**
 * Helper method: Hashes a plain text password using bcrypt
 * Used in: user\register, user\reset password, password change operations

 * @param password - Plain text password to hash
 * @returns Hashed password string
 */
async function hashPassword(password: string): Promise<string> {
  return await hash(password, SALT_ROUNDS);
}

/**
 * Helper method: Validates password complexity/strength (business rule)
 * Move to lib-common (utils\secturity) if the logic is required in other modules
 * Business rule: Password must contain at least:
 * - One uppercase letter
 * - One lowercase letter
 * - One number
 * - One special character
 * 
 * @param password - Password to validate
 * @returns true if password meets complexity requirements, false otherwise
 */
function validatePasswordStrength(password: string): boolean {
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecialChar = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);
  
  const result: boolean = hasUpperCase && hasLowerCase && hasNumber && hasSpecialChar;
  return result;

}

/**
 * Operation: Register a new user
 * 
 * Note: Structural validation (required fields, email format, password length) is handled by request validation middleware.
 *  Password complexity/strength validation is handled here as a business rule.
 * 
 * @param input - User registration input
 * @param input.email - User email address (must be unique)
 * @param input.password - Plain text password (will be hashed)
 * @returns The generated UUID of the newly created user
 * @throws BadRequestError if password doesn't meet complexity requirements
 * @throws ConflictError if user with email already exists
 * 
 * @example
 * const result = await register({
 *   email: "user@example.com",
 *   password: "SecurePass123!",
 * });
 */
export async function register(input: RegisterUserInput): Promise<RegisterUserOutput> {

    //BL: validate input
    //  email is validated at request validation middleware (format, required)
    //  password length is validated at request validation middleware (min 8 characters)
    
    //BL: Validate password strength/complexity (business rule) using helper method
    const isStrongPassword: boolean = validatePasswordStrength(input.password);
    if (!isStrongPassword) {
        throw new BadRequestError(
            UserErrorCode.PASSWORD_TOO_WEAK,
            "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character"
        );
    }

    //BL: Check if email already exists
    const userExists = await userRepo.exists(input.email);
    if (userExists) {
        throw new ConflictError(
            UserErrorCode.USER_ALREADY_EXISTS,
            //BL: error message
            `User with email ${input.email} already exists` );
    }

    // BL:Hash the password & set default role
    const passwordHash = await hashPassword(input.password);
    const role = 'listener';
    
    //BL: create the user
    const id = await userRepo.registerUser(input.email, passwordHash, role);
    
    return { id };
}