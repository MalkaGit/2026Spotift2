
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












Test case1: error - artist doest not exit
 request
DELETE http://localhost:3000/artists/d03c3755-46f7-4498-8ec5-bc9ace43ac42
Header Authorization   Bearer <token:

response:
400 NOT FOUND
{
    "code": "ARTIST_NOT_FOUND",
    "message": "Artist with id d03c3755-46f7-4498-8ec5-bc9ace43ac42 not found"
}



[17:32:42.311] INFO: Server running on port 3000
[17:32:47.263] DEBUG: JWT auth - User authenticated and stored in context
    userId: "fa49cd77-1bc1-49f1-a73e-14ba73cf9d63"
    correlationId: "8674a398-d71f-4cb7-a435-ebf16543da45"
[17:32:47.265] DEBUG: requireAuthenticated - user authenticated successfully
    userId: "fa49cd77-1bc1-49f1-a73e-14ba73cf9d63"
    correlationId: "8674a398-d71f-4cb7-a435-ebf16543da45"
[17:32:47.265] DEBUG: artists.findById - SQL query
    userId: "fa49cd77-1bc1-49f1-a73e-14ba73cf9d63"
    correlationId: "8674a398-d71f-4cb7-a435-ebf16543da45"
    sql: "SELECT id, user_id, name, bio, image_url, created_at FROM artists WHERE id = ? LIMIT 1"
    params: [
      "555a1e45-c1c2-4b56-a331-eba6bd9b9db6"
    ]
[17:32:47.306] INFO: HTTP request completed
    userId: "fa49cd77-1bc1-49f1-a73e-14ba73cf9d63"
    correlationId: "8674a398-d71f-4cb7-a435-ebf16543da45"
    method: "DELETE"
    url: "/artists/555a1e45-c1c2-4b56-a331-eba6bd9b9db6"
    path: "/:id"
    statusCode: 404
    durationMs: 43
















Test case2: error - attemting to delete artitst that  i did not create


requst 
DELETE http://localhost:3000/artists/aaa1e450-c1c2-4b56-a331-eba6bd9b9db8
Header Authorization   Bearer <token:

output 
403 forbidden
{
    "code": "FORBIDDEN",
    "message": "You can only delete artists you manage."
}


log


[17:33:50.581] INFO: Server running on port 3000
[17:33:55.872] DEBUG: JWT auth - User authenticated and stored in context
    userId: "fa49cd77-1bc1-49f1-a73e-14ba73cf9d63"
    correlationId: "737f3d3f-9871-45d5-bbd0-c916e060f3f6"
[17:33:55.873] DEBUG: requireAuthenticated - user authenticated successfully
    userId: "fa49cd77-1bc1-49f1-a73e-14ba73cf9d63"
    correlationId: "737f3d3f-9871-45d5-bbd0-c916e060f3f6"
[17:33:55.873] DEBUG: artists.findById - SQL query
    userId: "fa49cd77-1bc1-49f1-a73e-14ba73cf9d63"
    correlationId: "737f3d3f-9871-45d5-bbd0-c916e060f3f6"
    sql: "SELECT id, user_id, name, bio, image_url, created_at FROM artists WHERE id = ? LIMIT 1"
    params: [
      "555a1e45-c1c2-4b56-a331-eba6bd9b9db8"
    ]
[17:33:55.909] WARN: Domain error
    userId: "fa49cd77-1bc1-49f1-a73e-14ba73cf9d63"
    correlationId: "737f3d3f-9871-45d5-bbd0-c916e060f3f6"
    method: "DELETE"
    path: "/artists/555a1e45-c1c2-4b56-a331-eba6bd9b9db8"
    code: "FORBIDDEN"
    message: "You can only delete artists you manage."
[17:33:55.912] INFO: HTTP request completed
    userId: "fa49cd77-1bc1-49f1-a73e-14ba73cf9d63"
    correlationId: "737f3d3f-9871-45d5-bbd0-c916e060f3f6"
    method: "DELETE"
    url: "/artists/555a1e45-c1c2-4b56-a331-eba6bd9b9db8"
    path: "/:id"
    statusCode: 403
    durationMs: 40













    

Test case4: SUCCESS PATH


