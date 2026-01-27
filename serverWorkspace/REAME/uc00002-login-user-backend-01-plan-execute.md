Perfect — here is your **Login User** operation, **regenerated in the exact same format, tone, and structure** as your Register User template (tables, sections, flow, tasks, MS notes).

You can paste this directly into your design doc.

---

# 🧩 Login User Operation Template (Monolith → Microservices)

---

## 1️⃣ Operation Overview (HLD)

| Field               | Value                                                               |
| ------------------- | ------------------------------------------------------------------- |
| Operation Name      | Login User                                                          |
| Module (Domain)     | User                                                                |
| Future Microservice | Auth Service / User Service                                         |
| User Type           | Public                                                              |
| Core Functionality? | ✅ Yes                                                               |
| Business Goal       | Allow a registered user to authenticate and receive an access token |

### HLD Notes

* Auth is part of the User module in the monolith.
* This operation only reads users and verifies credentials.
* No other module is involved.
* Token is stateless (JWT) and short-lived.

---

## 2️⃣ Module Scope

**Module:** user

### Owns

* Email + password verification
* Token generation
* Login flow

### Does NOT

* Know playlists, songs, likes
* Join other module tables

### Future

* Becomes Auth Service

---

## 3️⃣ Files Involved (Monolith)

```
modules/user/
 ├── user.controller.ts
 ├── user.service.ts
 ├── user.repository.ts
 ├── user.routes.ts
 └── user.types.ts
```

---

## 4️⃣ API Contract (LLD)

**File:** modules/user/user.types.ts

```ts
// Request
export interface LoginUserRequest {
  email: string;
  password: string;
}

// Response
export interface LoginUserResponse {
  accessToken: string;
  expiresIn: number; // seconds
}
```

**Endpoint**

```
POST /api/users/login
```

### Example HTTP Call

```ts
fetch('/api/users/login', {
  method: 'POST',
  body: JSON.stringify({
    email: 'a@b.com',
    password: 'secret123'
  }),
  headers: { 'Content-Type': 'application/json' }
})
.then(r => r.json())
.then((data: LoginUserResponse) => {
  console.log(data.accessToken);
});
```

---

## 5️⃣ Method Signatures

### Repository – user.repository.ts

```ts
export class UserRepository {
  async findByEmail(email: string): Promise<UserEntity | null>;
}
```

### Service – user.service.ts

```ts
export class UserService {
  async login(input: LoginUserRequest): Promise<LoginUserResponse>;
}
```

### Controller – user.controller.ts

```ts
export class UserController {
  async login(req: Request, res: Response): Promise<void>;
}
```

---

## 6️⃣ Validation Rules

### Controller (format only)

* Required: email, password
* Email format
* Password min length (basic check)

### Service (business rules)

* User must exist
* Password must match hash
* Token must be generated
* Token expiry must be returned

---

## 7️⃣ Database Usage

**Table:** users

Reads:

* email
* password_hash
* role
* id

No writes.

**Index**

```sql
CREATE UNIQUE INDEX idx_users_email ON users(email);
```

---

## 8️⃣ Service Logic Flow

**File:** user.service.ts

```
1  repository.findByEmail(email)
2  If not found → throw Unauthorized
3  Compare password with bcrypt.compare
4  Generate JWT with:
     • userId
     • role
5  Return { accessToken, expiresIn }
```

---

## 9️⃣ Phase Task List (Bottom-Up)

| Step | Task                  | File / Method         |
| ---- | --------------------- | --------------------- |
| 1    | Add JWT secret config | env                   |
| 2    | Add repository method | findByEmail           |
| 3    | Add service method    | UserService.login     |
| 4    | Add controller        | UserController.login  |
| 5    | Add route             | POST /api/users/login |
| 6    | Test with Postman     | -                     |

---

## 🔟 Planning to Switch DB (Mongo)

Same fields:

```json
{
  "_id": "uuid",
  "email": "a@b.com",
  "passwordHash": "...",
  "role": "listener",
  "createdAt": "..."
}
```

Reads by email.

---

## 11️⃣ Planning to Split to Microservices

| Scenario                      | Monolith         | Microservices         |
| ----------------------------- | ---------------- | --------------------- |
| Login                         | Read users table | Call Auth Service     |
| Token creation                | Local JWT        | JWT from Auth Service |
| Other services need user info | Direct DB read   | HTTP to Auth Service  |

---

## 12️⃣ Testing (Placeholder)

* Unit: service
* Integration: controller
* E2E: login flow

---

This is now **fully aligned** with your Register template:

* Same structure
* Same level of detail
* Same production mindset

**Next natural operations:**

* Get Profile (Authenticated)
* Change Password

Just tell me which one you want next.
