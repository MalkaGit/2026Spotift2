---
name: To read file copy C:\Users\User\.cursor\plans and drop to cursor
      Node master learning plan (Spotify-like app)
overview: "Efficient, interview-relevant plan: C# backend to Node.js (REST, DB), Docker, Cloud (AWS, Oracle). Each step = user scenario, REST endpoints, tables, user stories. Strong CV bullets at each phase."
todos: []
isProject: false
---

# Node master learning plan (Spotify-like app)

- **You:** C# backend dev → Node.js (REST API, DB), Docker, Cloud (AWS, Oracle).
- **Goal:** Efficient, interview-relevant plan.
  - Each step includes
    - Goal (including something new will learn)
    - user scenario (what's on screen)
    - flow
    - list of backend endpoints (with their API)
    - short list of screens \ componnets
    - tables
    - user stories.
    - main test cases (optional)
    - intresting edge test cases
- **Output:** One plan you can follow step-by-step; strong CV bullets at each phase.

---

## Decisions & Golden Rules


| Topic                       | Decision                                                                                                                                                                                                                                                                                                                                                                                                                  |
| --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Search                      | One endpoint `GET /search?q=&type=` (single query type). First: table for MySQL full-text, then migrate to Elasticsearch. **Implementation always lives in a dedicated `search` module**, separate from `catalog`, because search is a projection in another store (no SQL JOINs) and should be swappable/scalable independently.                                                           |
| NoSQL / Elasticsearch order | 1) MySQL + unified search (FULLTEXT / searchable_entities). 2) Elasticsearch (same API). 3) Optional: MongoDB for preferences. **Why:** start with simpler relational search, then move to ES without breaking the API; MongoDB stays for a narrow, document-style use case (preferences) so core data remains in MySQL.                                                           |
| Domain modules              | Core backend is split into `catalog` (artists/albums/tracks and their `*_stats` tables), `engagement` (likes, playlists, plays, follows), `users` (auth/profile), and `search` (search implementation over MySQL FULLTEXT or Elasticsearch). **Why:** catalog owns entities **and** their stats (they’re small, joinable attributes of artists/tracks), while search is a separate read-optimized projection. |
| Artist top tracks stats     | `artist_top_tracks_stats` (and other `*_stats` tables) live in the `catalog` module and are kept **normalized** (one row per artist/track, no duplicated track name or duration); reads join to `tracks` for details. **Why:** these stats are small, behave like extra attributes of catalog entities, and staying normalized lets you safely JOIN them inside `catalog` while keeping search/analytics stores (e.g. Elasticsearch) free to use denormalized documents optimized for read performance. Golden rules: (1) keep core relational schema normalized inside a module when joins are cheap, (2) denormalize only in read-optimized projections (search/analytics), not in the source-of-truth tables, (3) if a table answers “what is this artist/track like?”, it probably belongs – and stays normalized – in `catalog`. |
| Track play events storage   | `track_play_events` is part of the `engagement` domain (user play actions) even if it later moves to a different DB or storage engine for scale. **Why:** module boundaries are about **business meaning**, not technology: engagement owns “what the user does” (including plays), while physical storage (MySQL, another MySQL cluster, time-series DB, S3 + batch, etc.) can change without moving the table to another module. Golden rules: (1) design modules by domain first, (2) you may change **where** a module stores its data, but not **which module** owns that data, (3) keep write-logs like `track_play_events` in the domain that emits them and build analytics from there. |
| Playlists & library         | `playlists` and `playlist_tracks` belong to `engagement`, not `catalog`, because they are **per-user collections over catalog tracks** (each user’s “library”), not global content. **Why:** catalog answers “what music exists for everyone?”, engagement answers “what this user did with the music” (liked, followed, added to playlist, played). Golden rules: (1) global, shared content = catalog; (2) per-user or user-owned collections = engagement; (3) don’t move tables between modules just because you change storage technology. |
| Likes table design          | Single generic `likes` table with columns `(id, user_id, entity_type, entity_id, created_at)` and a unique key on `(user_id, entity_type, entity_id)` instead of separate tables per entity. **Why:** simpler schema and queries for “liked things”, easy to support new likeable entities (albums, playlists, etc.) without schema changes, and still easy to filter by type when needed. |
| Modules & joins             | Each module can own **multiple tables**; JOINs are allowed **only between tables of the same module**, never across modules. **Why:** keeps queries simple in the monolith but makes it easy to split modules into separate services/DBs later without rewriting every query.                                                               |
| Code structure vs URLs      | Code is grouped by module (e.g. `src/modules/catalog/{artists,tracks,...}`, `src/modules/engagement/...`), but public URLs stay resource-based (`/api/artists/:id`, `/api/tracks/:id`, not `/api/catalog/artists/:id`). **Why:** clear internal structure while keeping a clean, stable, client-friendly API.                                    |
| Cascade delete              | New backend: delete artist → in one transaction remove all likes (and related). Same for playlist → playlist_tracks. **Why:** avoids orphan rows and broken UIs; good practice in relational modeling and a strong interview story about transactional integrity.                                                                           |
| Deploy                      | First deploy (1I) can be earlier if you want. Full Cloud phase is Phase 3, after modular monolith (Phase 2). **Why:** you can get something live quickly, but deeper cloud work waits until the codebase has clear domain boundaries.                                                                                                     |
| Monolith to microservices   | Step-by-step: **modular monolith (Phase 2) before Cloud (Phase 3)**, then split into services (Phase 4). **Why:** first clean up boundaries inside one app, then deploy, then only later pay the cost of multiple services/DBs.                                                                                                             |
| Message queues              | Used for real use case: play events → SQS → worker → play counts (so you know why queues exist). **Why:** shows async patterns for something concrete (plays), instead of abstract “hello queue” examples.                                                                                                                                |
| Analytics                   | Include: popularity per artist, play counts per track (Spotify-like). **Why:** ties queues and stats back to visible product features (popular tracks, play counts) instead of only backend metrics.                                                                                                                                    |
| UI                          | Backend-first; then learn to read AI-generated React and add one small feature (e.g. play count). MERN videos in parallel. **Why:** keeps focus on backend skills but still gives you a tangible full-stack story and practice reading existing React code.                                                                             |


