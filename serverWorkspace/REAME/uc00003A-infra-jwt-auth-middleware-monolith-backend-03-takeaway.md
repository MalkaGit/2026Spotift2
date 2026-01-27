# 📚 JWT Auth Middleware - Key Takeaways

---

## 🏗️ HLD (High-Level Design)

### 1. Simplicity

- ✅ **Monolith** architecture
- ❌ Refresh token **not supported**
- ✅ **Stateless authentication** (JWT tokens only)

---

### 2. Libraries Used

**`jsonwebtoken` library**

| Method | Purpose |
|--------|---------|
| `verify()` | Verifies the token |
| `sign()` | Creates the token (used in login operation) |

> **⚠️ Important**: Both `verify` and `sign` need the same `JWT_SECRET` (read from environment)

---

### 3. Tables Used - Monolith

> **No direct database access.**
> 
> Middleware only verifies JWT tokens.
> 
> User data comes from token payload (created during login).

---

### 4. Modules Used - Monolith

| Module | Purpose |
|--------|---------|
| `lib-common/app/express.middlewares` | Infrastructure middleware |
| `lib-common/utils/request-context` | Framework-agnostic context |
| `lib-common/domain/errors` | Error types |

---

### 5. API Used - Monolith

- ✅ Middleware runs on **every request** at app level
- ✅ Public routes **skip authentication**
- ✅ Protected routes **require valid JWT token**

---

### 6. HLD Flow - Monolith

**Architecture**: REST API on single server with access to all database

#### 6.1 On Login

```
Monolith server uses sign() method and JWT_SECRET to return token.
Client stores the token (with the user id, user role etc)

Note: The sign() method adds expiration details to the token
```

#### 6.2 On Any Client Request

```
Client sends request to monolith server
with authorization header: Bearer <token>
```

#### 6.3 Server Runs JWT Auth Middleware

```
(Monolith) server runs the JWT auth middleware
and uses the verify() method and JWT_SECRET to get payload
The middleware then stores the user id, user role in the request context

The verify() method will throw exception if token expires
```

#### 6.4 Public Routes

```
Routes in publicRoutes list skip JWT processing entirely
No token validation, no context population
```

---

## 🔧 LLD Details

### 7.1 Verify Method of jsonwebtoken

**Function**: `verify(token, JWT_SECRET)`

- ✅ Takes token and `JWT_SECRET`
- ✅ Verifies token signature
- ✅ Verifies token expiration
- ✅ Returns decoded payload

---

### 7.2 JWT Payload Structure

| Claim | Type | Required | Description |
|-------|------|----------|-------------|
| `sub` | string | ✅ **Yes** | The user ID |
| `iat` | number | Auto | Issued at (automatically added by jsonwebtoken) |
| `exp` | number | Auto | Expiration (automatically added by jwt) |
| `role` | string | ✅ **Yes** | User role (required for this implementation) |
| `email` | string | Optional | User email (optional) |

---

### 7.3 Request Context (Framework-Agnostic)

**Features:**
- ✅ Stores `userId` and `userRole`
- ✅ Accessible from any layer (controller, service, repository)
- ✅ Uses `requestContext.getUserId()` and `requestContext.getUserRole()`

**Benefits:**
- 🔄 Framework-independent business logic
- 🔄 Easy to test
- 🔄 Easy to migrate to microservices

---

## 🚀 Step Ahead: Microservices Migration

### Current (Monolith)

```
Client → Monolith Server
         ↓
    JWT Middleware verifies token
         ↓
    Stores userId/role in context
         ↓
    Controller/Service uses context
```

### Future (Microservices)

```
Client → API Gateway
         ↓
    API Gateway verifies JWT token
         ↓
    Adds x-user-id and x-role headers
         ↓
    Forwards to Microservice
         ↓
    Microservice middleware reads headers
         ↓
    Stores userId/role in context (same as monolith)
         ↓
    Controller/Service uses context (same code!)
```

> **✅ Key Insight**: The request context remains framework-agnostic in both cases!

---

## 💡 Key Learnings

### 🏛️ Architecture Patterns

| Pattern | Description |
|---------|-------------|
| **Separation of Concerns** | Middleware handles authentication, controllers handle business logic |
| **Framework-Agnostic Context** | Request context allows business logic to be framework-independent |
| **Secure by Default** | Routes require authentication unless explicitly marked as public |

---

### ✅ Best Practices Applied

- ✅ **Environment-based configuration** (`JWT_SECRET`)
- ✅ **Explicit error handling** (specific error messages)
- ✅ **Public routes pattern** (performance optimization)
- ✅ **Standard JWT claims** (`sub`, `iat`, `exp`, `role`)
- ✅ **Type safety** (TypeScript interfaces)

---

### 🎯 When to Use This Pattern

| Scenario | Use Case |
|----------|----------|
| ✅ | Monolith applications |
| ✅ | Stateless authentication |
| ✅ | Simple token-based auth |
| ✅ | When you need user context in controllers/services |

---

### ❌ When NOT to Use This Pattern

| Scenario | Alternative |
|----------|------------|
| ❌ | When you need token revocation | Use sessions/blacklist |
| ❌ | When you need refresh tokens | Extend with refresh token flow |
| ❌ | When you need fine-grained permissions | Add authorization layer |
| ❌ | When you need distributed sessions | Use session store |

---

## 📋 Migration Checklist (Monolith → Microservices)

- [ ] Move JWT verification to API Gateway
- [ ] Update middleware to read `x-user-id` header (microservices)
- [ ] Update public routes configuration in API Gateway
- [ ] Test token propagation across services
- [ ] Update error handling for distributed system
- [ ] Verify request context works in microservices
- [ ] Update documentation for new architecture

---

## 🎓 Summary

### ✅ What We Learned

1. **JWT middleware** provides stateless authentication
2. **Request context** keeps business logic framework-agnostic
3. **Public routes** optimize performance
4. **Standard JWT claims** ensure compatibility
5. **Type safety** prevents runtime errors

### 🔮 Future Enhancements

- 🔄 Token blacklisting for logout
- 🔄 Refresh token support
- 🔄 Token rotation
- 🔄 Rate limiting
- 🔄 Token caching for performance

---

## 📖 Related Documentation

- **Login Operation**: `uc00002-login-user-backend`
- **Get User Profile**: `uc00003B-get-user-profile-backend`
- **Middleware Implementation**: `lib-common/src/app/express.middlewares/auth.monolith.jwt.middleware.ts`

---

**🎉 You're now ready to implement JWT authentication in your monolith!**
