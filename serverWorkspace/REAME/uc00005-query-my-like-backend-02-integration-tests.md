
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











Test case1: success path - get
=>see default offset,limit,order,direction are set (0,20,date,desc)
 request
GET http://localhost:3000/users/me/likes
Header Authorization   Bearer <token:

response:
DROP TABLE IF EXISTS playlists;

CREATE TABLE playlists (
  id CHAR(36) NOT NULL PRIMARY KEY,
   name VARCHAR(255) NOT NULL
) ENGINE=InnoDB;
 

log 
[dotenv@17.2.3] injecting env (0) from .env -- tip: 🔑 add access controls to secrets: https://dotenvx.com/ops
[16:33:38.289] INFO: Server running on port 3000
[16:33:40.682] DEBUG: JWT auth - User authenticated and stored in context
    userId: "dc1bb65c-d32a-4f46-9a93-f0ba81c46ba8"
    correlationId: "11eb8d90-38b3-4dd5-a51b-7ed48e44a519"
[16:33:40.689] DEBUG: requireRole - request authenticated and authorized successfully
    userId: "dc1bb65c-d32a-4f46-9a93-f0ba81c46ba8"
    correlationId: "11eb8d90-38b3-4dd5-a51b-7ed48e44a519"
    allowedRoles: [
      "listener"
    ]
    role: "listener"
[16:33:40.690] DEBUG: queryLikesByUser - SQL query
    userId: "dc1bb65c-d32a-4f46-9a93-f0ba81c46ba8"
    correlationId: "11eb8d90-38b3-4dd5-a51b-7ed48e44a519"
    sql: "\n    SELECT \n      l.id,\n      l.entity_type AS likedEntityType,\n      l.entity_id AS likedEntityId,\n      COALESCE(artists.name, albums.name, playlists.name) AS likedEntityName,\n      l.created_at AS createdAt\n    FROM likes l\n    LEFT JOIN artists ON l.entity_type = 'artist' AND l.entity_id = artists.id\n    LEFT JOIN albums ON l.entity_type = 'album' AND l.entity_id = albums.id\n    LEFT JOIN playlists ON l.entity_type = 'playlist' AND l.entity_id = playlists.id\n    WHERE l.user_id = ?\n      AND COALESCE(artists.name, albums.name, playlists.name) IS NOT NULL\n    ORDER BY l.created_at DESC\n    LIMIT ? OFFSET ?\n  "
    params: [
      "dc1bb65c-d32a-4f46-9a93-f0ba81c46ba8",
      20,
      0
    ]
[16:33:40.871] INFO: HTTP request completed
    userId: "dc1bb65c-d32a-4f46-9a93-f0ba81c46ba8"
    correlationId: "11eb8d90-38b3-4dd5-a51b-7ed48e44a519"
    method: "GET"
    url: "/users/me/likes"
    path: "/me/likes"
    statusCode: 200
    durationMs: 188











Test case2: as above - sort name (desc)
http://localhost:3000/users/me/likes?sort=name
=>see default offset,limit,order,direction are set (0,20,name,desc)

output 
200 ok
ordered by name desc
    "The Weeknd"
    "Taylor Swift"
    "Rihanna",
    "Imagine Dragons"
    "Eminem",
     "Ed Sheeran",
    "Drake",
     "Beyoncé",
     "Ariana Grande",


log
[16:41:04.425] INFO: Server running on port 3000
[16:41:07.434] DEBUG: JWT auth - User authenticated and stored in context
    userId: "dc1bb65c-d32a-4f46-9a93-f0ba81c46ba8"
    correlationId: "a11e9b77-2d16-4f04-a714-4070ab4b55cc"
[16:41:07.464] DEBUG: requireRole - request authenticated and authorized successfully
    userId: "dc1bb65c-d32a-4f46-9a93-f0ba81c46ba8"
    correlationId: "a11e9b77-2d16-4f04-a714-4070ab4b55cc"
    allowedRoles: [
      "listener"
    ]
    role: "listener"