---

## At a glance – phases


| Phase                         | What you learn                                                                                                                                                                                                                                                                                                                                                                                                                                          | CV-style outcome                    |
| ----------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------- |
| 1. Getting started (continue) | choose project (eg, spotiry) decide on approach (waterfall - no db, close modules=ms=tables) decide monolith (we can join) pick stack and libraries install local environment POC repository -learn libs -learn project structure(package for app and lib) Project repositry user story1: register, login, like 3 artits, likes research cloud alternatives (and work locally) the POCs what we did until implementing the first user story (including) |                                     |
| 1. Backend foundation         | Docker, tests, unified search (MySQL to ES), transactions, albums/playlists, optional Mongo, first deploy                                                                                                                                                                                                                                                                                                                                               | Backend + deploy                    |
| 2. Modular monolith           | Domain modules on a single app: **no cross-domain SQL JOINs** (Phase 1 allowed joins across domains), single gateway (`/api/users`, `/api/catalog`, `/api/engagement`); modules talk to each other via **TypeScript imports/function calls**, not HTTP; each module may JOIN only its own tables (e.g. catalog joining `artists`, `artist_stats`, `artist_top_tracks_stats`, `tracks`).                                           | Structured monolith; ready to split |
| 3. Cloud                      | AWS: Parameter Store, Secrets Manager, S3, RDS, SQS, SNS, CloudWatch, IAM; OCI optional                                                                                                                                                                                                                                                                                                                                                                 | Backend + Docker + AWS              |
| 4. Microservices              | Split services - replacing alls to module to calls to service (via http) separate DBs (amos: seperate table\mongo collection doe now), API gateway                                                                                                                                                                                                                                                                                                      | Microservices architecture          |
| 5. Message queues             | SQS, play events to worker                                                                                                                                                                                                                                                                                                                                                                                                                              | Async processing with SQS           |
| 6. Analytics                  | Play counts, popularity                                                                                                                                                                                                                                                                                                                                                                                                                                 | Event-driven analytics              |
| 7. Open source                | Read + 1 merged PR                                                                                                                                                                                                                                                                                                                                                                                                                                      | Open source contributor             |
| 8. UI / MERN                  | Read AI frontend, one UI feature, MERN videos                                                                                                                                                                                                                                                                                                                                                                                                           | Full-stack                          |
| 9. Deeper cloud               | Lambda, API Gateway, OCI                                                                                                                                                                                                                                                                                                                                                                                                                                | Serverless + observability          |


---

## Phase 0 – Backend foundation introduction

### - choose project: spotify

### - choose to work with monolith (not API GW and ms)

```
    we develop modules  
    in ms, each module is mongo collection \ sql table and we do not do joins   
   (actually, sepreate db). to get data from other module we use http client   
    (axios calling endpoint of other service to read by id)  
    im monolith, keep the modles , but we can join with data from other module
```

