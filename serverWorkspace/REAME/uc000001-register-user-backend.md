=============================================
how to develop: register user
=============================================
-we created project from template 2026Learning
-creare users table in  my sql table 
    see in repositry
-create thye users.types in app-rest-api\src\modules\users\types 
    user.register.input.schema.ts
    user.register.input.ts
    user.register.output.schema.ts
    index.ts
-implement the respository
-implement error codes
-inplement service
-implement controller
-implement router
-export router and use it in the app
add env file

go over files, fo npm install XXX as needed
build as above
test as below




=============================================
how to run this template
=============================================
cd to the serverWorkspace
cd lib-common
npm install 
npm run build 
cd..
cd app-rest-api
npm install
npm run build 
npm start 
test:  http://localhost:3000/health

note: you can try changing .env file settings
      -no env file 
      -change the settings to see how it affects the format and log level
       (see below)



=============================================
How to Test: register user
=============================================
CREATE TABLE users (
  id CHAR(36) PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('listener','artist','admin') DEFAULT 'listener',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

Example1:
POST http://localhost:3000/users/register
Content-Type application/json
{
    "email": "email2@gmail.com",
    "password":"aA123456789"
}

result:
400 Bad request
{
    "code": "USER_PASSWORD_TOO_WEAK",
    "message": "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character"
}


Exmple2:
POST http://localhost:3000/users/register
Content-Type application/json
{
    "email": "email3@gmail.com",
    "password":"aA123456789!"
}

results:
201 created
{
    "id": "1482aeff-f30d-45fc-9f9c-04bdd911f6d0"
}


Example3:
POST http://localhost:3000/users/register
Content-Type application/json
{
    "email": "email3@gmail.com",
    "password":"aA123456789!"
}

result
{
    "code": "USER_ALREADY_EXISTS",
    "message": "User with email email3@gmail.com already exists"
}

