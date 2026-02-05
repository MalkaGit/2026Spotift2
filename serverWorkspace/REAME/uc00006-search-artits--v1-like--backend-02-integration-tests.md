
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











Test case0: success path - search (all defaults)
it should return first 20 artitsts ordered by name

=>see default offset,limit,order,direction are set (0,20,date,desc)
 request
GET http://localhost:3000/search/v1/artists

Header Authorization   Bearer <token:

resposne:
200ok
first 20 items sorted by names asc

[14:37:38.265] DEBUG: JWT auth - User authenticated and stored in context
    userId: "dc1bb65c-d32a-4f46-9a93-f0ba81c46ba8"
    correlationId: "9cad29c3-9812-4a2f-9205-c7deb59eabff"
[14:37:38.278] DEBUG: requireRole - request authenticated and authorized successfully
    userId: "dc1bb65c-d32a-4f46-9a93-f0ba81c46ba8"
    correlationId: "9cad29c3-9812-4a2f-9205-c7deb59eabff"
    allowedRoles: [
      "listener"
    ]
    role: "listener"
[14:37:38.281] DEBUG: searchArtists - SQL query
    userId: "dc1bb65c-d32a-4f46-9a93-f0ba81c46ba8"
    correlationId: "9cad29c3-9812-4a2f-9205-c7deb59eabff"
    sql: "SELECT a.id, a.name, a.image_url AS imageUrl, CASE WHEN l.user_id IS NULL THEN FALSE ELSE TRUE END AS liked FROM artists a LEFT JOIN likes l ON l.entity_type = ? AND l.entity_id = a.id AND l.user_id = ? WHERE a.name LIKE CONCAT('%', ?, '%') ORDER BY a.name ASC LIMIT ? OFFSET ?; -- Note: ORDER BY is required for consistent pagination. Without it, results may appear -- in different orders across page requests, causing duplicates or missed results."
    params: [
      "artist",
      "dc1bb65c-d32a-4f46-9a93-f0ba81c46ba8",
      "",
      20,
      0
    ]
[14:37:39.066] WARN: Slow HTTP request
    userId: "dc1bb65c-d32a-4f46-9a93-f0ba81c46ba8"
    correlationId: "9cad29c3-9812-4a2f-9205-c7deb59eabff"
    method: "GET"
    url: "/search/v1/artists"
    path: "/artists"
    statusCode: 200
    durationMs: 800








Test case1: success path - search paging
it should return 3th and 4th  ordered by name

=>see default offset,limit are set and paging done
 request
GET http://localhost:3000/search/v1/artists?offset=2&limit=2

Header Authorization   Bearer <token:

resposne:
200ok
first 20 items sorted by names asc

[14:42:13.932] DEBUG: JWT auth - User authenticated and stored in context
    userId: "dc1bb65c-d32a-4f46-9a93-f0ba81c46ba8"
    correlationId: "b61f4b76-0c57-4eea-aa0b-2ccdd583a91f"
[14:42:13.948] DEBUG: requireRole - request authenticated and authorized successfully
    userId: "dc1bb65c-d32a-4f46-9a93-f0ba81c46ba8"
    correlationId: "b61f4b76-0c57-4eea-aa0b-2ccdd583a91f"
    allowedRoles: [
      "listener"
    ]
    role: "listener"
[14:42:13.949] DEBUG: searchArtists - SQL query
    userId: "dc1bb65c-d32a-4f46-9a93-f0ba81c46ba8"
    correlationId: "b61f4b76-0c57-4eea-aa0b-2ccdd583a91f"
    sql: "SELECT a.id, a.name, a.image_url AS imageUrl, CASE WHEN l.user_id IS NULL THEN FALSE ELSE TRUE END AS liked FROM artists a LEFT JOIN likes l ON l.entity_type = ? AND l.entity_id = a.id AND l.user_id = ? WHERE a.name LIKE CONCAT('%', ?, '%') ORDER BY a.name ASC LIMIT ? OFFSET ?; -- Note: ORDER BY is required for consistent pagination. Without it, results may appear -- in different orders across page requests, causing duplicates or missed results."
    params: [
      "artist",
      "dc1bb65c-d32a-4f46-9a93-f0ba81c46ba8",
      "",
      2,
      2
    ]