- choose to focus on backend and let ai generate the frontend  
- choose development strategy  
 good for learning:  
 user stroy => extract screens and endpoints =>  
 for each endpoint do eceution plan and implement and then ask ai to implement screen  
 slower if you want real project:  
 user ai to plane api and service interfaces, no db for now  
 then jsut ask api to implement

### -choose stack for project

```
DB   MySQL    
        (later we can split to Mongo without changing API as long as we are on monolthO
```

### FW  express  (not fastify)

```
Node             functional programming  
React (responsive , not native) -   Not NestJS
```

  choose libraries:  

### for logging use pino

```
     for validation use zod instead fastify
```

### -POCs repository to learn language, libraries, stack , building solution etc

### - create repositry for project on git and clone it locally

### - implement backend: register, login, auth middlware

### - think of the app - see doc to understand its modules

### - focus:  (first) user story - backend and frontend end

- choose development enviorment: local MYSQL, local app-rest-api, local client-app
- install what needed 
- pick user story and define it
  - user registers (no screen for now)
  - login screen
  - if user has less than 3 likes, ask him to search artits and mark it followed (added to like)
  - then, show library with list of likes
  - seatch can allow him to search. on enter hit, sohw matching artitsts and let him hit follow to add the artists to its likes
- planing
  - plain screens
  - plan backend endpoints (and modules)
  - plan db
- implementation agent
  - crate new serverWorkspace with the app-rest-api and lib-common
  - implement the lib-common (from POC) - regine: indepandent of domain (spotify)
  - implement backend endpoints, one by one. for each backend endpoint 
    - create branch
    - create oepraiton template  with tables and method signatures
    - create db table if needed
    - ask ai to implement methods in terfaces (hopefully no need to refine)
    - ask ai to implement by ...
    - review with api
    - test 
    - commit
  - ask ai to implement frontend 
  - test locally (start rest api and then start react app)
- stop to create this learning plan 
  - can be high level
  - each step, i decide if i want other order
  - critical: to focus on develpment - see you cab run aws locally without  the console click hell

## Phase 1 – Backend foundation

**Decisions (Phase 1)**

- **Docker:** Use for deployment only.  
Day-to-day dev: local React frontend + local Node API + local MySQL.  
For deployment, **minimum** is **API in containers** (Dockerfile + Compose).  
MySQL and frontend in Docker are optional; API-only with external MySQL is acceptable.

---

### 1A Docker – API in containers (MySQL optional)

- **Goal (what we want to learn):**  
Run the backend API in a container using a Dockerfile and docker-compose,  
so deployment uses a reproducible environment and the server does not need local Node installed.   
- **On screen (how we use it):**
  - **during development everything runs locally (check with AMOS)**
    - **MySQL** Database       runs locally instance. (Note: some use a remote DB, e.g. Mongo on cloud.) 
      - Regine: install locally
      - Amos: can access free db on cloud instead installing locally or running in docker locally (atalas for Mongo)
      - Yossi: runs locally with docker
    - Backend API               runs locally from `serverWorkspace/app-rest-api` (e.g. `npm start`).  
      - Regine: run locally
      - Amos: run loclly, not dealing with docker
      - Yossi:  before upload, run locally with docker to ensure it will work on prod
    - Frontend                    runs locally from `clientWorkspace-AI` (e.g. `npm run dev` in the React app).  
      - Regine: run locally
      - Amos: run loclly, not dealing with docker
    - Data flow:                   **local frontend → local API → local MySQL**.
- **Before deployment (Docker) – minimum (what we do):**  
  - MySQL stays **external** (local or remote); API connects via env (e.g. `DB_HOST`).  
  - Backend API               runs inside a Docker container (image built from the repo).
    - Run with `docker compose up` from `serverWorkspace` (compose file has one service: `api`).
  - Frontend                    runs locally from `clientWorkspace-AI` (e.g. `npm run dev` in the React app).  
  - Data flow:                    **local frontend** **→ API container → external (local or remote) MySQL**.
- **User story:** As a developer, I run the API the same way when I deploy so the server environment is consistent.
- **CV line:** Containerized Node API with Docker Compose.

**Files we add for Docker (names, paths, goal):**

All three files live in **one place**: `serverWorkspace/`. Run `docker compose up` from `serverWorkspace`. Naming is the standard one (no simpler convention): `Dockerfile`, `docker-compose.yml`, `.dockerignore`.


