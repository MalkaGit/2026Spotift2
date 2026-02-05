=============================================
how to develop: register user - not sure it belongs here
=============================================
-create the users.types in      
    app-rest-api\src\modules\users\types 
    user.login.input.schema.ts
    user.login.input.ts
    user.login.output.schema.ts
    index.ts

-implement the respository
    UserRepository
    function findByEmail(email: string): Promise<UserEntity | null>

-inplement service   
    UserService        
    function login(input: LoginUserInput): Promise<LoginUserOutput>

-implement controller
    UserController
    async function loginUser(req:     
       TypedRequest<LoginUserInput>,
       res: Response,
       next: NextFunction
   ) 
-implement router
 POST /api/users/login

-export router and use it in the app

as we go:
-user.entity.ts (in models)
-implement error codes
-add env file
    Add JWT secret config
    Secret key for signing and verifying JWT tokens
    minimum-32-characters-long
       #JWT Authentication
       
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
How to Test: login user
=============================================
CREATE TABLE users - already created

Example1:
    POST 
    http://localhost:3000/users/login
    Content-Type application/json
    {
    "email": "email1@gmail.com",
    "password":"Aa123456789"
    }

result:
    200
    {
    "accessToken": "xxx",
    "expiresIn": 3600
    }

Exmple2: wrong username
        POST 
    http://localhost:3000/users/login
    {
    "email": "email4@gmail.comxxxx",
    "password":"aA123456789!"
    }

result:
    401 un-authorized
    {
        "code": "UNAUTHORIZED",
        "message": "USER_INVALID_CREDENTIALS"
    }



Example3: wrong password - as above


result

