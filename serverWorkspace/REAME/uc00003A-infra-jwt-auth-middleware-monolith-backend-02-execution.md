# 🛠️ JWT Auth Middleware - Development Guide

## 📐 Development Approach: Bottom-Up, Layer-by-Layer

> **Implementation Strategy**: We implement this middleware **bottom-up, layer by layer**. Each layer builds on the previous one, and **you can compile and test after each layer** to ensure everything works before moving to the next layer.
>
> This approach ensures:
> - ✅ Early error detection
> - ✅ Incremental progress with working code at each step
> - ✅ Easy debugging (know exactly which layer has issues)
> - ✅ Better understanding of dependencies

---

## 📋 Prerequisites

### ✅ Before Starting

Ensure you have:
- ✅ Login operation implemented (`uc00002`)
- ✅ Node.js and npm installed
- ✅ Access to the codebase
- ✅ Postman or similar tool for testing

### 📦 Required Dependencies

```bash
cd serverWorkspace/lib-common
npm install jsonwebtoken
npm install --save-dev @types/jsonwebtoken
```

---

## 🏗️ Layer-by-Layer Implementation

### 📊 Implementation Layers Overview

| Layer | Component | Can Compile? | Depends On |
|-------|-----------|--------------|------------|
| **1** | Types & Interfaces | ✅ Yes | None |
| **2** | Environment Configuration | ✅ Yes | None |
| **3** | Error Types | ✅ Yes | None (already exists) |
| **4** | Request Context | ✅ Yes | None (already exists) |
| **5** | Public Routes Check Logic | ✅ Yes | Layer 1 |
| **6** | Token Extraction Logic | ✅ Yes | Layer 1, 3 |
| **7** | Token Verification Logic | ✅ Yes | Layer 1, 2, 3 |
| **8** | Context Population Logic | ✅ Yes | Layer 1, 4 |
| **9** | Middleware Function Assembly | ✅ Yes | Layers 1-8 |
| **10** | Export & Registration | ✅ Yes | Layer 9 |

---

## 🔷 Layer 1: Types & Interfaces

### 📄 File
**Location**: `lib-common/src/app/express.middlewares/auth.monolith.jwt.middleware.ts`

### 📝 Methods & Signatures

```typescript
// Public Route Definition
export interface PublicRoute {
  method: string;
  path: string;
}

// Middleware Options
export interface JwtAuthMiddlewareOptions {
  publicRoutes?: PublicRoute[];
}

// JWT Payload Structure
interface JwtPayload {
  sub: string;        // Subject (user ID) - standard JWT claim
  email?: string;     // User email (optional)
  role?: string;      // User role (optional)
  iat?: number;       // Issued at
  exp?: number;       // Expiration
  iss?: string;       // Issuer
  aud?: string;       // Audience
}
```

### ✅ Implementation Steps

1. Create file: `lib-common/src/app/express.middlewares/auth.monolith.jwt.middleware.ts`
2. Add the three interfaces above
3. **Compile**: `cd lib-common && npm run build` ✅

### 📊 Related Tables

| Interface | Purpose | Used By |
|-----------|---------|---------|
| `PublicRoute` | Defines public routes that skip authentication | Middleware options |
| `JwtAuthMiddlewareOptions` | Configuration for middleware | Middleware function |
| `JwtPayload` | Structure of decoded JWT token | Token verification |

---

## 🔷 Layer 2: Environment Configuration

### 📄 File
**Location**: `.env` (in `app-rest-api` directory)

### 📝 Configuration

```env
# JWT Authentication
JWT_SECRET=your-secret-key-minimum-32-characters-long
JWT_ISSUER=optional-issuer-name
JWT_AUDIENCE=optional-audience-name
```

### ✅ Implementation Steps

1. Add `JWT_SECRET` to `.env` file (minimum 32 characters)
2. Optionally add `JWT_ISSUER` and `JWT_AUDIENCE`
3. **Verify**: Restart app and check `process.env.JWT_SECRET` ✅

### 📊 Related Tables

| Variable | Required | Purpose | Validation |
|----------|----------|---------|------------|
| `JWT_SECRET` | ✅ Yes | Secret for signing/verifying tokens | Min 32 chars (P1) |
| `JWT_ISSUER` | ❌ No | Verify token issuer | Must match token `iss` claim (P2) |
| `JWT_AUDIENCE` | ❌ No | Verify token audience | Must match token `aud` claim (P2) |

> **⚠️ P2 (Priority 2)**: Issuer and audience validation can be added later. For now, focus on basic token verification.

