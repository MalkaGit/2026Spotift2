
import * as userRepo from "./users.repository";
import { UserEntity } from "./types/user.entity";

import { RegisterUserInput, RegisterUserOutput } from "./types";
import { LoginUserInput, LoginUserOutput } from "./types";
import { UserProfile } from "./types/user.profile.model";
import { UserErrorCode } from "./users.error.codes";

import { BadRequestError, ConflictError, UnauthorizedError, NotFoundError, requestContext, requireAuthenticated } from "@mycompanyname/lib-common";
import { hash, compare } from "bcrypt";
import { sign } from "jsonwebtoken";

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

/**
 * Operation: Login a user
 * 
 * Note: Structural validation (required fields, email format) is handled by request validation middleware.
 * 
 * @param input - User login input
 * @param input.email - User email address
 * @param input.password - Plain text password
 * @returns Access token and expiration time
 * @throws UnauthorizedError if email or password is invalid
 * 
 * @example
 * const result = await login({
 *   email: "user@example.com",
 *   password: "SecurePass123!",
 * });
 */
export async function login(input: LoginUserInput): Promise<LoginUserOutput>{
    
    // BL: Validate JWT_SECRET is configured
    const JWT_SECRET = process.env.JWT_SECRET;
    if (!JWT_SECRET || JWT_SECRET.length < 32) {
        throw new Error(
            "JWT_SECRET is not configured or is too short. Please set JWT_SECRET in .env file (minimum 32 characters)."
        );
    }

    // BL: Find user by email
    const user : UserEntity | null = await userRepo.findByEmail(input.email);
    
    // BL: Find password hash
    const DUMMY_HASH = "$2b$10$hbcv.oxlQvTbq.dTY5IX5ur9O4HI0CL1MUWVhuLSNY2Axsnp8mcdy";
    const passwordHash = user?.passwordHash || DUMMY_HASH;
    
    // BL: Compare password 
    // security: attacker can't tell if email exists or not since we call compare event when user does not exist
    const isPasswordValid = await compare(input.password, passwordHash);
    
    // BL: Validate credentials
    // security: error code does not reveal if email exists or not
    if (!user || !isPasswordValid) {
        throw new UnauthorizedError(
            UserErrorCode.INVALID_CREDENTIALS,
            "Invalid email or password"
        );
    }

    // BL: Generate JWT token
    const JWT_EXPIRES_IN = 3600; // 1 hour in seconds
    const payload = {
        sub: user.id,               // Standard JWT claim: subject (user identifier)
        email: user.email,          // Additional claim: user email (common practice)
        role: user.role,            // Custom claim: user role
    };

    //BL: Generate JWT token using jsonwebtoken
    //    note: sign automatically adds the iat (issued at) and exp (expires at) 
    //    note: jsonwebtoken has verify method 
    //          the verify method can verify token without accessing db 
    //          the verify method throws TokenExpiredError
    const accessToken = sign(payload, JWT_SECRET, {
        expiresIn: JWT_EXPIRES_IN,
        issuer: "spotify-app",
        audience: "spotify-app-users",
    });

    return {
        accessToken,
        expiresIn: JWT_EXPIRES_IN,
    };
}

/**
 * Operation: Get user profile
 * 
 * @returns User profile (email, role, createdAt) - excludes sensitive fields like passwordHash
 * @throws NotFoundError if user with the given ID does not exist
 * 
 * Note: User authentication is handled by JWT middleware (userId extracted from token).
 *       Any authenticated user can view their own profile (no role-based authorization needed).

 * @example
 * const profile = await getMe("123e4567-e89b-12d3-a456-426614174000");
 * // Returns: { email: "user@example.com", role: "listener", createdAt: "2024-01-01T00:00:00.000Z" }
 */
export async function getMe(): Promise<UserProfile> {
    
    //BL: Authentication - user must be authenticated
    requireAuthenticated();
    
    // Get userId from request context (guaranteed to be string after requireAuthenticated)
    const userId: string = requestContext.getUserId()!;
    
    // BL: Find user by ID
    const user: UserEntity | null = await userRepo.findById(userId);
    
    // BL: Validate user exists
    if (!user) {
        throw new NotFoundError(
            UserErrorCode.USER_NOT_FOUND,
            `User with id ${userId} not found`
        );
    }
    
    // BL: Map entity to Model (exclude sensitive fields like passwordHash and id)
    // Convert createdAt Date to ISO string format
    const result : UserProfile = {
        email: user.email,
        role: user.role,
        createdAt: user.createdAt.toISOString(),
    };
    return result;
}