TODO: go over
### 1. Simplicity

- ✅ **Monolith** architecture
- ❌ Refresh token **not supported**
- ✅ **Stateless authentication** (JWT tokens only)

---



### 3. Tables Used - Monolith

> **No direct database access.**
> 
> Middleware only verifies JWT tokens.
> 
> User data comes from token payload (created during login).



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

---

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

