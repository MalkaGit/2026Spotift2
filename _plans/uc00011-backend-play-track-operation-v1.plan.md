---
title: UC00011 – Backend play-track operation v1 (direct)
status: draft
---


## Use case

**UC00011 – Play track.**  
A logged-in user plays a track (e.g. from the app). The backend records the play and updates analytics projections. Later, Get Artist Overview returns the latest data.

**User flow (end-to-end)**

1. User opens the artist overview page (from library or search).
2. Artist page shows, among other things: **top 10 tracks** ordered by total plays desc; per track: rank, track name, total plays, duration, album.
3. User hovers over a track row → rank becomes a play icon.
4. User clicks play → track plays (playback not in scope for this UC).
5. Backend updates projection tables **directly in the request** (no event table, no worker).
6. When the user opens the same artist overview again, **total plays** reflect the new play. **Monthly listeners** are not updated in v1.


## HLD: Architecture

- **API write flow**  
  POST play API writes **directly** to projection tables in one transaction: `track_stats`, `artist_stats` (total_plays only), `artist_top_tracks_stats`, `artist_top_tracks_denorm`. No `track_events` table; no background worker.

- **Projection tables updated by v1 API**  
  - `track_stats` — play count per track.  
  - `artist_stats` — **total_plays** only (monthly_listeners not updated in v1).  
  - `artist_top_tracks_stats` — play count per (artist_id, track_id).  
  - `artist_top_tracks_denorm` — denormalized top tracks per artist.

- **API read flow**  
  Get artist overview API reads projection tables (unchanged; out of scope for this UC).


## HLD: Changes from previous version

- **v1** = direct update: one request updates all projection tables in one transaction. No event store, no worker. Simplest option; trade-off: request does more work; monthly_listeners not supported in v1. **v1 supports only low scale** — on high scale we may get **hot rows**: if the same track is played concurrently by many API requests, they all contend for a lock on the same row(s), causing lock contention and latency.
- **v2** = full rebuild of projections on a schedule. Improves scalability (less hot rows). **Works only if the events table does not grow** unbounded — at high event volume, full rebuild becomes expensive or infeasible.
- **v3** = event table + worker (incremental, supports monthly_listeners). **More scalable** for a large events table (processes only new events). **Limited to a single worker** (no horizontal scaling of the worker today).


## HLD: API endpoint – write path & flow

- **Method**: `POST`
- **Path**: `/analytics/v1/tracks/:trackId/play`
- **Description**: Record a play for the given track by directly updating projection tables.
- **Path params**: `trackId` – track ID (UUID), same validation as v2/v3.
- **Request body**: ignored (no body required).
- **Responses**: `204 No Content` on success; `400 Bad Request` if trackId is not a valid UUID; `404 Not Found` if the track does not exist.


## HLD: Database

No new tables. Uses existing tables from `serverWorkspace/REAME/scripts/db_schema.md`:

- **Read by v1 API**: `track_artists` (to get artist_id(s) for the track; one play can update multiple artists). Optionally `tracks` / `albums` for denorm fields.
- **Written by v1 API**: `track_stats`, `artist_stats`, `artist_top_tracks_stats`, `artist_top_tracks_denorm`. All updates in a single transaction.

Existing projection tables: 
artist_stats, artist_top_tracks_stats, artist_top_tracks_denorm, track_stats.


## HLD: API writer flow

1. Validate `trackId` (UUID); ensure track exists (e.g. via catalog or DB).
2. Get (artist_id, track_id) pairs for this track from `track_artists` (one row per artist; multi-artist tracks get multiple pairs).
3. In **one DB transaction**: upsert/update  
   - `track_stats` (increment play count for this track),  
   - `artist_stats` (increment total_plays per artist; do **not** update monthly_listeners),  
   - `artist_top_tracks_stats` (increment per (artist_id, track_id)),  
   - `artist_top_tracks_denorm` (enrich with track/album if needed, upsert total_plays).  
4. Commit; return 204. On failure, roll back and return 5xx or 404 as appropriate.


## HLD: Worker & flow

Not used in v1. All updates are done in the API request.


## HLD: read flow

- **Method**: `GET`
- **Path**: `/artist/:artistId/overview` (or equivalent)  
  Out of scope for this UC. Overview reads projection tables; in v1, total_plays are up to date, monthly_listeners are not updated by v1.


## HLD: Modules & table ownership


- **Analytics v1 API** — Goal: record play and update projections directly. Owns (writes): `track_stats`, `artist_stats`, `artist_top_tracks_stats`, `artist_top_tracks_denorm`. Reads: `track_artists` (catalog) and optionally tracks/albums for denorm. No worker in v1.