| File                   | Path                                 | Goal (in plain words, with example)                                                                                                                                                                                                                                                                             |
| ---------------------- | ------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **.dockerignore**      | `serverWorkspace/.dockerignore`      | Tells Docker which files *not* to send when building (e.g. `node_modules`, `.env`, `*.log`). Goal: smaller, faster builds and no risk of copying secrets into the image. Lives next to the Dockerfile so it applies to the same build context.                                                                 |
| **Dockerfile**         | `serverWorkspace/Dockerfile`         | Goal: commands to copy,build and start the rest-api Recipe to build the API image: start from a Node image, copy `app-rest-api` + `lib-common`, run `npm install` and build, then start the server (e.g. `node dist/server.js`). Note: the server needs no Node installed—everything runs inside the container. |
| **docker-compose.yml** | `serverWorkspace/docker-compose.yml` | Goal: one command starts the API in a reproducible way. Defines the **api** service (one service for now) so you can run `docker compose up` from `serverWorkspace`. Passes env vars (e.g. `DB_HOST=host.docker.internal`) so the API in the container can reach your MySQL.                                    |


- **Optional (later):**  
  - Frontend - check with AMOS
    - Yossi: frontend does not run from container
    - Yossi: frontend files ensposed as directory on S3
    - AI: seperate ontainer (e.g. Nginx).
  - MySQL  - check with AMOS
    - in a Docker container with a data volume.  
    - Then data flow: **frontend container → API container → MySQL container**.
    - **DB updates (when we add tables):** Migrations/SQL scripts in the repo.  
    When schema changes, run them against your MySQL (container or external) as usual;  
    if MySQL is in Docker, use CLI or `docker exec`;  
    data/schema in a volume persist between restarts.
    - 

### 1C Automated API tests (Jest/Vitest + Supertest)

- **Goal:** Integration tests for main flows; run with `npm test`.
- **On screen:** Terminal: pass/fail; no UI change.
- **User story:** As a developer, I know register, login, likes, search still work after changes.
- **Endpoints to cover:** `POST /auth/register`, `POST /auth/login`, `GET /me/profile`, `POST /me/likes`, `GET /me/likes`, `GET /search/...` (current).
- **CV line:** Integration tests for REST API using Jest/Vitest and Supertest.

### 1D Unified search – single endpoint, MySQL FULLTEXT

- **Goal:** One search box for artists + songs (and optionally albums). One endpoint with `?query` and `type`.
- **On screen:** Search page with sections: Artists, Tracks (and optionally Albums).
- **User story:** As a user, I type once and see artists and tracks together.
- **API:** `GET /search?q=<query>&type=artists|tracks|albums|all`. Response shape (example): `{ "artists": [], "tracks": [], "albums": [] }`.
- **DB:** Table `searchable_entities` (or FULLTEXT on `artists` / `tracks`) so one place drives full-text search.
- **CV line:** Unified search API with MySQL FULLTEXT (single endpoint, multi-entity).

### 1E Transactions – cascade delete (artist, playlist)

- **Goal:** Deleting an artist or playlist keeps data consistent (no broken likes or orphan playlist_tracks).
- **On screen:** After delete artist, no likes pointing to that artist. After delete playlist, playlist and its tracks gone.
- **User story:** As an admin/user, when I delete an artist or playlist, I never see broken references.
- **API:** `DELETE /artists/:artistId` – in one transaction delete artist + all likes (and related). `DELETE /playlists/:playlistId` – in one transaction delete playlist + all `playlist_tracks`.
- **CV line:** Transactional deletes in Node/MySQL (cascade likes and playlist_tracks).

### 1F Albums + playlists (domain)

- **Goal:** Like albums, see album details + songs, create/rename playlists, add songs (or album) to playlist.
- **On screen:** Album page with tracks; playlist list; New playlist, Rename, Add to playlist; playlist shows its tracks.
- **API – Albums:** `GET /albums/:albumId`, `POST /me/albums/:albumId/like`, `DELETE /me/albums/:albumId/like`.
- **API – Playlists:** `POST /me/playlists`, `PATCH /me/playlists/:playlistId`, `GET /me/playlists`, `GET /me/playlists/:playlistId`, `POST /me/playlists/:playlistId/tracks` (body `{ "trackId" }` or `{ "trackIds" }` for bulk).
- **Tables (concept):** `albums`, `album_tracks` (or existing track/album relation); `playlists`, `playlist_tracks`; `user_album_likes` (or equivalent).
- **CV line:** REST API for albums, playlists, and track assignment; relational modeling in MySQL.

### 1G Search v2 – Elasticsearch (same API)