[16:41:07.465] DEBUG: queryLikesByUser - SQL query
    userId: "dc1bb65c-d32a-4f46-9a93-f0ba81c46ba8"
    correlationId: "a11e9b77-2d16-4f04-a714-4070ab4b55cc"
    sql: "\n    SELECT \n      l.id,\n      l.entity_type AS likedEntityType,\n      l.entity_id AS likedEntityId,\n      COALESCE(artists.name, albums.name, playlists.name) AS likedEntityName,\n      l.created_at AS createdAt\n    FROM likes l\n    LEFT JOIN artists ON l.entity_type = 'artist' AND l.entity_id = artists.id\n    LEFT JOIN albums ON l.entity_type = 'album' AND l.entity_id = albums.id\n    LEFT JOIN playlists ON l.entity_type = 'playlist' AND l.entity_id = playlists.id\n    WHERE l.user_id = ?\n      AND COALESCE(artists.name, albums.name, playlists.name) IS NOT NULL\n    ORDER BY COALESCE(artists.name, albums.name, playlists.name) DESC\n    LIMIT ? OFFSET ?\n  "
    params: [
      "dc1bb65c-d32a-4f46-9a93-f0ba81c46ba8",
      20,
      0
    ]
[16:41:07.821] INFO: HTTP request completed
    userId: "dc1bb65c-d32a-4f46-9a93-f0ba81c46ba8"
    correlationId: "a11e9b77-2d16-4f04-a714-4070ab4b55cc"
    method: "GET"
    url: "/users/me/likes?sort=name"
    path: "/me/likes"
    statusCode: 200
    durationMs: 386













Test case3: as above - sort name (desc), offset=4,limit=2
http://localhost:3000/users/me/likes?sort=name&offset=4&limit=2
=>see default offset,limit,order,direction are set (4,2,name,desc)

result
200ok

{
    "items": [
        {
            "id": "0e4f83b7-0360-4860-b941-3c18f13361e5",
            "likedEntityType": "artist",
            "likedEntityId": "555a1e45-c1c2-4b56-a331-eba6bd9b9db8",
            "likedEntityName": "Eminem",
            "createdAt": "2026-02-01T16:21:49.000Z"
        },
        {
            "id": "ee57c56a-ac1d-4b91-8b36-9994596cd208",
            "likedEntityType": "artist",
            "likedEntityId": "333a1e45-c1c2-4b56-a331-eba6bd9b9db8",
            "likedEntityName": "Ed Sheeran",
            "createdAt": "2026-02-01T16:19:53.000Z"
        }
    ]
}

logs
[16:51:49.241] DEBUG: JWT auth - User authenticated and stored in context
    userId: "dc1bb65c-d32a-4f46-9a93-f0ba81c46ba8"
    correlationId: "b637fa78-40f3-46de-ba5b-e6ee3afe8fda"
[16:51:49.242] DEBUG: requireRole - request authenticated and authorized successfully
    userId: "dc1bb65c-d32a-4f46-9a93-f0ba81c46ba8"
    correlationId: "b637fa78-40f3-46de-ba5b-e6ee3afe8fda"
    allowedRoles: [
      "listener"
    ]
    role: "listener"
[16:51:49.243] DEBUG: queryLikesByUser - SQL query
    userId: "dc1bb65c-d32a-4f46-9a93-f0ba81c46ba8"
    correlationId: "b637fa78-40f3-46de-ba5b-e6ee3afe8fda"
    sql: "\n    SELECT \n      l.id,\n      l.entity_type AS likedEntityType,\n      l.entity_id AS likedEntityId,\n      COALESCE(artists.name, albums.name, playlists.name) AS likedEntityName,\n      l.created_at AS createdAt\n    FROM likes l\n    LEFT JOIN artists ON l.entity_type = 'artist' AND l.entity_id = artists.id\n    LEFT JOIN albums ON l.entity_type = 'album' AND l.entity_id = albums.id\n    LEFT JOIN playlists ON l.entity_type = 'playlist' AND l.entity_id = playlists.id\n    WHERE l.user_id = ?\n      AND COALESCE(artists.name, albums.name, playlists.name) IS NOT NULL\n    ORDER BY COALESCE(artists.name, albums.name, playlists.name) DESC\n    LIMIT ? OFFSET ?\n  "
    params: [
      "dc1bb65c-d32a-4f46-9a93-f0ba81c46ba8",
      2,
      4
    ]
[16:51:49.289] INFO: HTTP request completed
    userId: "dc1bb65c-d32a-4f46-9a93-f0ba81c46ba8"
    correlationId: "b637fa78-40f3-46de-ba5b-e6ee3afe8fda"
    method: "GET"
    url: "/users/me/likes?sort=name&offset=4&limit=2"
    path: "/me/likes"
    statusCode: 200
    durationMs: 47







Test case4: as above - sort name (asc), offset=4,limit=2
http://localhost:3000/users/me/likes?sort=name&offset=4&limit=2&direction=asc
=>see default offset,limit,order,direction are set (4,2,name,desc)


