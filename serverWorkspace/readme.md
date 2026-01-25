

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



       
===========================================
hot to develop ?
=============================================
how to develop:
phase10.0 - copy from tempate2
=============================================
copy the contest to some test folder 
remove node_modlues from lib_common an app-rest-api if exists 

build lib-common
test\template002__node_app_with_logger\serverWorkspace\lib-common>npm install
test\template002__node_app_with_logger\serverWorkspace\lib-common>npm run build
build app-rest-api 
test\template002__node_app_with_logger\serverWorkspace\lib-common>cd..
test\template002__node_app_with_logger\serverWorkspace>cd app-rest-api
test\template002__node_app_with_logger\serverWorkspace\app-rest-api>npm install
test\template002__node_app_with_logger\serverWorkspace\app-rest-api>npm run build
run app-rest-api
test\template002__node_app_with_logger\serverWorkspace\app-rest-api>npm start

=============================================
how to develop:
lib-common
=============================================

10.1 utils\request-context    lib-common> npm install, npm run build
10.2 utils\logger             lib-common> npm install, npm run build
10.3 infra\db                 lib-common> npm install, npm run build
10.4 domain\errors            lib-common> npm install, npm run build
10.5 app\express.types        lib-common> npm install, npm run build
10.6 app\express.middlewares\request-validator.middlewares  lib-common> npm install, npm run build
10.7 app\express.middlewares\request-context.middlewares  lib-common> npm install, npm run build
10.8 app\express.middlewares\auth.middlewares  lib-common> npm install, npm run build
10.9 app\express.middlewares\request-logger.middlewares  lib-common> npm install, npm run build


=============================================
how to develop:
app-rest-api
=============================================

11.1 app.ts    - init express app,  middlewares and health endpoint 
11.2 server.ts - init process errorhandles and starts the express app
        app-rest-api> npm install XXX (by files)
        app-rest-api> npm install, npm run build
         app-rest-api> npm start


=============================================
how to develop:
app-rest-api
=============================================

11.3 .env      - configuration file for the app
                 location: \serverWorkspace\app-rest-api\.env
                 for now, it holds the log settings 


          #NODE_ENV: the log format
          #   development - log pretty format,
          #   production  - logs json
          NODE_ENV=development

          #LOG_LEVEL:the log LOG_LEVEL
          # trace, debug(dev), info (prod), warm error, fatal
          LOG_LEVEL=debug

       #My sql
       #PORT=3000
       #DB_HOST=
       #DB_USER=admin
       #DB_PASSWORD=
       #DB_NAME=
       #DB_PORT=3306
       #DB_CONNECTION_LIMIT=10


=============================================
how to test:
app-rest-api
=============================================
    
    set the .env file as you wish 
        note: ennvironment defaults to development and level to debug
    build
        app-rest-api> npm install, npm run build
    start 
        app-rest-api> npm start
    test (eg, psotman)
        http://localhost:3000/health
    log 
        see the log
            [09:24:44.848] INFO: Server running on port 3000
            [09:25:57.200] INFO: HTTP request completed
            userId: "regine"
            correlationId: "e8d38d60-1469-481d-b1ae-257246a235d5"
            method: "GET"
            url: "/health"
            path: "/health"
            statusCode: 200
            durationMs: 51