- **Goal:** Same `GET /search?q=&type=` contract; swap backend to Elasticsearch.
- **On screen:** Same search UI; better relevance/typo tolerance at scale.
- **User story:** As a user, search stays fast and relevant as catalog grows.
- **API:** Same `GET /search?q=&type=artists|tracks|albums|all`. Optional: `POST /admin/search/reindex` to rebuild index from MySQL.
- **CV line:** Migrated search from MySQL FULLTEXT to Elasticsearch; same API, better scale/relevance.

### 1H Optional – MongoDB (e.g. user preferences)

- **Goal:** One use case in MongoDB (e.g. preferences); MySQL stays source of truth for core data.
- **On screen:** e.g. Settings with theme/default view saved and restored.
- **API:** `GET /me/preferences`, `PUT /me/preferences`.
- **CV line:** Used MongoDB for user preferences alongside MySQL.

### 1I First cloud deploy (PaaS or VM + managed MySQL)

- **Goal:** App on a public URL; DB in cloud; config via env.
- **On screen:** Open app in browser; login, search, likes, playlists work.
- **API:** Same as local; add `GET /health` (or `/healthz`) for checks.
- **Note:** You can do this step earlier (e.g. right after Phase 1) if you want a live URL sooner; full Cloud (Phase 3) comes after modular monolith (Phase 2).
- **CV line:** Deployed Node API and MySQL to cloud with env-based config.

Phase 1 total: about 2–3 weeks. After this you have a strong backend + deploy story.

---

## Phase 2 – Modular monolith (stepping stone)

- **Goal:** Turn the Phase 1 monolith into a **modular monolith**: clear domains (users, catalog, engagement), single HTTP entry, and **no cross‑domain SQL JOINs**.
- **On screen:** No visible change; same search, library, playlists.
- **User story:** As a user, the app behaves the same while we clean the backend; as a developer, you can see clear module boundaries that later map to microservices.

### 2.1 How this differs from Phase 1 (monolith)

- **Phase 1 (classic monolith):**
  - One app, one DB schema; endpoints are already working.
  - It is **allowed** to JOIN tables from different domains in SQL (e.g. engagement joining `artists` + `tracks` + `likes` in one query) because everything lives in one DB.
- **Phase 2 (modular monolith):**
  - Still **one deployable app** and typically one DB instance, but we draw **domain boundaries** into four main modules:
    - `catalog` module: artists, albums, tracks, artist stats, catalog-side search tables.
    - `engagement` module: likes, playlists, follows, play events.
    - `users` module: auth, profile, sessions.
    - `search` module: Elasticsearch indices + queries (ES-only; no SQL tables, no joins).
  - **Rule:** A module can JOIN **its own tables only**. No SQL JOINs across domains.
    - Example allowed: catalog joining `artists`, `artist_stats`, `artist_top_tracks_stats`, `tracks`.
    - Example not allowed: engagement joining `artists` + `likes`. Instead, engagement calls catalog.
  - **Communication inside the monolith:**
    - We **do NOT** call other modules via HTTP here. HTTP between services comes in Phase 4 (microservices).
    - We call other modules via **TypeScript imports / function calls**, e.g.:
      - `engagement` imports a `CatalogService` (or repository/facade) from the `catalog` module.
      - `users` imports `EngagementService` when it needs likes/playlists info.

### 2.2 Structure in code (example)

- **API surface (public URLs):** Resource-based and stable, **no module name in the path**:
  - `/api/artists/:id`, `/api/artists/:id/overview`
  - `/api/tracks/:id`
  - `/api/playlists/:id`, `/api/playlists/:id/tracks`
  - `/api/auth/login`, `/api/auth/register`
- **Internal code structure:** grouped by module under `src/modules`:

```text
src/
  modules/
    catalog/
      artists/
      tracks/
      albums/
      stats/       # artist_stats, artist_top_tracks_stats, track_stats
    engagement/
      likes/
      playlists/
      plays/
    users/
      auth/
      profile/
    search/        # Search module: MySQL searchable_entities in Phase 1, Elasticsearch indices in Phase 2+
```

- **Wiring (conceptual):**
  - `app.ts` registers routers from each module (e.g. `usersRouter`, `catalogRouter`, `engagementRouter`, `searchRouter`).
  - Each router delegates to its own controller/service layer within that module.
  - “Analytics” is **not** one giant controller; instead:
    - catalog endpoints (e.g. `GET /artists/:id/overview`) live under `catalog/artists` and **use** repositories from `catalog/stats`.
    - engagement endpoints live under `engagement` and use their own tables.
  - When one module needs data from another, it calls an **imported service**, not HTTP and not a cross‑domain JOIN.

