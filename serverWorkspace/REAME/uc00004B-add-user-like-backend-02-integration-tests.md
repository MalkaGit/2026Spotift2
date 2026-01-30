
prep: login to get token 

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
    "accessToken": "xxx",
    "expiresIn": 3600
}






Test case1: success path - add like to artist 
 request
POST http://localhost:3000/users/me/likes
Header Authorization   Bearer <token:
Content-Type           application/json
{
    "entityType": "artist",
    "entityId":"000f0e50-c1c2-4b56-a331-eba6bd9b9db9"
}

response:
201 CREATED
{
    "id": "57391e3d-a441-4078-9c33-ef3b4e4ed13c"
}


log 
[19:01:22.127] INFO: Server running on port 3000
[19:01:22.829] DEBUG: JWT auth - User authenticated and stored in context
    userId: "47e3f0fd-ea37-4b45-9894-b9779bd670df"
    correlationId: "2449a048-443e-47c2-bba7-9291154c4f75"
[19:01:22.838] DEBUG: requireAuthenticated - user authenticated successfully
    userId: "47e3f0fd-ea37-4b45-9894-b9779bd670df"
    correlationId: "2449a048-443e-47c2-bba7-9291154c4f75"
[19:01:22.838] DEBUG: requireRole - request authorized successfully
    userId: "47e3f0fd-ea37-4b45-9894-b9779bd670df"
    correlationId: "2449a048-443e-47c2-bba7-9291154c4f75"
    allowedRoles: [
      "listener"
    ]
    role: "listener"
[19:01:22.839] DEBUG: exists - SQL query
    userId: "47e3f0fd-ea37-4b45-9894-b9779bd670df"
    correlationId: "2449a048-443e-47c2-bba7-9291154c4f75"
    sql: "SELECT 1 FROM user_likes WHERE user_id = ? AND entity_type = ? AND entity_id = ? LIMIT 1"
    params: [
      "47e3f0fd-ea37-4b45-9894-b9779bd670df",
      "artist",
      "000f0e50-c1c2-4b56-a331-eba6bd9b9db9"
    ]
[19:01:23.517] DEBUG: addLike - SQL query
    userId: "47e3f0fd-ea37-4b45-9894-b9779bd670df"
    correlationId: "2449a048-443e-47c2-bba7-9291154c4f75"
    sql: "INSERT INTO user_likes (id, user_id, entity_type, entity_id, created_at)\n   VALUES (?, ?, ?, ?, NOW())"
    params: [
      "57391e3d-a441-4078-9c33-ef3b4e4ed13c",
      "47e3f0fd-ea37-4b45-9894-b9779bd670df",
      "artist",
      "000f0e50-c1c2-4b56-a331-eba6bd9b9db9"
    ]
[19:01:23.623] WARN: Slow HTTP request
    userId: "47e3f0fd-ea37-4b45-9894-b9779bd670df"
    correlationId: "2449a048-443e-47c2-bba7-9291154c4f75"
    method: "POST"
    url: "/users/me/likes"
    path: "/me/likes"
    statusCode: 201
    durationMs: 793





Test case2: error path - 
entity type:
value is not artist, album, playlsist

requst:
re-send the same request with wrong entity type

response: 
400 BAD REQUEST

{
    "code": "REQUEST_VALIDATION_FAILED",
    "errors": [
        {
            "field": "entityType",
            "code": "invalid"
        }
    ]
}







Test case3: error path - 
entityId: is not uuid

 request
POST http://localhost:3000/users/me/likes
Header Authorization   Bearer <token:
Content-Type           application/json
{
    "entityType": "artist",
    "entityId":"xxxxx000f0e50-c1c2-4b56-a331-eba6bd9b9db9"
}

response:
400 BAD REQUEST
{
    "code": "REQUEST_VALIDATION_FAILED",
    "errors": [
        {
            "field": "entityId",
            "code": "invalid_string"
        }
    ]
}



log:
[19:12:37.957] INFO: Server running on port 3000
[19:13:01.899] DEBUG: JWT auth - User authenticated and stored in context
    userId: "47e3f0fd-ea37-4b45-9894-b9779bd670df"
    correlationId: "ed191dbd-ec40-44f3-8226-56e31a07b1f1"
[19:13:01.925] WARN: Request validation failed
    userId: "47e3f0fd-ea37-4b45-9894-b9779bd670df"
    correlationId: "ed191dbd-ec40-44f3-8226-56e31a07b1f1"
    method: "POST"
    path: "/users/me/likes"
    errors: [
      {
        "field": "entityId",
        "code": "invalid_string"
      }
    ]
