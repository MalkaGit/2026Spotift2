
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


=================================================================
Test1: valid toke, but role is listener and required admin
=================================================================

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


=================================================================
Test2: valid token, valid role
=================================================================
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