### 2.3 Example – catalog overview endpoint

**Goal:** `GET /artists/:artistId/overview` in the **catalog** module that aggregates several catalog tables but does **not** reach into engagement tables.

- **Endpoint (catalog):**
  - `GET /artists/:artistId/overview`
- **Response idea (example):**
  - `{ artist, monthlyListeners, topTracks }`
- **Tables (owned by catalog):**

| Piece of data                   | Table                          | Notes                                                                                 |
| ------------------------------- | ------------------------------ | ------------------------------------------------------------------------------------- |
| Basic artist details            | `artists`                      | Core fields: id, name, images, genres, etc.                                          |
| Monthly listeners / popularity  | `artist_stats`                 | E.g. `artist_id`, `monthly_listeners`, `popularity_score`.                           |
| Artist’s top tracks (track ids) | `artist_top_tracks_stats`      | E.g. `artist_id`, `track_id`, `rank`, `play_count`.                                  |
| Track details for top tracks    | `tracks`                       | E.g. `id`, `name`, `duration_ms`, `album_id`, etc.                                   |

- **What is allowed here:**
  - Joins across these **catalog tables** (same domain), e.g.:
    - `artists` + `artist_stats`
    - `artist_top_tracks_stats` + `tracks` (to get top‑track **name**, **length**, etc.).
- **What is not allowed here:**
  - Joining catalog tables with **engagement** tables like `user_likes`, `playlists`, `track_plays`.
  - If we later need likes/play counts, the catalog module will **import** an `EngagementService` and call it, rather than joining its tables.

### 2.4 Domain modules and their tables (Phase 2)

Assuming stats tables like `artist_stats`, `track_stats`, and `artist_top_tracks_stats`, you can group tables by module like this:

| Module       | Purpose                          | Tables / storage (examples)                                                                                                  |
| ------------ | -------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| `catalog`    | Music catalog & search (source of truth; all catalog data that ends up in search originates here)           | MySQL tables: `artists`, `albums`, `tracks`, `artist_stats`, `track_stats`, `artist_top_tracks_stats`. |
| `search`     | Search module (unified API over SQL FULLTEXT or Elasticsearch)             | Either a MySQL `searchable_entities` table (Phase 1 unified search) **or** Elasticsearch indices (Phase 2+), behind the same `/search` API. This module owns search schemas, queries, and reindex operations, and can swap storage without changing the API.                                   |
| `engagement` | User engagement – what the user does (likes, follows, playlists, play actions, plays) | MySQL tables: `likes` (generic like over artists/tracks/etc.), `playlists`, `playlist_tracks`, `user_followed_artists`, `track_play_events` (raw plays used for analytics). Even if `track_play_events` later moves to another DB for scale, it is still **owned by this module** as part of the engagement domain. |
| `users`      | Auth & profiles                  | MySQL tables: `users`, `user_profiles`, `sessions` / `refresh_tokens` (or equivalent)                                       |

- When you read **artist top songs** for the overview:
  - You **do join** `artist_top_tracks_stats` with `tracks` to get **track name and length** (and other track fields).
  - This is allowed because both tables belong to the **catalog** module.

You can think of this step as: **Phase 1 = “monolith with convenient joins everywhere”; Phase 2 = “monolith with strict domain boundaries and function‑call communication between modules.”**

- **CV line:** Modular monolith with explicit domain boundaries and API gateway; no cross‑domain JOINs, module‑to‑module calls via imports (ready to split into microservices).

---

## Phase 3 – Cloud (AWS, then OCI)

**Overall goal:** Config and secrets out of code; use S3, RDS, SQS, SNS, CloudWatch; IAM roles. Split into subphases below.

---

### 3.1 Config and secrets (Parameter Store, Secrets Manager, IAM)

- **Goal:** No config or secrets in code; app reads at startup from AWS; local dev still uses env override.
- **User story:** As a developer, I deploy without putting DB host, bucket names, or passwords in the repo; the app gets them from AWS at runtime (or from env locally).
- **Services:** AWS Systems Manager Parameter Store (e.g. `/app/db/host`, `/app/s3/bucket`), AWS Secrets Manager or SSM SecureString (DB password, JWT secret). App uses IAM role when running in AWS (no access keys in code).
- **Endpoint:** None new; existing endpoints work; app reads config/secrets once at startup.
- **On screen:** No visible change; app runs in cloud with same behaviour.
- **CV line (for Phase 3):** AWS: Parameter Store, Secrets Manager, IAM; config and secrets out of code.

