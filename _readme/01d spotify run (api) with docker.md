## Docker setup on Windows (for this project)

This document mirrors the first guidance about Docker so you can refer back to it later.

===============================================
### 5. Run
===============================================
**Run:** From `serverWorkspace`:

```powershell
option1: docker compose up --build
option2: 
c:\dev\repos\node\2026Spotift2\serverWorkspace>
docker compose build
docker compose up


===============================================
### 1. What "Docker for deployment only" means
===============================================

- **During development (today)**:
  - **Frontend**: run from `clientWorkspace-AI` with `npm run dev`.
  - **Backend API**: run from `serverWorkspace/app-rest-api` with `npm run dev`.
  - **Database**: use your existing **local MySQL** instance.
  - Data flow: **local browser → local API → local MySQL**.

- **For deployment (Docker) – this project (API-only)**:
  - **API** runs inside a container (Node + your code baked into an image). You still use **`docker compose up`** (one service in the compose file).
  - **MySQL** stays **external** (local or remote); the API connects via environment variables (e.g. `DB_HOST`, `DB_USER`, `DB_PASSWORD`).
  - **Frontend** is not in Docker for now (run locally or deploy elsewhere).
  - Data flow: **frontend (local or elsewhere) → API container → external MySQL**.

Optional later: add MySQL and/or frontend to Docker (same compose or separate).

The idea: keep your dev workflow simple, but have a **reproducible API runtime** using Docker and Docker Compose.





===============================================
### 2. Install Docker on Windows (Docker Desktop + WSL2)
===============================================

1. **Download Docker Desktop**
   - Go to `https://www.docker.com/products/docker-desktop/`.
   - Download **Docker Desktop for Windows**.

2. **Run the installer**
   - Double‑click the installer.
   - When prompted:
     - **Enable WSL 2 based engine**: keep this **checked**.
     - If asked to install **WSL 2** or the **Linux kernel update package**, accept.
   - Finish installation and reboot if requested.


3. **First run**
   - Start **Docker Desktop** from the Start menu.
   - Accept the license terms.
   - Wait until Docker shows that it is **running** (green icon).


4. **Verify in PowerShell**
   - Open **PowerShell** and run:

     ```powershell
     docker --version
     docker run hello-world
     ```

   - You should see a Docker version string, and `hello-world` should print a success message after pulling the image.

If any of these steps fail, capture the full error message so we can debug it.









===============================================
### 3. Core Docker concepts (for this repo)
===============================================


- **Dockerfile**: build
 a text file that describes how to build an image 

- **.dockerignore**:  ignore 
a text file that defines which to exclude from the image 
to keep the **build context** small
 (e.g. exclude `node_modules`, `.env`). 

 - **Docker Compose (`docker-compose.yml` )**: stop\run
  - Describes one or more services (containers) and how they connect.
  - For this project: **one service**, **api**. You still run `docker compose up`.

- **Container**: a **running instance** of an image 
  (like a process with its own filesystem and network).

- **Image**: like zip with your code 








===============================================
### 4. Files to add and where they go
===============================================
Once Docker Desktop is installed and working
 (`docker run hello-world` succeeds), 
 add these (industry-standard, minimal setup).
 
 
  **All three files live in one place**: `serverWorkspace/`.

| File                   | Location                             |
|------------------------|--------------------------------------|
| **.dockerignore**      | `serverWorkspace/.dockerignore`      |
| **Dockerfile**         | `serverWorkspace/Dockerfile`         |
| **docker-compose.yml** | `serverWorkspace/docker-compose.yml` |

- **.dockerignore**:
 ->ignore
 In `serverWorkspace` next to the Dockerfile so it applies to the same build context.
 Exclude `node_modules`, `.env`, and other unneeded files
 so the build stays small and no secrets are copied.

- **Dockerfile**:
->build and expose API. gets env vars from caller.
 build context is `serverWorkspace`;
  Uses a `node` base image;
 copies `app-rest-api` and `lib-common`, runs `npm install` and build; 
 exposes API port; 
 `CMD` runs the API (e.g. `npm start` → `node dist/server.js`).


- **docker-compose.yml**: 
One service, **api**, 
built from `serverWorkspace/Dockerfile` with context `serverWorkspace`.
Pass env vars so the API can connect to **external MySQL** 
(e.g. `DB_HOST=host.docker.internal` for local MySQL on Windows).


===============================================
### 5. Run
===============================================
**Run:** From `serverWorkspace`:


```powershell
option1: docker compose up --build
option2: 
c:\dev\repos\node\2026Spotift2\serverWorkspace>
docker compose build
docker compose up
```

**Command 1 — docker compose build**

- **What it does:** Reads the Dockerfile and `.dockerignore`, sends the build context to Docker, and creates the image (all layers: base Node, dependencies, built app). Does not start any container.
- **Output:** Build logs (e.g. "Building api...", "=> CACHED" or "=> [1/8] FROM node:20-alpine", step-by-step progress, and finally "Successfully built ..." and "Successfully tagged serverworkspace-api:latest").

**Command 2 — Run docker compose up**

- **What it does:** Creates and starts the containers defined in `docker-compose.yml` (here: the API service). Uses the image built in step 1. Binds port 3000 on your PC to port 3000 in the container so you can call `http://localhost:3000`. Logs from the app appear in the terminal (foreground).
- **Output:** Container startup messages, then the API process logs (e.g. "Server listening on port 3000"). The terminal stays attached; use Ctrl+C to stop the containers.

**One-shot alternative:** `docker compose up --build` runs both steps (build if needed, then up). Use the two commands above when you want to see build and run separately.

---



===============================================
### 6. other commanda
===============================================
```see the docker process 
c:\dev\repos\node\2026Spotift2\serverWorkspace>
docker compose ps

NAME                    IMAGE                 COMMAND                  SERVICE   CREATED         STATUS         PORTS
serverworkspace-api-1   serverworkspace-api   "docker-entrypoint.s…"   api       3 minutes ago   Up 3 minutes   0.0.0.0:3000->3000/tcp, [::]:3000->3000/tcp


```Test health
Then call the API (e.g. `http://localhost:3000`) 
and verify it talks to your MySQL. 

```start frontend
Frontend stays local (`npm run dev` in `clientWorkspace-AI`)

```browse to frontend: http://localhost:5173/

```palyaround with app and see logs in the docker

Optional later: add a **MySQL** service and/or a **frontend** service to the same compose file if you want the full stack in containers.