---

## 🔷 Layer 3: Error Types

### 📄 File
**Location**: `lib-common/src/domain/errors/error.types.ts` (already exists)

### 📝 Method Signature

```typescript
export class UnauthorizedError extends DomainError {
  constructor(message: string, details?: unknown) {
    super("UNAUTHORIZED", message, details);
  }
}
```

### ✅ Implementation Steps

1. ✅ **Already exists** - No implementation needed
2. Import in middleware: `import { UnauthorizedError } from "../../domain/errors/error.types";`
3. **Compile**: Should work ✅

### 📊 Related Tables

| Error Type | HTTP Status | When to Use |
|-----------|-------------|-------------|
| `UnauthorizedError` | 401 | Missing/invalid/expired token |

---

## 🔷 Layer 4: Request Context

### 📄 File
**Location**: `lib-common/src/utils/request-context/request-context.util.ts` (already exists)

### 📝 Method Signatures

```typescript
export const requestContext = {
  setUserId: (userId: string): void;
  getUserId: (): string | undefined;
  setUserRole: (userRole: string): void;
  getUserRole: (): string | undefined;
};
```

### ✅ Implementation Steps

1. ✅ **Already exists** - No implementation needed
2. Import in middleware: `import { requestContext } from "../../utils/request-context";`
3. **Compile**: Should work ✅

### 📊 Related Tables

| Method | Purpose | Used In |
|--------|---------|---------|
| `setUserId()` | Store user ID in context | Layer 8 (Context Population) |
| `getUserId()` | Read user ID from context | Controllers/Services |
| `setUserRole()` | Store user role in context | Layer 8 (Context Population) |
| `getUserRole()` | Read user role from context | Controllers/Services |

---

## 🔷 Layer 5: Public Routes Check Logic

### 📄 File
**Location**: `lib-common/src/app/express.middlewares/auth.monolith.jwt.middleware.ts`

### 📝 Method Signature

```typescript
function isPublicRoute(
  req: Request,
  publicRoutes?: PublicRoute[]
): boolean
```

### 💼 Business Logic

```typescript
function isPublicRoute(req: Request, publicRoutes?: PublicRoute[]): boolean {
  if (!publicRoutes || publicRoutes.length === 0) {
    return false;
  }
  
  return publicRoutes.some(route => {
    const methodMatches = route.method.toUpperCase() === req.method.toUpperCase();
    const pathMatches = req.path === route.path || req.path.startsWith(route.path + '/');
    return methodMatches && pathMatches;
  });
}
```

### ✅ Implementation Steps

1. Add `isPublicRoute` helper function
2. **Compile**: `cd lib-common && npm run build` ✅
3. **Test**: Can test with mock request object

### 📊 Related Tables

| Input | Type | Description |
|-------|------|-------------|
| `req.method` | string | HTTP method (GET, POST, etc.) |
| `req.path` | string | Request path (e.g., `/users/login`) |
| `publicRoutes` | `PublicRoute[]` | Array of public routes |

| Output | Type | Description |
|--------|------|-------------|
| `isPublic` | boolean | `true` if route is public, `false` otherwise |

### 🔍 Validation (P2 - Can Add Later)

- [ ] P2: Validate public routes format on startup
- [ ] P2: Warn if public routes contain wildcards
- [ ] P2: Log public route matches for debugging

---

## 🔷 Layer 6: Token Extraction Logic

### 📄 File
**Location**: `lib-common/src/app/express.middlewares/auth.monolith.jwt.middleware.ts`

### 📝 Method Signature

```typescript
function extractBearerToken(authHeader: string | undefined): string
```

### 💼 Business Logic

```typescript
function extractBearerToken(authHeader: string | undefined): string {
  if (!authHeader) {
    throw new UnauthorizedError(
      'Authentication required. Bearer token not found in Authorization header.'
    );
  }
  
  if (!authHeader.startsWith('Bearer ')) {
    throw new UnauthorizedError(
      'Authentication required. Bearer token not found in Authorization header.'
    );
  }
  
  return authHeader.substring(7); // Remove 'Bearer ' prefix
}
```

### ✅ Implementation Steps

1. Add `extractBearerToken` helper function
2. Import `UnauthorizedError` from error types
3. **Compile**: `cd lib-common && npm run build` ✅
4. **Test**: Test with various header formats

### 📊 Related Tables

| Input | Type | Description |
|-------|------|-------------|
| `authHeader` | `string \| undefined` | Authorization header value |