---

### 3.2 Database in cloud (RDS)

- **Goal:** MySQL runs in AWS RDS; app connects using config from Parameter Store and credentials from Secrets Manager.
- **User story:** As a developer, the database is managed (backups, patches) and the API connects to it without hardcoding host or password.
- **Services:** Amazon RDS (MySQL). Connection string or host/port from Parameter Store; password from Secrets Manager.
- **Endpoint:** None new; all existing API endpoints now talk to RDS instead of local MySQL.
- **On screen:** Same app; data lives in RDS (e.g. login, search, likes work against cloud DB).
- **CV line:** RDS for MySQL; connection via Parameter Store + Secrets Manager.

---

### 3.3 Object storage – album/artist art (S3)

- **Goal:** Store album/artist cover images in S3; API returns URLs; no binary in DB.
- **User story:** As a user, I see cover art that is loaded from S3; as a developer, uploads go to S3 and only the URL is stored in the DB.
- **Services:** Amazon S3 (bucket for images); IAM so the API can read/write that bucket.
- **Endpoint (example):** `POST /artists/:artistId/cover` (multipart or URL) → upload to S3, save URL in DB. Existing `GET /artists/:id` (or album endpoints) return `coverImageUrl` pointing to S3.
- **On screen:** Artist/album pages show images loaded from S3 URLs.
- **CV line:** S3 for asset storage; REST API for upload and URL in responses.

---

### 3.4 Message queue – play events (SQS)

- **Goal:** When a user plays a track, the API sends a message to SQS; a worker (Phase 5) will consume it and update play counts. Request path stays fast.
- **User story:** As a user, when I press play, the app responds immediately; as a developer, the play event is queued for later processing so the API does not do heavy writes on the request path.
- **Services:** Amazon SQS (queue for play events). API has IAM permission to send messages.
- **Endpoint (example):** `POST /play` body `{ "trackId" }` (or extend existing play flow): API validates, then sends `{ userId, trackId, playedAt }` to SQS and returns 202. No DB write for play count in this request.
- **On screen:** Play button works; play count may appear after Phase 5 worker runs.
- **CV line:** SQS for async play events; decoupled API from analytics writes.

---

### 3.5 Notifications (SNS) – optional

- **Goal:** Publish events (e.g. new release, follow artist) to an SNS topic; optional subscribers (email, push, or another service).
- **User story:** As a user, I can eventually get notified about new releases or artist updates; as a developer, I publish to a topic and don’t care who consumes it.
- **Services:** Amazon SNS (topic). API publishes message when e.g. new album is added or user follows artist.
- **Endpoint:** No new public endpoint required; internal use: after `POST /artists/:id/albums` or “follow artist”, API publishes to SNS. Optional: `GET /me/notifications` if you add a consumer that writes to a table.
- **On screen:** Optional: notifications list or email; can be minimal (e.g. log in CloudWatch that message was published).
- **CV line:** SNS for event notification; optional push/email subscribers.

---

### 3.6 Observability (CloudWatch)

- **Goal:** Logs and metrics in CloudWatch; alarms for errors (e.g. 5xx) or queue depth (DLQ).
- **User story:** As a developer, I see logs and metrics in one place and get alerted when something goes wrong.
- **Services:** CloudWatch Logs (app logs), CloudWatch Metrics (e.g. request count, latency), CloudWatch Alarms (e.g. 5xx > 0, SQS DLQ has messages).
- **Endpoint:** Optional `GET /health` or `/healthz` for load balancer; logs/metrics come from app and SDK, not a new REST endpoint.
- **On screen:** CloudWatch console: log groups, metrics, alarm state (OK / Alarm).
- **CV line:** CloudWatch for logs, metrics, and alarms.

---

### 3.7 OCI (optional multi-cloud)

- **Goal:** One small task in Oracle Cloud (OCI): e.g. store one asset in Object Storage, or read a secret from OCI Vault, to show multi-cloud awareness.
- **User story:** As a developer, I can use OCI for at least one thing (object storage or secret) so I’m not tied to a single cloud.
- **Services:** OCI Object Storage or OCI Vault. One concrete use: e.g. backup a config file to OCI Object Storage, or read a feature-flag from Vault.
- **Endpoint:** No new user-facing endpoint; could be a cron or admin script that writes to OCI or reads from Vault.
- **On screen:** Optional: admin or script output; or app behaviour driven by OCI secret.
- **CV line:** OCI for Object Storage or Vault; multi-cloud config/asset handling.

---