[14:42:14.025] INFO: HTTP request completed
    userId: "dc1bb65c-d32a-4f46-9a93-f0ba81c46ba8"
    correlationId: "b61f4b76-0c57-4eea-aa0b-2ccdd583a91f"
    method: "GET"
    url: "/search/v1/artists?offset=2&limit=2"
    path: "/artists"
    statusCode: 200
    durationMs: 88






Test case2: error path - zod validation
=>negative offset and limit
 request
GET http://localhost:3000/search/v1/artists?offset=-2&limit=-2

400 bad request 
{
    "code": "REQUEST_VALIDATION_FAILED",
    "errors": [
        {
            "field": "offset",
            "code": "too_small"
        },
        {
            "field": "limit",
            "code": "too_small"
        }
    ]
}











Test cas3: success path - q (no defgault)
=>see default offset,limit,order,direction are set (0,20,date,desc)
 request
GET http://localhost:3000/search/v1/artists?q=ne&offset=0&limit=4
Header Authorization   Bearer <token:

response:
200ok
{
    "items": [
        {
            "id": "555a1e45-c1c2-4b56-a331-eba6bd9b9db8",
            "name": "Eminem",
            "imageUrl": "https://upload.wikimedia.org/wikipedia/commons/thumb/8/87/Eminem_-_Concert_for_Valor%2C_Washington%2C_D.C._Nov._11%2C_2014_%282%29_%28Cropped%29.jpg/256px-Eminem_-_Concert_for_Valor%2C_Washington%2C_D.C._Nov._11%2C_2014_%282%29_%28Cropped%29.jpg",
            "entityType": "artist",
            "liked": true
        },
        {
            "id": "777a1e45-c1c2-4b56-a331-eba6bd9b9db8",
            "name": "Imagine Dragons",
            "imageUrl": "https://upload.wikimedia.org/wikipedia/commons/thumb/4/4f/Imagine_Dragons_2017_%28cropped%29.jpg/256px-Imagine_Dragons_2017_%28cropped%29.jpg",
            "entityType": "artist",
            "liked": true
        }
    ]
}


log
[14:45:39.317] DEBUG: JWT auth - User authenticated and stored in context
    userId: "dc1bb65c-d32a-4f46-9a93-f0ba81c46ba8"
    correlationId: "bab95fa4-3a78-4a1c-ac65-70d537aed88d"
[14:45:39.326] DEBUG: requireRole - request authenticated and authorized successfully
    userId: "dc1bb65c-d32a-4f46-9a93-f0ba81c46ba8"
    correlationId: "bab95fa4-3a78-4a1c-ac65-70d537aed88d"
    allowedRoles: [
      "listener"
    ]
    role: "listener"
[14:45:39.326] DEBUG: searchArtists - SQL query
    userId: "dc1bb65c-d32a-4f46-9a93-f0ba81c46ba8"
    correlationId: "bab95fa4-3a78-4a1c-ac65-70d537aed88d"
    sql: "SELECT a.id, a.name, a.image_url AS imageUrl, CASE WHEN l.user_id IS NULL THEN FALSE ELSE TRUE END AS liked FROM artists a LEFT JOIN likes l ON l.entity_type = ? AND l.entity_id = a.id AND l.user_id = ? WHERE a.name LIKE CONCAT('%', ?, '%') ORDER BY a.name ASC LIMIT ? OFFSET ?; -- Note: ORDER BY is required for consistent pagination. Without it, results may appear -- in different orders across page requests, causing duplicates or missed results."
    params: [
      "artist",
      "dc1bb65c-d32a-4f46-9a93-f0ba81c46ba8",
      "ne",
      4,
      0
    ]
[14:45:39.382] INFO: HTTP request completed
    userId: "dc1bb65c-d32a-4f46-9a93-f0ba81c46ba8"
    correlationId: "bab95fa4-3a78-4a1c-ac65-70d537aed88d"
    method: "GET"
    url: "/search/v1/artists?q=ne&offset=0&limit=4"
    path: "/artists"
    statusCode: 200
    durationMs: 64









Test cas4: success path - q (no defgault)
=>see default offset,limit,order,direction are set (0,20,date,desc)
 request
GET http://localhost:3000/search/v1/artists?q=ne&offset=0&limit=4

