

### 1. Libraries Used

**`jsonwebtoken` library**

| Method       | Purpose 
| `verify()`   | Verifies the token 
| `sign()`     | Creates the token (used in login operation) 

> **⚠️ Important**: Both `verify` and `sign` need the same `JWT_SECRET` (read from environment)








### 2 HLD Flow - Monolith
**Architecture**: REST API on single server with access to all database


```
Client → Monolith Server
         ↓
    JWT Middleware verifies token
         ↓
    Stores userId/role in context
         ↓
    Controller/Service uses context
```



#### 2.1 On Login

```
Monolith server uses sign() method and JWT_SECRET to return token.
Client stores the token (with the user id, user role etc)

Note: The sign() method adds expiration details to the token
```

#### 2.2 On Any Client Request

```
Client sends request to monolith server
with authorization header: Bearer <token>
```

#### 2.3 Server Runs JWT Auth Middleware

```
(Monolith) server runs the JWT auth middleware
and uses the verify() method and JWT_SECRET to get payload
The middleware then stores the user id, user role in the request context

The verify() method will throw exception if token expires
```

#### 2.4 Public Routes

```
Routes in publicRoutes list skip JWT processing entirely
No token validation, no context population
```






### 4.about authrization in monolith

   user has in db role.  
   each action has its authorized roles.

   on monolith:
   the role is saved on token
   auth middlware saves role on context
   option1: each route execue middleware that compares the required role against the user role
   option2: service layer reads the role from the contect and compares it to the required role

   we go with option2 since it is fw-agnostic
   also, this way, all the flow in the service 
        not in some middleware
        not in some rounter


### 4.about  migration to ms from monolith - authentication


### Monolith

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

### 4.about  migration to ms from monolith - authorization 

again, we want it to be done on api gw and not on ms to save the call to ms
(cost ant time)

1. About auth middleware for monolith
    JWT auth is required by default.
    app provides the middleware list of pblic endpoints that do not requre authorization 
    (eg /health, /user/resister, /user/login)





