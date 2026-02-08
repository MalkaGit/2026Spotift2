# =============================================================================
# Dockerfile — recipe for building a runnable package of your API
# =============================================================================
#
# Key terminology
#   IMAGE       = A snapshot that contains your app + Node + dependencies.
#                 Think of it like a zip file of everything needed to run the app.
#   CONTAINER   = A running instance of an image. You can start many containers
#                 from the same image (like opening the same app several times).
#   BUILD       = The process of reading this file and creating an image.
#                 You run: docker build (or docker compose build) from serverWorkspace.
#   BUILD CONTEXT = The folder Docker can see during build. Only files from
#                 serverWorkspace are sent; .dockerignore says what to exclude.
#   STAGE       = One "phase" of the build. This file has 2 stages: first we
#                 build the app, then we keep only what is needed to run it.
#
#Flow of building and running image:
#   You create dockerfile and dockerignore
#   When you run "docker build" (or "docker compose build") from serverWorkspace directory
#   Docker reads these files and builds docker image that holds everything your app needs to run
#       (your app plus Node, dependencies, and built code — no .env, no source clutter).
#       *dockerfile is a recipe for building a Docker IMAGE. 
#       *dockerignore file tells Docker which files and folders NOT to send to the build context when you run "docker build".
#   Then, you run "docker run" or docker compose up command 
#   to run a container that runs the app (process running the image).
# You can then call the api from your machine if  you map the port (e.g. -p 3000:3000).
#
# =============================================================================

# -----------------------------------------------------------------------------
# STAGE 1 — Building app (temporary; only used to produce built code)
# -----------------------------------------------------------------------------
# This stage has: source code, devDependencies, and build output.
# We will NOT keep all of this in the final image — Stage 2 copies only what
# is needed to run the API (smaller and safer).
#
# 
# FROM = "Start from an existing image." We use the official Node 20 image
# "AS builder" gives this stage a name so we can copy from it in Stage 2.# stage a name so we can copy from it in Stage 2.
FROM node:20-alpine AS builder

# WORKDIR = set the current folder inside the image. All following paths are
# relative to /app (e.g. ./lib-common means /app/lib-common).
WORKDIR /app

# --- Build lib-common in the container (app-rest-api depends on it) ---
# COPY = copy files from your PC (serverWorkspace) into the image.
COPY lib-common/package.json lib-common/package-lock.json lib-common/tsconfig.json ./lib-common/
COPY lib-common/src ./lib-common/src/
# RUN = run a command inside the image. "cd lib-common" then:
#   npm ci     = install dependencies into /app/lib-common/node_modules
#   npm run build = compile TypeScript into /app/lib-common/dist
RUN cd lib-common && npm ci && npm run build

# --- Build app-rest-api (same idea; it uses lib-common we just built) ---
COPY app-rest-api/package.json app-rest-api/package-lock.json app-rest-api/tsconfig.json ./app-rest-api/
COPY app-rest-api/src ./app-rest-api/src/
RUN cd app-rest-api && npm ci && npm run build



# -----------------------------------------------------------------------------
# STAGE 2 — Runtime (this is what ends up in the final image)
# -----------------------------------------------------------------------------
# Why two stages? 
# Stage 1 had source code, dev tools, and devDependencies — we
# do not need those to RUN the API. 
# Stage 2 starts from a clean Node image and copies only:
# built output (dist/) + package files. Then we run "npm ci --omit=dev"
# to get production dependencies only. Result: smaller image, no
# secrets from your PC, no dev-only packages.
#
# New FROM = new stage. Everything before this was "builder"; from here on we
# build the final image. Nothing from Stage 1 exists here until we COPY it.
FROM node:20-alpine

# WORKDIR = set the current folder inside the image.
WORKDIR /app

# COPY files FROM the Stage 1 (builder) image (the "builder" stage), into this image
# source and dependencies are not copied
COPY --from=builder /app/lib-common/package.json /app/lib-common/package-lock.json ./lib-common/
COPY --from=builder /app/lib-common/dist ./lib-common/dist/
# Install only production dependencies (no devDependencies). 
# Output goes to /app/lib-common/node_modules.
RUN cd lib-common && npm ci --omit=dev

# Same for app-rest-api: copy from builder, then production npm ci.
COPY --from=builder /app/app-rest-api/package.json /app/app-rest-api/package-lock.json ./app-rest-api/
COPY --from=builder /app/app-rest-api/dist ./app-rest-api/dist/
RUN cd app-rest-api && npm ci --omit=dev

# When the container STARTS, the running process will use this folder as its
# current directory. So "node dist/server.js" will run from /app/app-rest-api.
WORKDIR /app/app-rest-api

# -----------------------------------------------------------------------------
# EXPOSE — which port does the app listen on?
# -----------------------------------------------------------------------------
# -EXPOSE IS used to document that this app listens on 3000
# To actually call the API from your browser or Postman, 
# you must "map" the port when you start the container
# examples:
#   In docker-compose: ports: - "3000:3000"
    #   docker run -p 3000:3000 ...     (left=your PC, right=container)
# Then you can open http://localhost:3000 and reach the API.
EXPOSE 3000

# -----------------------------------------------------------------------------
# ENV — environment variables 
# -----------------------------------------------------------------------------
# ENV sets variables that the app will see when it runs (e.g. process.env.PORT).
# We set only two here as defaults; they behave like two lines in a .env file.
#
# Your real .env has more 
#(DB_HOST, DB_USER, DB_PASSWORD, DB_NAME, DB_PORT, JWT_SECRET, LOG_LEVEL).
# Those are NOT in the image on purpose 
#(smaller image, no secrets baked in).
# So where does the container get them at run time?
# examples:
#   - From docker-compose: use "environment:" or "env_file: .env" in the service.
#   - From command line: docker run -e DB_USER=root -e DB_PASSWORD=... ...
# So: NODE_ENV and PORT are defaults in the image; DB_*, JWT_SECRET, etc. you
# pass when you start the container (compose or -e).


ENV NODE_ENV=production
ENV PORT=3000

# -----------------------------------------------------------------------------
# CMD — the command that runs when you start the container
# node dist/server.js
# -----------------------------------------------------------------------------
CMD ["node", "dist/server.js"]
