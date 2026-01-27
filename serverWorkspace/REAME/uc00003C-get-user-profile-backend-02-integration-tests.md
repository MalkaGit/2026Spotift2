
============================================
testing the authorization helper: requireRole
============================================

usagge example:
export async function getUserProfile(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {

    //example of using requireRole utility function
    //can be called in any layer, usually in the service layer
    requireRole(['admin']);
    
    // Get userId and role from request context (set by JWT auth middleware)
    const userId = requestContext.getUserId();
    const userRole = requestContext.getUserRole();
    
    // Log to verify JWT middleware populated context correctly
    logger.info("getUserProfile - JWT context verified", {
      userId,
      userRole,
    }); 
    
    // Return response with context data for testing
    res.status(200).json({
      userId,
      userRole,
    });
  } catch (err) {
    next(err);
  }
}



Test1: valid toke, but role is listener and required admin


GET http://localhost:3000/users/me
header:
   Authorization    Bearer <toeken>

response
403 Forbidden
{
    "code": "FORBIDDEN",
    "message": "Access denied. Required role: admin. Current role: listener."
}


logs
[17:03:46.916] INFO: Server running on port 3000
[17:04:13.835] DEBUG: JWT auth - User authenticated and stored in context
    userId: "47e3f0fd-ea37-4b45-9894-b9779bd670df"
    correlationId: "87af5faa-11ae-4633-af1b-d6e7accbc277"
[17:04:13.846] WARN: Domain error
    userId: "47e3f0fd-ea37-4b45-9894-b9779bd670df"
    correlationId: "87af5faa-11ae-4633-af1b-d6e7accbc277"
    method: "GET"
    path: "/users/me"
    code: "FORBIDDEN"
    message: "Access denied. Required role: admin. Current role: listener."
[17:04:13.873] INFO: HTTP request completed
    userId: "47e3f0fd-ea37-4b45-9894-b9779bd670df"
    correlationId: "87af5faa-11ae-4633-af1b-d6e7accbc277"
    method: "GET"
    url: "/users/me"
    path: "/me"
    statusCode: 403
    durationMs: 37









Test2: valid token, valid role

change code to
  requireRole(['listener']);

  try again sending the same reuest with same user (listiner)


  response
  200 ok
  {
    "userId": "47e3f0fd-ea37-4b45-9894-b9779bd670df",
    "userRole": "listener"
}

[17:11:21.141] INFO: Server running on port 3000
[17:11:29.518] DEBUG: JWT auth - User authenticated and stored in context
    userId: "47e3f0fd-ea37-4b45-9894-b9779bd670df"
    correlationId: "f7fc079f-e2c6-4836-9ca9-95113ed290b9"
[17:11:29.521] INFO: getUserProfile - JWT context verified
    userId: "47e3f0fd-ea37-4b45-9894-b9779bd670df"
    correlationId: "f7fc079f-e2c6-4836-9ca9-95113ed290b9"
    userRole: "listener"
[17:11:29.543] INFO: HTTP request completed
    userId: "47e3f0fd-ea37-4b45-9894-b9779bd670df"
    correlationId: "f7fc079f-e2c6-4836-9ca9-95113ed290b9"
    method: "GET"
    url: "/users/me"
    path: "/me"
    statusCode: 200
    durationMs: 24


============================================
final tests
============================================
test case1: no authorization header
request
GET http://localhost:3000/users/me

response
401 Unauthorized
{
    "code": "UNAUTHORIZED",
    "message": "Authentication required. Bearer token not found in Authorization header."
}
log
[19:16:26.246] INFO: Server running on port 3000
[19:16:53.657] WARN: Domain error
    correlationId: "14682fac-ba57-4a6d-bb2e-de684ced0767"
    method: "GET"
    path: "/users/me"
    code: "UNAUTHORIZED"
    message: "Authentication required. Bearer token not found in Authorization header."






test case2: login to get token and call the get /me

POST http://localhost:3000/users/login
Content-Type application/json
body:
{
    "email": "email4@gmail.com",
    "password":"aA123456789!"
}
response:
200 OK
{
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI0N2UzZjBmZC1lYTM3LTRiNDUtOTg5NC1iOTc3OWJkNjcwZGYiLCJlbWFpbCI6ImVtYWlsNEBnbWFpbC5jb20iLCJyb2xlIjoibGlzdGVuZXIiLCJpYXQiOjE3Njk1NDE1NDAsImV4cCI6MTc2OTU0NTE0MCwiYXVkIjoic3BvdGlmeS1hcHAtdXNlcnMiLCJpc3MiOiJzcG90aWZ5LWFwcCJ9.VG_PKht14ltakJkY8Iwx--SakFltj4Wr2SW7c0fJTk8",
    "expiresIn": 3600
}




request
GET http://localhost:3000/users/me
Header Authorization   Bearer <token:

response:
200 OK
{
    "email": "email4@gmail.com",
    "role": "listener",
    "createdAt": "2026-01-25T11:28:40.000Z"
}



log 
[19:20:45.843] DEBUG: JWT auth - User authenticated and stored in context
    userId: "47e3f0fd-ea37-4b45-9894-b9779bd670df"
    correlationId: "b7a1e06e-36c7-43ed-9a97-629850ee9fbe"
[19:20:45.846] DEBUG: findById - SQL query
    userId: "47e3f0fd-ea37-4b45-9894-b9779bd670df"
    correlationId: "b7a1e06e-36c7-43ed-9a97-629850ee9fbe"
    sql: "SELECT id, email, password_hash, role, created_at FROM users WHERE id = ? LIMIT 1"
    params: [
      "47e3f0fd-ea37-4b45-9894-b9779bd670df"
    ]
[19:20:46.441] WARN: Slow HTTP request
    userId: "47e3f0fd-ea37-4b45-9894-b9779bd670df"
    correlationId: "b7a1e06e-36c7-43ed-9a97-629850ee9fbe"
    method: "GET"
    url: "/users/me"
    path: "/me"
    statusCode: 200
    durationMs: 596










test case3: as above but wrong token

result:
401  Unauthorized 
{
    "code": "UNAUTHORIZED",
    "message": "Invalid token"
}







test case4: token expired

request
GET http://localhost:3000/users/me
Header Authorization   Bearer <token:

response
401 Unauthorized
{
    "code": "UNAUTHORIZED",
    "message": "Token has expired"
}


log
[19:14:33.509] INFO: Server running on port 3000
[19:14:37.741] WARN: Domain error
    correlationId: "a3d49567-438d-4aed-8a30-9608a94762ec"
    method: "GET"
    path: "/users/me"
    code: "UNAUTHORIZED"
    message: "Token has expired"