**Phase 3 CV line (summary):** AWS: Parameter Store, Secrets Manager, S3, RDS, SQS, SNS, CloudWatch; OCI optional for multi-cloud.

---

## Phase 4 – Microservices (split and run)

- **Goal:** 2–3 services (e.g. auth-users, catalog, engagement), each own DB and Docker image; one gateway.
- **On screen:** Same app and URL; login, search, library, playlists work; only backend architecture changed.
- **User story:** As a user, the app still works the same but runs as separate services.
- **What to do:** Split auth-users, catalog (with Elasticsearch), engagement; separate DBs/schemas. Gateway routes `/api/auth/*`, `/api/search`, `/api/artists`, etc. to correct service. Sync: HTTP between services (e.g. engagement calls catalog for artist/track details).
- **CV line:** Split monolith into microservices (auth, catalog, engagement) with separate DBs and API gateway.

---

## Phase 5 – Message queues (play events)

- **Goal:** On play, API sends message to SQS; worker consumes and updates play data. Request path stays fast.
- **On screen:** Play is instant; play count updates in background (visible after refresh or short delay).
- **User story:** As a user, when I press play, the app responds immediately and records the play in the background.
- **What to do:** API e.g. `POST /play` sends `{ userId, trackId, playedAt }` to SQS. Worker: Node process (or Lambda in Phase 9 – Deeper cloud) reads SQS, updates `track_plays` or `play_counts`.
- **CV line:** AWS SQS for async play-event processing; decoupled API from analytics writes.

---

## Phase 6 – Analytics (play counts, popularity)

- **Goal:** Play events to play counts; API exposes play_count per track and popularity per artist.
- **On screen:** Track rows show X plays; artist page shows Popular tracks.
- **User story:** As a user, I see how many times a track was played and which artists/tracks are popular.
- **API (examples):** `GET /tracks/:trackId/plays` or embed `playCount` in track/artist responses; `GET /artists/:artistId/popularity` or popular tracks in artist response.
- **Data:** `track_plays` or `play_counts` updated by Phase 5 (Message queues) worker.
- **CV line:** Play-count and popularity analytics driven by SQS events and REST API.

---

## Phase 7 – Open source

- **Goal:** Read a Node/TS codebase; submit at least one PR (bug, docs, small feature).
- **On screen:** GitHub PR(s).
- **User story (you):** As a developer, I contribute to open source to show collaboration and real Node/TS experience.
- **CV line:** Open source contributor to [project] (PR #…).

---

## Phase 8 – UI / MERN (read AI frontend + one feature)

- **Goal:** Read the React app (auth, API calls, state); add one visible feature (e.g. play count on track).
- **On screen:** e.g. Plays column or Recently played section that you implemented.
- **User story:** As a user, I see a feature you built so the app feels complete and you own full stack.
- **What to do:** Trace one flow in `clientWorkspace-AI` (e.g. login to library). MERN/React videos: routing, REST consumption, state. Add one UI feature that uses your API (e.g. play count, recent plays).
- **CV line:** Full-stack Spotify-like app: Node/Express + React; extended frontend with analytics (play counts).

---

## Phase 9 – Deeper cloud (Lambda, API Gateway, OCI)

- **Goal:** Lambda (e.g. SQS consumer), API Gateway (managed), CloudWatch; optional OCI equivalents.
- **On screen:** CloudWatch dashboards; play events may be processed by Lambda.
- **CV line:** AWS Lambda, API Gateway, CloudWatch; OCI for serverless/observability.

---

## Optional extra features (only if you want)

- Follow artist + new release notifications
- Share playlist (public link)
- Recently played list
- Lyrics (e.g. `GET /tracks/:id/lyrics`)
- Recommendations (because you liked X)

Use these as small learning projects after the main path.

---

## How to use this plan

1. Pick the next step number (e.g. 1 = backend foundation, 2 = modular monolith, 3 = cloud).
2. For that step: implement only that goal (endpoints, tables, tests).
3. Check on screen and user story; when it's done, add the CV line and move on.
4. If you say which step you're on, the next breakdown can be: exact files, request/response examples, and DB migrations for your repo.

Order summary: MySQL + unified search, then Elasticsearch, then optional Mongo. Cascade deletes and albums/playlists in Phase 1. **Modular monolith (Phase 2) before Cloud (Phase 3)** so you structure the codebase locally, then deploy. Deploy (1I) can be moved earlier. After Cloud: microservices (4), message queues (5), analytics (6), then open source, UI, deeper cloud. Queues and analytics tie to a real use case (plays). This order is chosen for interviews and real-world relevance.