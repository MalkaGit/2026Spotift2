/**
 * Types module - exports all user-related types
 * 
 * This file provides a single entry point for importing user types.
 * It follows the same pattern as the songs module.
 */

export { RegisterUserInput } from "./user.register.input";
export { RegisterUserOutput } from "./user.register.output";
export { registerUserSchema } from "./user.register.input.schema";

export { LoginUserInput } from "./user.login.input";
export { LoginUserOutput } from "./user.login.output";
export { loginUserSchema } from "./user.login.input.schema";

export { UserProfile } from "./user.profile.model";

