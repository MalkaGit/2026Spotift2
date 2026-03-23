

===================================================================
Overall - usage
===================================================================

   https://frontend-production-aeae.up.railway.app/
    "email": "email1@gmail.com",
    "password":"Aa123456789!"



===================================================================
Idea
===================================================================

1.Railway dashboard is opened with  https://railway.com/
2. There you see list of railway project
3. Each railway project is composed of services
	1. Eg, db, backend , frontend


====================================================================
Step 1 — create the Railway project with MYSQL service
====================================================================
In Railway:
	1. Open railway dashboard 
	2. Create a new empty project
		
	Choose: "Empty project"
	Add a MySQL service
	Hit the dashboard again and rename the service
	

====================================================================
Step2 - connect to the MySQL service from MySQL Work banch
              and crate schema and tables
====================================================================

5. Open your railway project (regine spotify 2026)
6. Select the MYSQL service
7. Open its variables
8. Copy the value of MYSQL_PUBLIC_URL
   mysql://root:JUnZxfNAGDUgOLXdHVglAqHeiggEnATb@maglev.proxy.rlwy.net:23652/railway
   Mysql://<username>:password@hostname:port/railway
9. Open MySQL workbanch locally and test connection to the railway DB
10. Run the script to create schema and tables and populate tables

=====================================================================
Step 3 — add the backend service
=====================================================================

1. Add bacend servvice
	1. OPEN Dashbard 
	https://railway.com/
	

	1. Select your realway project regine 2026  spotify
	2. Click => add => github repository => select the repository: sporigy 2026
	3. Rename the service to backend

2. Set root directory for backend service
	1. Setting => add root directory =>  /serverWorkspace

	Why not serverWorkspace/app-rest-api first?
	Because your screenshots suggest app-rest-api and lib-common are siblings, so the backend may depend on code outside app-rest-api.

3. Set watch path
	1. Settings => build => watch paths 
	Set watch paths so Railway redeploys backend only when backend-related files change. 
    Railway supports gitignore-style watch paths for monorepos. (Railway Docs)
	Use something like:
	/serverWorkspace/**


4. Set variables for the backend service (instead env file) 
    In the backend service, create variables that point to the MySQL service.
	1. Open variables tab for the backend service
	2. add the keys with dummy values, taking keys from backend env file
      C:\dev\repos\node\2026Spotift2\serverWorkspace\app-rest-api\.env
	3.  add values to those keys (values from my sql variablestab)

	Railway supports referencing variables from other services using template syntax. (Railway Docs)
	Example idea:
	DB_HOST=${{ MySQL.MYSQLHOST }}
	DB_USER=${{ MySQL.MYSQLUSER }}
	DB_PASSWORD=${{ MySQL.MYSQLPASSWORD }}
	DB_PORT=${{ MySQL.MYSQLPORT }}
    DB_NAME=${{ MySQL.MYSQLDATABASE }}
    DATABASE_URL=${{ MySQL.MYSQL_URL }}
	Your exact service name may not be MySQL; use whatever Railway calls that DB service.
	
5. Set Build command  for the backend service
   (backed service) => settings => build => build command =>
    cd lib-common && npm install && npm run build && cd ../app-rest-api && npm install && npm run build
    => save
    That part depends entirely on your monorepo scripts.

6. Set Start command for the backend service
   (backend service) => settings => deploy =>  start command => npm start => save


7. Hit "deploy"

====================================================================
Step 4 —Not needed: make sure the backend listens correctly
====================================================================
Your Express/Node app must:
	• listen on process.env.PORT
	• bind to 0.0.0.0
To expose a web service publicly, Railway requires generating a domain from the service settings, and the service must actually listen on its assigned runtime port. (Railway Docs)
Example:
const port = Number(process.env.PORT || 3000);
app.listen(port, '0.0.0.0', () => {
  console.log(`Server listening on ${port}`);
});

===================================================================
Step 5 — give the backend a public URL & test
===================================================================

1. Open dashboard
   Select the railway project: regie 2026 spotify
    Select the backend service

2. In backend service settings:
	1. Go to Networking
	2. In Public Networking, click Generate Domain
    Railway says services do not get a public domain automatically; you generate one in the networking settings. (Railway Docs)
    You’ll use this URL from the frontend.

3. Test
	1. Send health request to backend From postman
	GET 
	backend-production-ec42b.up.railway.app/health
	Note: without post number
	

4. See logs
Open dashboard => open the application => backend service => deployments tab => hit "active"
See
-http logs tab
-see deploy logs
10. f


====================================================================
Step 6 — add the frontend service
===================================================================
Add another service from the same repo.

	1. OPEN Dashbard 
	https://railway.com/
	

	2. Select your realway project regine 2026  spotify
	3. add service from repository
	   Click => add => github repository => select the repository: sporigy 2026
	4. Rename the service to frontend
	5. Set root directory for frontend service
	6. Setting => add root directory =>  /clientWorkspace-AI
	7. Set watch path
	    1. Settings => build => watch paths 
	   Set watch paths so Railway redeploys frontend only when frntend-related files change. 
       Railway supports gitignore-style watch paths for monorepos. (Railway Docs)
	   Use something like:
	   /clientWorkspace-AI/**
	   Again, Railway supports watch paths specifically for monorepos. (Railway Docs)
	8. Set variables for frontend service (instead env file) 
       In the front service, create variables 
    Open variables tab for the frontend service
      	1. add the keys with dummy values, VITE_API_URL
	    2. add values to those keys (values from my sql variablestab)
           https://backend-production-ec42b.up.railway.app
          (from backend service => Networking => Public Networking, Domain)
	
	      VITE_API_BASE_URL=https://your-backend-domain.up.railway.app
	       If this is React with Vite, VITE_ is typical.
		   If it is CRA, the prefix may be different.
	
    9. Set Build command  for the frontend service (React + vite)
       (frontend service) => settings => build => build command =>
       npm install && npm run build
       => save
       That part depends entirely on your monorepo scripts.

    10. Set Start command for the backend service
      (backend service) => settings => deploy =>  start command => 
      npx serve -s dist -l $PORT
      => save


		👉 Why:
			• vite preview serves built files 
			• Railway needs: 
				○ 0.0.0.0 
				○ $PORT


    11. Hit "deploy"


=====================================================================
Step 7 — give the frontend a public URL & test
=====================================================================
1. Open dashboard
   Select the railway project: regie 2026 spotify
   Select the frontend service

2. In backend service settings:
	1. Go to Networking
	2. In Public Networking, click Generate Domain
       Railway says services do not get a public domain automatically; you generate one in the networking settings. (Railway Docs)
       You’ll use this URL from the frontend.


3. Test
	1. Open the browser and browse to the url (created above)
	https://frontend-production-aeae.up.railway.app/

    	
	Note:
	use postman collection to register user before you can login
	
4. See logs
    Open dashboard => open the application => frontend service => deployments tab => hit "active"

     See
    -http logs tab
    -see deploy logs