requst 
DELETE http://localhost:3000/artists/aaa1e450-c1c2-4b56-a331-eba6bd9b9db8
Header Authorization   Bearer <token:

output 
204 no content


[17:35:21.568] DEBUG: JWT auth - User authenticated and stored in context
    userId: "d03c3755-46f7-4498-8ec5-bc9ace43ac42"
    correlationId: "d0ba303b-ee7e-4e50-9b98-e5ab65b73a96"
[17:35:21.568] DEBUG: requireAuthenticated - user authenticated successfully
    userId: "d03c3755-46f7-4498-8ec5-bc9ace43ac42"
    correlationId: "d0ba303b-ee7e-4e50-9b98-e5ab65b73a96"

[17:35:21.568] DEBUG: artists.findById - SQL query
    userId: "d03c3755-46f7-4498-8ec5-bc9ace43ac42"
    correlationId: "d0ba303b-ee7e-4e50-9b98-e5ab65b73a96"
    sql: "SELECT id, user_id, name, bio, image_url, created_at FROM artists WHERE id = ? LIMIT 1"
    params: [
      "555a1e45-c1c2-4b56-a331-eba6bd9b9db8"
    ]
[17:35:21.579] DEBUG: likes.deleteByEntity - SQL query
    userId: "d03c3755-46f7-4498-8ec5-bc9ace43ac42"
    correlationId: "d0ba303b-ee7e-4e50-9b98-e5ab65b73a96"
    sql: "DELETE FROM likes WHERE entity_type = ? AND entity_id = ?"
    params: [
      "artist",
      "555a1e45-c1c2-4b56-a331-eba6bd9b9db8"
    ]
[17:35:21.581] DEBUG: artists.deleteByIdCascade - SQL query
    userId: "d03c3755-46f7-4498-8ec5-bc9ace43ac42"
    correlationId: "d0ba303b-ee7e-4e50-9b98-e5ab65b73a96"
    sql: "DELETE FROM artists WHERE id = ?"
    params: [
      "555a1e45-c1c2-4b56-a331-eba6bd9b9db8"
    ]
[17:35:21.590] DEBUG: artists.deleteByIdCascade - transaction committed
    userId: "d03c3755-46f7-4498-8ec5-bc9ace43ac42"
    correlationId: "d0ba303b-ee7e-4e50-9b98-e5ab65b73a96"

[17:35:21.590] DEBUG: artists.deleteByIdCascade - connection released
    userId: "d03c3755-46f7-4498-8ec5-bc9ace43ac42"
    correlationId: "d0ba303b-ee7e-4e50-9b98-e5ab65b73a96"
    
[17:35:21.590] INFO: HTTP request completed
    userId: "d03c3755-46f7-4498-8ec5-bc9ace43ac42"
    correlationId: "d0ba303b-ee7e-4e50-9b98-e5ab65b73a96"
    method: "DELETE"
    url: "/artists/555a1e45-c1c2-4b56-a331-eba6bd9b9db8"
    path: "/:id"
    statusCode: 204
    durationMs: 22












    
Test case5: Token expired


requst 
DELETE http://localhost:3000/artists/aaa1e450-c1c2-4b56-a331-eba6bd9b9db8
Header Authorization   Bearer <token:

output 
401 Un authorized

log

[11:39:09.425] INFO: Server running on port 3000
[11:39:13.952] WARN: Domain error
    correlationId: "295d974b-708a-4cac-8b7b-eebd56f64e29"
    method: "DELETE"
    path: "/artists/aaa1e450-c1c2-4b56-a331-eba6bd9b9db8"
    code: "UNAUTHORIZED"
    message: "Token has expired"
[11:39:23.728] DEBUG: findByEmail - SQL query
    correlationId: "ff42f595-5ff3-4488-ae03-1d24707f8f52"
    sql: "SELECT id, email, password_hash, role, created_at FROM users WHERE email = ? LIMIT 1"
    params: [
      "email2@gmail.com"
    ]
[11:39:23.823] INFO: HTTP request completed
    correlationId: "ff42f595-5ff3-4488-ae03-1d24707f8f52"
    method: "POST"
    url: "/users/login"
    path: "/login"
    statusCode: 200
    durationMs: 97