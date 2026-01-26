HLD
1. simplicity
   -monolith
   -refresh token not supported

2. libraries used
   jsonwebtoken library
   sign method   - creates the toekn
   verify method - verifies token
   verify and sign both need same JWT_SECRET
   (that we read from environment)

3. tables used - monolith
   users table with email and hashed password 

4. modules used - monolith
   users module 

5. api used - monolith
   users micro service - login peration

6. HLD flow - monolith 
rest api on single server 
with access to all database

6.1 on login, 
    monolith server uses sign method 
    and JWT_SECRET 
    to return token.
    client stores the token
    (with the user id, user role etc)

    note: the sign menthod adds expiration 
    details to the token

6.2 on any client request
    client sends request to monolith server
    with authorization header Bearder <toekn>

6.3 (monolith) server runs the auth middleware
    and uses the  verify method 
    and JWT_SECRET to get payload
    the middlware then stores the user id, user role in the request context

    the verify method will throw exception if token expires



7. LLD details
7.1 
sign method of jsonwebtoken 
-takes some key
-jwt payload noramlly has 
sub - the user id
iat - issued at automatically added by jsonwebtoken
exp = expiraiton. automatically added by jwt 
role - user role 


8. step ahead 
as we move to microservices,
it will be  Auth Service that will call users service to access users data on db