response
{
    "items": [
        {
            "id": "555a1e45-c1c2-4b56-a331-eba6bd9b9db8",
            "name": "Eminem",
            "imageUrl": "https://upload.wikimedia.org/wikipedia/commons/thumb/8/87/Eminem_-_Concert_for_Valor%2C_Washington%2C_D.C._Nov._11%2C_2014_%282%29_%28Cropped%29.jpg/256px-Eminem_-_Concert_for_Valor%2C_Washington%2C_D.C._Nov._11%2C_2014_%282%29_%28Cropped%29.jpg",
            "entityType": "artist",
            "liked": true
        },
        {
            "id": "777a1e45-c1c2-4b56-a331-eba6bd9b9db8",
            "name": "Imagine Dragons",
            "imageUrl": "https://upload.wikimedia.org/wikipedia/commons/thumb/4/4f/Imagine_Dragons_2017_%28cropped%29.jpg/256px-Imagine_Dragons_2017_%28cropped%29.jpg",
            "entityType": "artist",
            "liked": true
        }
    ]
}

log
[14:45:39.317] DEBUG: JWT auth - User authenticated and stored in context
    userId: "dc1bb65c-d32a-4f46-9a93-f0ba81c46ba8"
    correlationId: "bab95fa4-3a78-4a1c-ac65-70d537aed88d"
[14:45:39.326] DEBUG: requireRole - request authenticated and authorized successfully
    userId: "dc1bb65c-d32a-4f46-9a93-f0ba81c46ba8"
    correlationId: "bab95fa4-3a78-4a1c-ac65-70d537aed88d"
    allowedRoles: [
      "listener"
    ]
    role: "listener"
[14:45:39.326] DEBUG: searchArtists - SQL query
    userId: "dc1bb65c-d32a-4f46-9a93-f0ba81c46ba8"
    correlationId: "bab95fa4-3a78-4a1c-ac65-70d537aed88d"
    sql: "SELECT a.id, a.name, a.image_url AS imageUrl, CASE WHEN l.user_id IS NULL THEN FALSE ELSE TRUE END AS liked FROM artists a LEFT JOIN likes l ON l.entity_type = ? AND l.entity_id = a.id AND l.user_id = ? WHERE a.name LIKE CONCAT('%', ?, '%') ORDER BY a.name ASC LIMIT ? OFFSET ?; -- Note: ORDER BY is required for consistent pagination. Without it, results may appear -- in different orders across page requests, causing duplicates or missed results."
    params: [
      "artist",
      "dc1bb65c-d32a-4f46-9a93-f0ba81c46ba8",
      "ne",
      4,
      0
    ]
[14:45:39.382] INFO: HTTP request completed
    userId: "dc1bb65c-d32a-4f46-9a93-f0ba81c46ba8"
    correlationId: "bab95fa4-3a78-4a1c-ac65-70d537aed88d"
    method: "GET"
    url: "/search/v1/artists?q=ne&offset=0&limit=4"
    path: "/artists"
    statusCode: 200
    durationMs: 64




Test cas5: success path - q (no defgault)
=>see default offset,limit,order,direction are set (0,20,date,desc)
 request
GET http://localhost:3000/search/v1/artists?q=ne&offset=1&limit=4




Test cas6: success path - q (no defgault)
=>see default offset,limit,order,direction are set (0,20,date,desc)
 request
GET http://localhost:3000/search/v1/artists?q=ne&offset=2&limit=4

response:
{
    "items": []
}



Test cas7: error path - invalid token

401 unathorized 
{
    "code": "UNAUTHORIZED",
    "message": "Invalid token"
}


Test case8: token expored


Test case9: invalid rolde
    required: artist
    try with other


































Test case6: error path - wrong token

 request
GET http://localhost:3000/users/me/likes?sort=name&offset=4&limit=2&direction=asc
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
[17:09:35.985] INFO: HTTP request completed
    userId: "dc1bb65c-d32a-4f46-9a93-f0ba81c46ba8"
    correlationId: "4d5130f4-256a-4178-a6c6-26cce4143b7e"
    method: "GET"
    url: "/users/me/likes?sort=namexx&offset=-4&limit=-2&direction=ascxx"
    path: "/me/likes"
    statusCode: 400
    durationMs: 3
[17:11:29.638] WARN: Domain error
    correlationId: "2a169837-f4c8-4203-9cbc-db43c722706c"
    method: "GET"
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