| Output | Type | Description |
|--------|------|-------------|
| `token` | `string` | JWT token (without "Bearer " prefix) |

| Error Condition | Error Thrown |
|-----------------|--------------|
| Header missing | `UnauthorizedError: "Authentication required. Bearer token not found in Authorization header."` |
| Header doesn't start with "Bearer " | `UnauthorizedError: "Authentication required. Bearer token not found in Authorization header."` |

### 🔍 Validation (P2 - Can Add Later)

- [ ] P2: Validate token format (should be JWT format: `xxx.yyy.zzz`)
- [ ] P2: Check token length (minimum reasonable length)
- [ ] P2: Sanitize token (remove whitespace)

---

## 🔷 Layer 7: Token Verification Logic

### 📄 File
**Location**: `lib-common/src/app/express.middlewares/auth.monolith.jwt.middleware.ts`

### 📝 Method Signature

```typescript
function verifyJwtToken(
  token: string,
  secret: string
): JwtPayload
```

### 💼 Business Logic

```typescript
import { verify, TokenExpiredError, JsonWebTokenError } from 'jsonwebtoken';

function verifyJwtToken(token: string, secret: string): JwtPayload {
  // P2: Validate secret length on startup (can add later)
  if (!secret || secret.length < 32) {
    throw new Error(
      "JWT_SECRET is not configured or is too short. " +
      "Please set JWT_SECRET in .env file (minimum 32 characters)."
    );
  }
  
  try {
    const decoded = verify(token, secret, {
      issuer: process.env.JWT_ISSUER,      // Optional: verify issuer (P2)
      audience: process.env.JWT_AUDIENCE,  // Optional: verify audience (P2)
    }) as JwtPayload;
    
    return decoded;
  } catch (err) {
    if (err instanceof TokenExpiredError) {
      throw new UnauthorizedError('Token has expired');
    }
    if (err instanceof JsonWebTokenError) {
      throw new UnauthorizedError('Invalid token');
    }
    throw err;
  }
}
```

### ✅ Implementation Steps

1. Import `verify`, `TokenExpiredError`, `JsonWebTokenError` from `jsonwebtoken`
2. Add `verifyJwtToken` function
3. **Compile**: `cd lib-common && npm run build` ✅
4. **Test**: Test with valid/invalid/expired tokens

### 📊 Related Tables

| Input | Type | Description |
|-------|------|-------------|
| `token` | `string` | JWT token to verify |
| `secret` | `string` | JWT secret from environment |

| Output | Type | Description |
|--------|------|-------------|
| `decoded` | `JwtPayload` | Decoded token payload |

| Error Condition | Error Thrown |
|-----------------|--------------|
| Secret missing or < 32 chars | `Error: "JWT_SECRET is not configured or is too short..."` |
| Token expired | `UnauthorizedError: "Token has expired"` |
| Token invalid | `UnauthorizedError: "Invalid token"` |
| Other verification error | Re-thrown as-is |

### 🔍 Validation (P2 - Can Add Later)

- [ ] P2: Validate secret length on application startup (not on every request)
- [ ] P2: Verify issuer claim (`iss`) if `JWT_ISSUER` is set
- [ ] P2: Verify audience claim (`aud`) if `JWT_AUDIENCE` is set
- [ ] P2: Validate token algorithm (should be HS256)
- [ ] P2: Cache verification results for performance

---

## 🔷 Layer 8: Context Population Logic

### 📄 File
**Location**: `lib-common/src/app/express.middlewares/auth.monolith.jwt.middleware.ts`

### 📝 Method Signature

```typescript
function populateRequestContext(payload: JwtPayload): void
```

### 💼 Business Logic

```typescript
function populateRequestContext(payload: JwtPayload): void {
  // Extract and validate user ID
  const userId = payload.sub;
  if (!userId) {
    throw new UnauthorizedError('Token payload missing required "sub" claim');
  }
  
  // Extract and validate user role
  const userRole = payload.role;
  if (!userRole) {
    throw new UnauthorizedError('Token payload missing required "role" claim');
  }
  
  // Store in request context
  requestContext.setUserId(userId);
  requestContext.setUserRole(userRole);
  
  // P2: Log context population for debugging (can add later)
  // logger.debug("JWT auth - User authenticated and stored in context", { userId, userRole });
}
```

### ✅ Implementation Steps

1. Add `populateRequestContext` function
2. Import `requestContext` from utils
3. **Compile**: `cd lib-common && npm run build` ✅
4. **Test**: Verify context is populated correctly

