
============================================
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