result
{
    "items": [
        {
            "id": "0e4f83b7-0360-4860-b941-3c18f13361e5",
            "likedEntityType": "artist",
            "likedEntityId": "555a1e45-c1c2-4b56-a331-eba6bd9b9db8",
            "likedEntityName": "Eminem",
            "createdAt": "2026-02-01T16:21:49.000Z"
        },
        {
            "id": "edb7cec1-13f3-4e98-9813-1dce7800b298",
            "likedEntityType": "artist",
            "likedEntityId": "777a1e45-c1c2-4b56-a331-eba6bd9b9db8",
            "likedEntityName": "Imagine Dragons",
            "createdAt": "2026-02-01T16:22:58.000Z"
        }
    ]
}

log
[16:56:05.561] DEBUG: JWT auth - User authenticated and stored in context
    userId: "dc1bb65c-d32a-4f46-9a93-f0ba81c46ba8"
    correlationId: "f9ff332f-58d7-4f7c-9a69-6b4d3ee7944e"
[16:56:05.561] DEBUG: requireRole - request authenticated and authorized successfully
    userId: "dc1bb65c-d32a-4f46-9a93-f0ba81c46ba8"
    correlationId: "f9ff332f-58d7-4f7c-9a69-6b4d3ee7944e"
    allowedRoles: [
      "listener"
    ]
    role: "listener"
[16:56:05.562] DEBUG: queryLikesByUser - SQL query
    userId: "dc1bb65c-d32a-4f46-9a93-f0ba81c46ba8"
    correlationId: "f9ff332f-58d7-4f7c-9a69-6b4d3ee7944e"
    sql: "\n    SELECT \n      l.id,\n      l.entity_type AS likedEntityType,\n      l.entity_id AS likedEntityId,\n      COALESCE(artists.name, albums.name, playlists.name) AS likedEntityName,\n      l.created_at AS createdAt\n    FROM likes l\n    LEFT JOIN artists ON l.entity_type = 'artist' AND l.entity_id = artists.id\n    LEFT JOIN albums ON l.entity_type = 'album' AND l.entity_id = albums.id\n    LEFT JOIN playlists ON l.entity_type = 'playlist' AND l.entity_id = playlists.id\n    WHERE l.user_id = ?\n      AND COALESCE(artists.name, albums.name, playlists.name) IS NOT NULL\n    ORDER BY COALESCE(artists.name, albums.name, playlists.name) ASC\n    LIMIT ? OFFSET ?\n  "
    params: [
      "dc1bb65c-d32a-4f46-9a93-f0ba81c46ba8",
      2,
      4
    ]
[16:56:05.570] INFO: HTTP request completed
    userId: "dc1bb65c-d32a-4f46-9a93-f0ba81c46ba8"
    correlationId: "f9ff332f-58d7-4f7c-9a69-6b4d3ee7944e"
    method: "GET"
    url: "/users/me/likes?sort=name&offset=4&limit=2&direction=asc"
    path: "/me/likes"
    statusCode: 200
    durationMs: 9





























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










Test case5: error path -  structureal valiation 
    offset and limit are negative and direction and sort not valid

GET http://localhost:3000/users/me/likes?sort=namexx&offset=-4&limit=-2&direction=ascxx

response: 
400 bad request
{
    "code": "REQUEST_VALIDATION_FAILED",
    "errors": [
        {
            "field": "sort",
            "code": "invalid"
        },
        {
            "field": "direction",
            "code": "invalid"
        },
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

log
[17:08:27.101] DEBUG: JWT auth - User authenticated and stored in context
    userId: "dc1bb65c-d32a-4f46-9a93-f0ba81c46ba8"
    correlationId: "af011ecb-04a7-479f-839d-bc70ee16b371"
[17:08:27.104] WARN: Request validation failed
    userId: "dc1bb65c-d32a-4f46-9a93-f0ba81c46ba8"
    correlationId: "af011ecb-04a7-479f-839d-bc70ee16b371"
    method: "GET"
    path: "/users/me/likes"
    errors: [
      {
        "field": "direction",
        "code": "invalid"
      },
      {
        "field": "offset",
        "code": "too_small"
      },
      {
        "field": "limit",
        "code": "too_small"
      }
    ]
[17:08:27.105] INFO: HTTP request completed
    userId: "dc1bb65c-d32a-4f46-9a93-f0ba81c46ba8"
    correlationId: "af011ecb-04a7-479f-839d-bc70ee16b371"
    method: "GET"
    url: "/users/me/likes?sort=name&offset=-4&limit=-2&direction=ascxx"
    path: "/me/likes"
    statusCode: 400
    durationMs: 4



























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