### 📊 Related Tables

| Input | Type | Description |
|-------|------|-------------|
| `payload.sub` | `string` | User ID from token (required) |
| `payload.role` | `string` | User role from token (required) |

| Output | Type | Description |
|--------|------|-------------|
| Context populated | `void` | `userId` and `userRole` stored in context |

| Error Condition | Error Thrown |
|-----------------|--------------|
| Missing `sub` claim | `UnauthorizedError: "Token payload missing required 'sub' claim"` |
| Missing `role` claim | `UnauthorizedError: "Token payload missing required 'role' claim"` |

### 🔍 Validation (P2 - Can Add Later)

- [ ] P2: Validate userId format (UUID, email, etc.)
- [ ] P2: Validate userRole against allowed roles list
- [ ] P2: Log context population with correlation ID
- [ ] P2: Add metrics for successful authentications

---

## 🔷 Layer 9: Middleware Function Assembly

### 📄 File
**Location**: `lib-common/src/app/express.middlewares/auth.monolith.jwt.middleware.ts`

### 📝 Method Signature

```typescript
export function jwtAuthMiddleware(
  options: JwtAuthMiddlewareOptions = {}
): (req: Request, res: Response, next: NextFunction) => void
```

### 💼 Business Logic

```typescript
import { Request, Response, NextFunction } from 'express';
import { logger } from "../../utils/logger";

export function jwtAuthMiddleware(
  options: JwtAuthMiddlewareOptions = {}
) {
  return (req: Request, _res: Response, next: NextFunction) => {
    try {
      // Step 1: Check if public route (Layer 5)
      if (isPublicRoute(req, options.publicRoutes)) {
        return next(); // Skip authentication
      }
      
      // Step 2: Get JWT secret (Layer 2)
      const JWT_SECRET = process.env.JWT_SECRET;
      if (!JWT_SECRET || JWT_SECRET.length < 32) {
        throw new Error(
          "JWT_SECRET is not configured or is too short. " +
          "Please set JWT_SECRET in .env file (minimum 32 characters)."
        );
      }
      
      // Step 3: Extract token (Layer 6)
      const authHeader = req.headers.authorization;
      const token = extractBearerToken(authHeader);
      
      // Step 4: Verify token (Layer 7)
      const decoded = verifyJwtToken(token, JWT_SECRET);
      
      // Step 5: Populate context (Layer 8)
      populateRequestContext(decoded);
      
      // P2: Log successful authentication (can add later)
      logger.debug("JWT auth - User authenticated and stored in context");
      
      next();
    } catch (err) {
      next(err);
    }
  };
}
```

### ✅ Implementation Steps

1. Assemble all helper functions into main middleware
2. Import Express types
3. Import logger (optional, P2)
4. **Compile**: `cd lib-common && npm run build` ✅
5. **Test**: Test with mock Express request/response

### 📊 Related Tables

| Step | Layer Used | Purpose |
|------|-----------|---------|
| 1 | Layer 5 | Check if route is public |
| 2 | Layer 2 | Get JWT secret from environment |
| 3 | Layer 6 | Extract token from header |
| 4 | Layer 7 | Verify token signature and expiration |
| 5 | Layer 8 | Store user info in context |

| Flow Path | Condition | Action |
|-----------|-----------|--------|
| Public Route | `isPublicRoute()` returns `true` | Skip authentication, call `next()` |
| Protected Route | Token valid | Verify, populate context, call `next()` |
| Protected Route | Token missing/invalid | Throw `UnauthorizedError` |

### 🔍 Validation (P2 - Can Add Later)

- [ ] P2: Add request logging with correlation ID
- [ ] P2: Add performance metrics (verification time)
- [ ] P2: Add rate limiting for authentication attempts
- [ ] P2: Cache verification results for same token

---

## 🔷 Layer 10: Export & Registration

### 📄 Files

1. **Export**: `lib-common/src/app/express.middlewares/index.ts`
2. **Export**: `lib-common/src/index.ts`
3. **Registration**: `app-rest-api/src/app.ts`

### 📝 Method Signatures

**File 1**: `lib-common/src/app/express.middlewares/index.ts`
```typescript
export { jwtAuthMiddleware, PublicRoute, JwtAuthMiddlewareOptions } 
  from './auth.monolith.jwt.middleware';
```

**File 2**: `lib-common/src/index.ts`
```typescript
export { jwtAuthMiddleware, PublicRoute, JwtAuthMiddlewareOptions } 
  from './app/express.middlewares';
```

