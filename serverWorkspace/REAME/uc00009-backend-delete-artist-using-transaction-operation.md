
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


[10:26:13.407] DEBUG: JWT auth - User authenticated and stored in context
    userId: "fa49cd77-1bc1-49f1-a73e-14ba73cf9d63"
    correlationId: "649810a9-890b-42e8-a569-6d92feec3858"
[10:26:13.408] DEBUG: requireAuthenticated - user authenticated successfully
    userId: "fa49cd77-1bc1-49f1-a73e-14ba73cf9d63"
    correlationId: "649810a9-890b-42e8-a569-6d92feec3858"
[10:26:13.408] DEBUG: artists.findById - SQL query
    userId: "fa49cd77-1bc1-49f1-a73e-14ba73cf9d63"
    correlationId: "649810a9-890b-42e8-a569-6d92feec3858"
    sql: "SELECT id, user_id, name, bio, image_url, created_at FROM artists WHERE id = ? LIMIT 1"
    params: [
      "d03c3755-46f7-4498-8ec5-bc9ace43ac42"
    ]
[10:26:13.420] WARN: Domain error
    userId: "fa49cd77-1bc1-49f1-a73e-14ba73cf9d63"
    correlationId: "649810a9-890b-42e8-a569-6d92feec3858"
    method: "DELETE"
    path: "/artists/d03c3755-46f7-4498-8ec5-bc9ace43ac42"
    code: "ARTIST_NOT_FOUND"
    message: "Artist with id d03c3755-46f7-4498-8ec5-bc9ace43ac42 not found"
[10:26:13.421] INFO: HTTP request completed
    userId: "fa49cd77-1bc1-49f1-a73e-14ba73cf9d63"
    correlationId: "649810a9-890b-42e8-a569-6d92feec3858"
    method: "DELETE"
    url: "/artists/d03c3755-46f7-4498-8ec5-bc9ace43ac42"
    path: "/:id"
    statusCode: 404
    durationMs: 14










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

[dotenv@17.2.3] injecting env (0) from .env -- tip: ⚙️  write to custom object with { processEnv: myObject }
[10:30:43.644] INFO: Server running on port 3000
[10:30:48.815] DEBUG: JWT auth - User authenticated and stored in context
    userId: "fa49cd77-1bc1-49f1-a73e-14ba73cf9d63"
    correlationId: "eaa30242-7e0e-480b-83e7-61d86352716f"
[10:30:48.818] DEBUG: requireAuthenticated - user authenticated successfully
    userId: "fa49cd77-1bc1-49f1-a73e-14ba73cf9d63"
    correlationId: "eaa30242-7e0e-480b-83e7-61d86352716f"
[10:30:48.818] DEBUG: artists.findById - SQL query
    userId: "fa49cd77-1bc1-49f1-a73e-14ba73cf9d63"
    correlationId: "eaa30242-7e0e-480b-83e7-61d86352716f"
    sql: "SELECT id, user_id, name, bio, image_url, created_at FROM artists WHERE id = ? LIMIT 1"
    params: [
      "aaa1e450-c1c2-4b56-a331-eba6bd9b9db8"
    ]
[10:30:48.846] WARN: Domain error
    userId: "fa49cd77-1bc1-49f1-a73e-14ba73cf9d63"
    correlationId: "eaa30242-7e0e-480b-83e7-61d86352716f"
    method: "DELETE"
    path: "/artists/aaa1e450-c1c2-4b56-a331-eba6bd9b9db8"
    code: "FORBIDDEN"
    message: "You can only delete artists you manage."
[10:30:48.850] INFO: HTTP request completed
    userId: "fa49cd77-1bc1-49f1-a73e-14ba73cf9d63"
    correlationId: "eaa30242-7e0e-480b-83e7-61d86352716f"
    method: "DELETE"
    url: "/artists/aaa1e450-c1c2-4b56-a331-eba6bd9b9db8"
    path: "/:id"
    statusCode: 403
    durationMs: 35