[19:13:01.953] INFO: HTTP request completed
    userId: "47e3f0fd-ea37-4b45-9894-b9779bd670df"
    correlationId: "ed191dbd-ec40-44f3-8226-56e31a07b1f1"
    method: "POST"
    url: "/users/me/likes"
    path: "/me/likes"
    statusCode: 400
    durationMs: 50










Test case4: 
entity id
entity id is uuid 
that there is no entity (artist) with that id 

request:
 request
POST http://localhost:3000/users/me/likes
Header Authorization   Bearer <token:
Content-Type           application/json
{
    "entityType": "artist",
    "entityId":"000f0e50-c1c2-4b56-a331-eba6bd9b9d7"
}

response: 404 not found
{
    "code": "LIKES_ENTITY_NOT_FOUND",
    "message": "artist with id 000f0e50-c1c2-4b56-a331-eba6bd9b9db8 not found"
}


log
[20:29:46.071] INFO: Server running on port 3000
[20:30:06.607] DEBUG: JWT auth - User authenticated and stored in context
    userId: "47e3f0fd-ea37-4b45-9894-b9779bd670df"
    correlationId: "1f3b1438-eb2a-4729-9c3f-67c1abfad02e"
[20:30:06.616] DEBUG: requireAuthenticated - user authenticated successfully
    userId: "47e3f0fd-ea37-4b45-9894-b9779bd670df"
    correlationId: "1f3b1438-eb2a-4729-9c3f-67c1abfad02e"
[20:30:06.616] DEBUG: requireRole - request authorized successfully
    userId: "47e3f0fd-ea37-4b45-9894-b9779bd670df"
    correlationId: "1f3b1438-eb2a-4729-9c3f-67c1abfad02e"
    allowedRoles: [
      "listener"
    ]
    role: "listener"
[20:30:06.618] DEBUG: entityExists - SQL query
    userId: "47e3f0fd-ea37-4b45-9894-b9779bd670df"
    correlationId: "1f3b1438-eb2a-4729-9c3f-67c1abfad02e"
    sql: "SELECT 1 FROM artists WHERE id = ? LIMIT 1"
    params: [
      "000f0e50-c1c2-4b56-a331-eba6bd9b9db8"
    ]
    entityType: "artist"
[20:30:07.259] WARN: Domain error
    userId: "47e3f0fd-ea37-4b45-9894-b9779bd670df"
    correlationId: "1f3b1438-eb2a-4729-9c3f-67c1abfad02e"
    method: "POST"
    path: "/users/me/likes"
    code: "LIKES_ENTITY_NOT_FOUND"
    message: "artist with id 000f0e50-c1c2-4b56-a331-eba6bd9b9db8 not found"
[20:30:07.277] WARN: Slow HTTP request
    userId: "47e3f0fd-ea37-4b45-9894-b9779bd670df"
    correlationId: "1f3b1438-eb2a-4729-9c3f-67c1abfad02e"
    method: "POST"
    url: "/users/me/likes"
    path: "/me/likes"
    statusCode: 404
    durationMs: 668










Test case5: error path - 
user already liked that artist
Note: in db there is foriegn key but we want to return clear error code instead throwing db exception and returning server error
requst:
re-send the same request

response: 
409 conflict

{
    "code": "LIKES_ALREADY_LIKED",
    "message": "User has already liked this artist"
}























Test case6: error path - wrong token

 request
POST http://localhost:3000/users/me/likes
Header Authorization   Bearer <token:
Content-Type           application/json
{
    "entityType": "artist",
    "entityId":"000f0e50-c1c2-4b56-a331-eba6bd9b9db9"
}


response: 
401 unauthorized
{
    "code": "UNAUTHORIZED",
    "message": "Invalid token"
}

log:
[19:13:58.539] INFO: Server running on port 3000
[19:14:28.644] WARN: Domain error
    correlationId: "d727890d-7ad1-4442-9410-69ea7e2e5764"
    method: "POST"
    path: "/users/me/likes"
    code: "UNAUTHORIZED"
    message: "Invalid token"






Test case8: token expired -as before

Test case9: user with permission that is not listiner

eg: chage require-role code


response:
403 Forbidden
{
    "code": "FORBIDDEN",
    "message": "Access denied. Required role: listener. Current role: admin."
}