**File 3**: `app-rest-api/src/app.ts`
```typescript
import { jwtAuthMiddleware } from 'lib-common';

app.use(jwtAuthMiddleware({
  publicRoutes: [
    { method: 'POST', path: '/users/register' },
    { method: 'POST', path: '/users/login' },
    { method: 'GET', path: '/health' }
  ]
}));
```

### ✅ Implementation Steps

1. Export from middleware index file
2. Export from lib-common index file
3. Register middleware in app.ts (before routes!)
4. **Compile**: `cd lib-common && npm run build && cd ../app-rest-api && npm run build` ✅
5. **Test**: Start server and test endpoints

### 📊 Related Tables

| File | Purpose | Order |
|------|---------|-------|
| `middlewares/index.ts` | Export middleware from module | 1 |
| `lib-common/index.ts` | Export from package | 2 |
| `app.ts` | Register middleware in app | 3 |

| Registration Order | Component | Why |
|-------------------|----------|-----|
| 1 | Request context middleware | Initialize context |
| 2 | JWT auth middleware | Verify token, populate context |
| 3 | Routes | Use context in controllers |

---

## 🏗️ Build Instructions

### After Each Layer

```bash
# Navigate to lib-common
cd serverWorkspace/lib-common

# Build (should compile after each layer)
npm run build

# If successful, move to next layer ✅
```

### Final Build

```bash
# Build lib-common
cd serverWorkspace/lib-common
npm install
npm run build

# Build app-rest-api
cd ../app-rest-api
npm install
npm run build
npm start
```

### ✅ Verify Build

Test: `http://localhost:3000/health`

---

## 🧪 Testing After Each Layer

### Layer 1-4: Types & Dependencies
- ✅ Compile check only

### Layer 5: Public Routes Check
```typescript
// Test with mock request
const mockReq = { method: 'GET', path: '/health' };
const isPublic = isPublicRoute(mockReq, [{ method: 'GET', path: '/health' }]);
// Should return true
```

### Layer 6: Token Extraction
```typescript
// Test valid header
extractBearerToken('Bearer token123'); // Should return 'token123'

// Test invalid header
extractBearerToken('Invalid'); // Should throw UnauthorizedError
```

### Layer 7: Token Verification
```typescript
// Test with valid token (from login)
const payload = verifyJwtToken(validToken, JWT_SECRET);
// Should return decoded payload

// Test with expired token
verifyJwtToken(expiredToken, JWT_SECRET);
// Should throw UnauthorizedError('Token has expired')
```

### Layer 8: Context Population
```typescript
// Test with valid payload
populateRequestContext({ sub: 'user123', role: 'listener' });
// Should populate context

// Verify context
requestContext.getUserId(); // Should return 'user123'
requestContext.getUserRole(); // Should return 'listener'
```

### Layer 9-10: Full Integration
- ✅ Test with Postman (see test examples below)

---

## 🧪 How to Test: JWT Auth Middleware

### ✅ Example 1: Public Route (Should Succeed Without Token)

**Request:**
```http
GET http://localhost:3000/health
```

**Expected Response:**
```json
200 OK
(no authentication required)
```

---

### ❌ Example 2: Protected Route Without Token (Should Fail)

**Request:**
```http
GET http://localhost:3000/users/me
```

**Expected Response:**
```json
401 Unauthorized
{
    "code": "UNAUTHORIZED",
    "message": "Authentication required. Bearer token not found in Authorization header."
}
```

---

### ✅ Example 3: Protected Route With Valid Token (Should Succeed)

#### Step 3.1: Login to Get Token

**Request:**
```http
POST http://localhost:3000/users/login
Content-Type: application/json

{
    "email": "email4@gmail.com",
    "password": "aA123456789!"
}
```

**Expected Response:**
```json
200 OK
{
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expiresIn": 3600
}
```

#### Step 3.2: Use Token in Protected Route

**Request:**
```http
GET http://localhost:3000/users/me
Authorization: Bearer <token-from-3.1>
```

**Expected Response:**
```json
200 OK
{
    "userId": "47e3f0fd-ea37-4b45-9894-b9779bd670df",
    "userRole": "listener"
}
```

---

### ❌ Example 4: Protected Route With Invalid Token (Should Fail)

**Request:**
```http
GET http://localhost:3000/users/me
Authorization: Bearer invalid-token-here
```

**Expected Response:**
```json
401 Unauthorized
{
    "code": "UNAUTHORIZED",
    "message": "Invalid token"
}
```