- **Catalog** — Goal: entity data (artists, tracks, albums) and their relationships. Owns: `artists`, `tracks`, `albums`, `track_artists`.


**Rules**

- Each module has a clear goal and owns one or more tables (ownership = who writes).
- No other module may write to a table owned by another module.
- Other modules may read tables they do not own (monolith: repo/service; MS: HTTP or async).

**Example.** Analytics v1 API reads `track_artists` (catalog); artist overview reads `artist_stats`, `artist_top_tracks_denorm` (analytics). That is allowed.




## LLD: Entry points (where they live)

Paths under `app-rest-api/src/modules/`:

- **API write** — `POST /analytics/v1/tracks/:trackId/play` · `analytics/v1/api/tracks/tracks.router.ts` (or equivalent).


- **Worker** 
None

- **API read** (out of scope) — e.g. `GET /artist/:artistId/overview` · catalog or analytics.


## TODO checklist

- [ ] **v1 tracks API**: `POST /analytics/v1/tracks/:trackId/play` — validate trackId, ensure track exists.
- [ ] **Get artist_ids for track**: use `track_artists` (catalog or repo) to get (artist_id, track_id) pairs for the played track.
- [ ] **In one transaction**: upsert `track_stats`, `artist_stats` (total_plays only), `artist_top_tracks_stats`, `artist_top_tracks_denorm`. Do not update `artist_stats.monthly_listeners`.
- [ ] **Same API contract**: 204 on success; 400 invalid UUID; 404 track not found.


## Simplicity guidelines

- **v1 is the simplest**: no event table, no worker, direct write in the request. Fewer tables and fewer moving parts.
- Prefer fewer files and tables; reuse existing projection tables.
- Module can read tables it does not own (e.g. `track_artists`); only write to tables it owns.


## Architecture decisions (simplicity first)

- **Direct update in API (v1)**  
  - **Decision**: v1 updates projection tables directly in the play API request; no `track_events`, no worker.  
  - **Reason**: Simplest to implement and reason about; one request = one transaction = consistent view. Trade-off: request latency; no monthly_listeners in v1.  
  - **Later**: Add v3 (event + worker) for scale or monthly_listeners.

- **Track/play endpoint in analytics (not playback, not catalog)**  
  - Same as v3: expose under analytics module; analytics owns “record play for analytics.”

- **Artist monthly_listeners not in v1**  
  - **Decision**: Do not update monthly_listeners in v1.  
  - **Reason**: Keeps v1 simple; monthly_listeners requires a time-window aggregate (e.g. last 30 days). Can be added later (e.g. v3 worker or a separate job).


## Design decisions: file structure & tables

- **One v1 API module** for tracks (`analytics/v1/api/tracks/*`). No worker module in v1.
- **Reuse existing projection tables**; no new tables.
- **Single transaction** in the API for all projection updates so overview sees a consistent snapshot.

- **Single repositry method**
question: 
we are updating 3 stat tables in transnsaction.
should we have one repository method doing it
or should service manage the transaction and call 4 methods to do it

More standard is option A
Option A (single repo call, document in the service).
Common practice is:
Service = orchestration and business flow (validate, load data, then “persist”).
Repository = one cohesive persistence operation (e.g. “record this play”), which may touch several tables and own the transaction.
So having the service call a single recordTrackPlay(...) and describing in a comment that it updates “track_stats, artist_stats, artist_top_tracks_, artist_top_tracks_denorm” is the usual, standard approach. The “what tables” detail lives in the repo and in that comment, not as four separate method calls in the service.


Option B (service calling four repo methods in a transaction) is less common: it pushes transaction boundaries and “which persistence steps run” into the service, and the repo becomes a set of small, connection-taking helpers. That’s a valid design when you want the service to explicitly show every persistence step, but it’s not the default “standard” layering.

Summary: The more standard approach for analyrics is: one repo method that does all projection updates in one transaction, with the service documenting (e.g. in a comment) which tables are updated. 

Option A aligns with that; Option B is a deliberate choice to make the BL more explicit at the cost of a less typical service/repo split.





## Post Implementation summary

Paths under `analytics/v1/`.

**API**
- **Entry point**: `POST /analytics/v1/tracks/:trackId/play` · `api/tracks/tracks.router.ts`
- **Tables**: Read `track_artists` (and optionally tracks/albums). Write: `track_stats`, `artist_stats`, `artist_top_tracks_stats`, `artist_top_tracks_denorm` (total_plays only for artist_stats; no monthly_listeners).
- **Flow**: Router → controller → service → repository. Validate trackId; ensure track exists; get (artist_id, track_id) pairs; one transaction: upsert all four projection tables. Return 204, 400, or 404.

**artist_stats**: total_plays updated in v1; monthly_listeners not updated in v1.
