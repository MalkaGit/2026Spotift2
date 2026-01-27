

1. About auth middleware
implementation
App level (app.ts)

1.1  JWT auth is required by default.
in application we set: jwtAuthMiddleware({ required: true })

1.2 i explicitly set some route as public in their router 

/health — explicitly marked as public
/users/register — explicitly marked as public
/users/login — explicitly marked as public