---

### ❌ Example 5: Protected Route With Expired Token (Should Fail)

**Request:**
```http
GET http://localhost:3000/users/me
Authorization: Bearer <expired-token>
```

**Expected Response:**
```json
401 Unauthorized
{
    "code": "UNAUTHORIZED",
    "message": "Token has expired"
}
```

---

## 🔧 Troubleshooting

### ❌ Issue: "JWT_SECRET is not configured"

**Solution:**
1. Add `JWT_SECRET` to `.env` file (minimum 32 characters)
2. Restart the application
3. Verify: `console.log(process.env.JWT_SECRET?.length)` should be >= 32

---

### ❌ Issue: "Invalid token" error even with valid token

**Solution:**
- ✅ Verify `JWT_SECRET` matches the one used to sign the token
- ✅ Check if token is expired (`exp` claim)
- ✅ Ensure token is not modified/tampered

---

### ❌ Issue: "Token payload missing required 'sub' claim"

**Solution:**
- ✅ Verify login operation includes `sub` (user ID) in JWT payload
- ✅ Check token generation code uses correct payload structure

---

### ❌ Issue: Middleware not running

**Solution:**
- ✅ Verify middleware is registered in `app.ts`: `app.use(jwtAuthMiddleware(...))`
- ✅ Check middleware registration order (should be before routes)
- ✅ Verify lib-common is built: `cd lib-common && npm run build`

---

### ❌ Issue: Public routes still require authentication

**Solution:**
- ✅ Verify `publicRoutes` array includes correct method and path
- ✅ Check path matching logic (exact match or startsWith)
- ✅ Ensure `publicRoutes` is passed to middleware options

---

### ❌ Issue: Context is empty in controller

**Solution:**
- ✅ Verify middleware runs before controller
- ✅ Check `requestContext.setUserId()` and `setUserRole()` are called
- ✅ Verify token contains `sub` and `role` claims

---

## ⚠️ Common Mistakes to Avoid

| # | Mistake | Impact |
|---|---------|--------|
| 1 | ❌ Using `JWT_SECRET` shorter than 32 characters | Security vulnerability |
| 2 | ❌ Storing `JWT_SECRET` in code instead of environment | Security risk |
| 3 | ❌ Forgetting to register middleware in `app.ts` | Middleware won't run |
| 4 | ❌ Not including public routes (all routes require auth) | Public endpoints broken |
| 5 | ❌ Wrong middleware order (should be before routes) | Context not available |
| 6 | ❌ Not handling `TokenExpiredError` separately | Poor error messages |
| 7 | ❌ Missing `sub` or `role` in token payload | Context population fails |
| 8 | ❌ Not rebuilding lib-common after changes | Changes not reflected |

---

## ✅ Success Checklist

- [ ] Layer 1: Types & Interfaces compiled ✅
- [ ] Layer 2: Environment configured ✅
- [ ] Layer 3: Error types imported ✅
- [ ] Layer 4: Request context imported ✅
- [ ] Layer 5: Public routes check implemented ✅
- [ ] Layer 6: Token extraction implemented ✅
- [ ] Layer 7: Token verification implemented ✅
- [ ] Layer 8: Context population implemented ✅
- [ ] Layer 9: Middleware function assembled ✅
- [ ] Layer 10: Exported and registered ✅
- [ ] All test cases passing ✅
- [ ] Error handling working correctly ✅

---

## 🎉 Next Steps

Once all layers are complete and tests pass, you're ready to:
- ✅ Use the middleware in protected routes
- ✅ Access `userId` and `userRole` from request context in controllers
- ✅ Move to next operation (Get User Profile, Change Password, etc.)

---

## 📝 Priority 2 (P2) Items - Can Add Later

These validations and enhancements can be added after the core functionality works:

- [ ] P2: Validate `JWT_SECRET` length on application startup (not on every request)
- [ ] P2: Verify issuer claim (`iss`) if `JWT_ISSUER` is set
- [ ] P2: Verify audience claim (`aud`) if `JWT_AUDIENCE` is set
- [ ] P2: Validate token format (JWT structure: `xxx.yyy.zzz`)
- [ ] P2: Validate userId format (UUID, email, etc.)
- [ ] P2: Validate userRole against allowed roles list
- [ ] P2: Log context population with correlation ID
- [ ] P2: Add metrics for successful authentications
- [ ] P2: Cache verification results for performance
- [ ] P2: Add rate limiting for authentication attempts