Test case3: error - attemting to delete artitst that  i did not create


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
10:30:43.644] INFO: Server running on port 3000
[10:30:48.815] DEBUG: JWT auth - User authenticated and stored in context
    userId: "fa49cd77-1bc1-49f1-a73e-14ba73cf9d63"
    correlationId: "eaa30242-7e0e-480b-83e7-61d86352716f"
[10:30:48.818] DEBUG: requireAuthenticated - user authenticated successfully
    userId: "fa49cd77-1bc1-49f1-a73e-14ba73cf9d63"
    correlationId: "eaa30242-7e0e-480b-83e7-61d86352716f"
[10:30:48.818] DEBUG: artists.findById - SQL query
    userId: "fa49cd77-1bc1-49f1-a73e-14ba73cf9d63"
    correlationId: "eaa30242-7e0e-480b-83e7-61d86352716f"
    sql: "SELECT id, user_id, name, bio, image_url, created_at FROM artists WHERE id = ? LIMIT 1"
    params: [
      "aaa1e450-c1c2-4b56-a331-eba6bd9b9db8"
    ]
[10:30:48.846] WARN: Domain error
    userId: "fa49cd77-1bc1-49f1-a73e-14ba73cf9d63"
    correlationId: "eaa30242-7e0e-480b-83e7-61d86352716f"
    method: "DELETE"
    path: "/artists/aaa1e450-c1c2-4b56-a331-eba6bd9b9db8"
    code: "FORBIDDEN"
    message: "You can only delete artists you manage."
[10:30:48.850] INFO: HTTP request completed
    userId: "fa49cd77-1bc1-49f1-a73e-14ba73cf9d63"
    correlationId: "eaa30242-7e0e-480b-83e7-61d86352716f"
    method: "DELETE"
    url: "/artists/aaa1e450-c1c2-4b56-a331-eba6bd9b9db8"
    path: "/:id"
    statusCode: 403
    durationMs: 35






    

Test case4: SUCCESS PATH


requst 
DELETE http://localhost:3000/artists/aaa1e450-c1c2-4b56-a331-eba6bd9b9db8
Header Authorization   Bearer <token:

output 
204 no content

log
[10:37:31.124] DEBUG: JWT auth - User authenticated and stored in context
    userId: "d03c3755-46f7-4498-8ec5-bc9ace43ac42"
    correlationId: "9d5d7af4-7ec7-4ed4-8645-54e49838f657"
[10:37:31.125] DEBUG: requireAuthenticated - user authenticated successfully
    userId: "d03c3755-46f7-4498-8ec5-bc9ace43ac42"
    correlationId: "9d5d7af4-7ec7-4ed4-8645-54e49838f657"
[10:37:31.125] DEBUG: artists.findById - SQL query
    userId: "d03c3755-46f7-4498-8ec5-bc9ace43ac42"
    correlationId: "9d5d7af4-7ec7-4ed4-8645-54e49838f657"
    sql: "SELECT id, user_id, name, bio, image_url, created_at FROM artists WHERE id = ? LIMIT 1"
    params: [
      "aaa1e450-c1c2-4b56-a331-eba6bd9b9db8"
    ]
[10:37:31.127] DEBUG: artists.deleteById - SQL query
    userId: "d03c3755-46f7-4498-8ec5-bc9ace43ac42"
    correlationId: "9d5d7af4-7ec7-4ed4-8645-54e49838f657"
    sql: "DELETE FROM artists WHERE id = ?"
    params: [
      "aaa1e450-c1c2-4b56-a331-eba6bd9b9db8"
    ]
[10:37:31.150] INFO: HTTP request completed
    userId: "d03c3755-46f7-4498-8ec5-bc9ace43ac42"
    correlationId: "9d5d7af4-7ec7-4ed4-8645-54e49838f657"
    method: "DELETE"
    url: "/artists/aaa1e450-c1c2-4b56-a331-eba6bd9b9db8"
    path: "/:id"
    statusCode: 204
    durationMs: 26















    
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