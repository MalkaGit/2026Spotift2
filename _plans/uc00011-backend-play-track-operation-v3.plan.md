---
title: UC00011 – Backend play-track operation v3 (incremental)
status: implemented
---

## Use case

**UC00011 – Play track.**  
A logged-in user plays a track (e.g. from the app). The backend records the play event and updates analytics projections. Later, Get Artist Overview returns the latest data.

**User flow (end-to-end)**

1. User opens the artist overview page (from library or search).
2. Artist page shows, among other things: **top 10 tracks** ordered by total plays desc; per track: rank, track name, total plays, duration, album.
3. User hovers over a track row → rank becomes a play icon.
4. User clicks play → track plays (playback not in scope for this UC).
5. Backend records the play (API writes to `track_events`); after a while the background worker processes the event and updates projection tables.
6. When the user opens the same artist overview again, total plays and monthly listeners reflect the new play.




## HLD: Architecture

- **API**: write flow
 POST track\:id\play API 
 writes to `track_events`
 (more common than `track_play_events`.)

- **background Worker**:
 track-events (single) worker triggered by timer
 to read **new** **play** events in **batches**,
 aggregate in memory.
 update checkpoint and **write bulks** into projection tables in **transaction**.

  **new** — using last processed event id from checkpoint table.
  **play** — filter `track_events` by event_type.
  **batch** — read up to LIMIT.
  **write bulks** — save round trips.
  **transction** - ensures each event is counted exactly once

**Projection tables**
  - `artist_top_tracks_denorm` – primary projection, updated incrementally from events.
  - `artist_top_tracks_stats` – optional/legacy incremental projection.
  - `artist_stats` – rebuilt periodically or incrementally per artist (see strategy below).

- **API**: read  flow
get artist\overview API reads projection tables 






## HLD: Changes from previous version

- **v1** = direct update in the request; no event table, no worker. **Low scale only** (hot rows on concurrent play of same track).
- **v2** = event table + worker that does **full rebuild** on a schedule. Improves scalability (no hot rows in API). **Works only if the events table does not grow unbounded** — at high event volume, full rebuild becomes expensive or infeasible. **No checkpoint table**; structure aligned with v3 (worker + repository), but logic is full rebuild only.
- **v3** = event table + worker that does **incremental** processing with a checkpoint. More scalable for a large events table. Limited to a single worker today.





## HLD: API endpoint  - write path & Flow 

- **Method**: `POST`
- **Path**: `/analytics/v3/tracks/:trackId/play`
- **Description**: Record a play event for the given track.
- **Path params**:
  - `trackId` – track ID (UUID), same validation as v2.
- **Request body**: ignored (no body required).
- **Responses**:
  - `204 No Content` on success.
  - `400 Bad Request` if `id` is not a valid UUID.
  - `404 Not Found` if the track does not exist.




## HLD: Database 
from `serverWorkspace/REAME/scripts/db_schema.md`

adding:
- `track_events` – single table for all track-domain events (**no artist_id**; one play = one row; worker expands via `track_artists`):
  - `id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY`
  - `event_type VARCHAR(32) NOT NULL`  -- e.g. 'play', 'pause', 'skip' (start with 'play')
  - `user_id CHAR(36) NOT NULL`
  - `track_id CHAR(36) NOT NULL`
  - `occurred_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP`

- `track_events_checkpoint` – per-worker watermark:
  - `worker_id VARCHAR(64) NOT NULL PRIMARY KEY`
  - `last_processed_event_id BIGINT NOT NULL`
  - `updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP`

- `track_artists` – many-to-many mapping from tracks to artists:
  - `track_id CHAR(36) NOT NULL` FK → `tracks.id`
  - `artist_id CHAR(36) NOT NULL` FK → `artists.id`
  - `PRIMARY KEY (track_id, artist_id)`
  
  Every track must have **at least one** row in `track_artists`.  
  Analytics (v2/v3) uses `track_artists` as the single source of truth for which artists get play events; there is **no fallback** to album → artist.

Indexes used by v3 worker: batch read uses `WHERE id > ? AND event_type = 'play' ORDER BY id ASC LIMIT ?`; an index on `(event_type, id)` supports that. Rebuild of monthly_listeners scans track_events with `event_type = 'play'` and `occurred_at >= NOW() - INTERVAL 30 DAY` joined to track_artists; index on `(event_type, occurred_at)` (or similar) helps.

Existing tables:
- existing Projection tables:
  - artist_stats
  - artist_top_tracks_stats
  - artist_top_tracks_denorm






## HLD: API writer flow
   simply appends row to `track_events` table with `event_type = 'play'`





## HLD: Worker  & Flow
- **server calls worker to start**

- **Start**: read config (interval, batch size); start a timer loop that runs the batch step every interval.

- **Each run (batch step)**:
  1. Read checkpoint (last processed event id); if none, use 0.
  2. Fetch next batch of **play** events (id > checkpoint, limited). Events have no artist_id; worker expands each to (artist_id, track_id) pairs via catalog / `track_artists`.
  3. If batch empty, exit (no checkpoint update).
  4. In a single DB transaction: apply aggregated updates to all projection tables; set checkpoint to max event id in batch; commit.
  5. Transaction ensures each event is counted exactly once.

- **Projection update strategy (HLD)**
  - **artist_top_tracks_denorm** (primary): per batch, aggregate events by (artist_id, track_id), enrich with track/album data, upsert. Does not depend on artist_top_tracks_stats.
  - **artist_top_tracks_stats** (optional/legacy): aggregate and upsert incrementally per batch.
  - **artist_stats**: **total_plays** updated incrementally per batch; **monthly_listeners** rebuilt periodically (e.g. every N ticks) via shadow+swap so readers see a consistent snapshot.





## HLD: read Flow
- **Method**: `GET`
- **Path**: `/artist/:artistId/overview`
 out of scope
 serveral versions exist
 -one that reads normalzied projection table and join (join good for monlith, not for ms)
 -other that reads de-normalzied projection
 - MS-ready vesion that reads by ids from other servcies instead join


## HLD: Modules & table ownership

- **Analytics v3 API** 
— Goal: record play events. 
Owns: `track_events`.

- **Analytics v3 Worker** 
— Goal: process events and update projection tables. Owns: `track_stats`, `artist_stats`, `artist_top_tracks_stats`, `artist_top_tracks_denorm`, `track_events_checkpoint`.

- **Catalog** 
— Goal: entity data (artists, tracks, albums) and their relationships.
 Owns: `artists`, `tracks`, `albums`, `track_artists`.

 
**Rules**

- Each module has a clear goal and owns one or more tables (ownership = who writes).
- No other module may write to a table owned by another module.
- Other modules may read tables they do not own. How they read depends on the setup:
  - **Monolith**: read tables you don’t own via repository or service (same process).
  - **MS-ready**: read via in-process service call.
  - **MS**: read via HTTP (e.g. by id instead join) or async messages; no cross-db joins.
- Modules are designed so they can become microservices later; in MS mode they communicate via HTTP or async only.

**Example.** Analytics worker reads `track_artists` (catalog); artist overview reads `artist_stats`, `artist_top_tracks_denorm` (analytics). That is allowed.






## LLD: Entry points (where they live)

Paths under `app-rest-api/src/modules/`:

- **API write** — `POST /analytics/v3/tracks/:trackId/play` · `analytics/v3/api/tracks/tracks.router.ts`

- **Worker** — `start()` (from server bootstrap) · `analytics/v3/workers/track-events.worker.ts`

- **API read** (out of scope) — e.g. `GET /artist/:artistId/overview` · catalog or analytics

## TODO checklist

- [x] **Create events tables** `track_events` and `track_events_checkpoint` in the DB schema (add to `serverWorkspace/REAME/scripts/db_schema.md` and/or migrations), including indexes (e.g. on `event_type`, `track_id`, `occurred_at` for batch read).
- [x] **Create `track_artists` table** and seed it so that every track has ≥1 artist.
- [x] **Checkpoint helpers**: `getCheckpoint(workerId)` / `setCheckpointWithConnection(connection, workerId, lastId)` in repo.
- [x] **v3 tracks API**: `POST /analytics/v3/tracks/:trackId/play` (append to `track_events` with `event_type = 'play'`).
- [x] **v3 workers module**: `analytics/v3/workers/*` (index, track-events.worker, track-events.repository, common config/types).
- [x] **getEventsSince(lastId, limit, eventType)** with row mapper; worker filters `event_type = 'play'`.
- [x] **Incremental upsert for `artist_top_tracks_denorm`**: expand events to (artist_id, track_id) via `track_artists`, aggregate deltas, enrich with track/album via repo, upsert.
- [x] **Incremental upsert for `artist_top_tracks_stats`** and **track_stats**.
- [x] **artist_stats**: incremental `total_plays` per batch; `monthly_listeners` rebuilt every 10 ticks via shadow+swap.
- [x] **processIncrementalBatch()** with checkpoint + single transaction (all upserts + checkpoint).
- [x] **Wire v3 worker** from `server.ts` (e.g. `workersV3.trackEventsWorker.start()`).


## Simplicity guidelines
- less tables 
  usually one for doamin
  eg, instead track-play-events jsut track-events
  we dont want new table for each event type that we will add

-less columns in table
 eg, no need to enrich events (tables\messages) with fields right from the begining
 Later, we can enrivh them to improve worker\consumer
 
-less modules
 eg, artist module can own reading _stats tables
 no need to create seperate _stat module
module can read tables it does not owns (doesnt write to)

-less files
 eg, sinlge track-events.worker file instead: consumer,processor, main etc

-assume scale is not too high
 no need for prematured optimizations
-Later we can split 



## Architecture decisions (simplicity first, later we can …)

- **No artist_id in track_events (one play = one row)**
  - **Decision**: Do not add an `artist_id` column to `track_events`. One play creates a single row. Artist attribution is done in workers by joining with `track_artists`.
  - **Reason**: A track can have many artists (via `track_artists`). Storing one row per play (without artist_id) keeps the event table simple and makes it easy to process (e.g. count how many times a specific track was played). Workers expand each play to (artist_id, track_id) via `track_artists` when updating projections.
  - **Later, if needed**: If we ever need to query events by artist at ingestion time, we could add an index or a separate table; for now, expansion at read time is sufficient.

- **Guideline: simplicity first**
  - **Decision**:
   Prefer the simplest number of tables, modules, files and flow that works (mirror v2, one worker, one checkpoint table). 
   Later on, if needed, we can split and add complexity. but one table, module, file makes it easier to find things later on 
   
  - **Reason**: Easier to implement, test, and reason about; avoids premature abstractions.
  - **Later, if needed**: Split responsibilities into multiple workers or services (e.g. separate worker for `artist_stats` vs `denorm`), or introduce a more generic event-processing framework.

- **Events table per domain (not per tiny event type)**
  - **Decision**: Use `track_events` for all track-domain events (play now, later pause/skip/etc.) with an `event_type` column. Add similar tables for other domains later (e.g. `album_events`, `artist_events`) if needed.
  - **Reason**: Reasonable number of tables and streams, each with a stable schema; analytics workers can read “all track events” from a single place and aggregate state without joining or uniting multiple event tables.
  - **Later, if needed**: Add more event types to `track_events`, or introduce `album_events` / `artist_events` tables for their domains.

- **Track/play endpoint in analytics (not playback, not catalog)**
  - **Decision**: Expose `POST /analytics/v3/tracks/:trackId/play` under the **analytics** module; do not put it in a playback domain or in catalog.
  - **Reason**:
    - **Analytics**: The only purpose of this call is to record a play **for analytics** (monthly listeners, top tracks, projections). The write goes to `track_events`, which is consumed only by analytics workers. Keeping the endpoint in analytics matches “record a play event for analytics” and avoids an extra hop or module.
    - **Not playback**: A **playback** domain would own “now playing”, play history, resume position, etc. We do not have that domain yet, and the operation does not depend on it. If we add playback later, playback can call analytics (or emit an event) to record the play; the source of truth for “user played track” for **reporting** stays in analytics.
    - **Not catalog**: **Catalog** owns entity data (tracks, albums, artists metadata and CRUD). “User played this track” is an **event/action**, not catalog data. Putting it in catalog would mix user actions with entity management and blur boundaries.
  - **Later, if needed**: If a playback domain is introduced, keep “record play for analytics” in analytics; playback can invoke it or publish an event that analytics consumes.

  

- **Read events in batches**
  - **Decision**: Worker always reads events with `WHERE id > ? ORDER BY id ASC LIMIT batchSize` rather than row-by-row.
  - **Reason**: Fewer DB round-trips, better throughput, and easier backpressure control.
  - **Later, if needed**: Tune `batchSize` per environment, add dynamic backoff, or shard by key (e.g. by artist) if one worker isn’t enough.

- **Write projections in bulk**
  - **Decision**: Aggregate in memory per key (e.g. `(artist_id, track_id)`), then upsert multiple rows in a few statements (bulk `INSERT ... ON DUPLICATE KEY UPDATE`), not one write per event.
  - **Reason**: Greatly reduces write amplification and lock contention; makes the worker efficient even as data grows.
  - **Later, if needed**: Move heavy aggregation to a dedicated ETL job, or use more advanced storage (e.g. columnar/analytical DB) for very large datasets.

- **Update watermark and projections in one transaction**
  - **Decision**: Always update projection tables and `track_events_checkpoint.last_processed_event_id` in the same DB transaction.
  - **Reason**: Ensures we never advance the checkpoint without having successfully updated projections; simple at-least-once processing with effectively exactly-once projections (via idempotent writes).
  - **Later, if needed**: Introduce more sophisticated exactly-once patterns (e.g. storing per-batch ids, or using an external log/queue with transactional consumers) if consistency requirements get stricter.

- **event_type stored as string (VARCHAR), not ENUM**
  - **Decision**: Store `event_type` as `VARCHAR(32)` rather than an ENUM or numeric id.
  - **Reason**: At our scale this is “good enough”: easy to add new event types without ALTER TABLEs, values are self-describing (e.g. 'play', 'pause', 'skip'), and indexing on `(event_type, ...)` remains straightforward.
  - **Later, if needed**: If we reach very high volume and need tighter storage, we can introduce a small lookup table and use a numeric `event_type_id`, or migrate to ENUMs once the set of event types stabilizes.

- **Worker filters on play events in the database (not in memory)**
  - **Decision**: The v3 worker always reads from `track_events` with `WHERE event_type = 'play'` and appropriate composite indexes, instead of reading all track events and filtering in memory.
  - **Reason**: Letting the DB filter and use indexes reduces IO and network, and keeps the worker’s CPU focused on relevant rows. It also behaves well as we add more event types to `track_events`.
  - **Later, if needed**: We can add more workers that filter on other event types (e.g. pause/skip) using the same pattern.

- **Indexes include event_type; cost driven by number of indexes, not columns**
  - **Decision**: Composite indexes on `track_events` include `event_type` (e.g. `(event_type, artist_id, occurred_at)` and `(event_type, track_id, occurred_at)`).
  - **Reason**: This lets queries efficiently filter to `'play'` events while grouping by artist/track and time. The main cost driver for inserts is the number of indexes, not how many columns each index contains; moving from `track_play_events` to `track_events` with equivalent indexes does not materially worsen insert or read performance.
  - **Later, if needed**: We keep the number of indexes small and targeted; if write load grows very high, we can revisit partitioning or offload some analytics to a dedicated event/warehouse system.










 ## Design decisions: file structure & tables

- **Guideline: simplicity first**
  - Prefer **fewer files and tables** that are easy to navigate and reason about.
  - Start by **mirroring v2** (same folders/files), then evolve only if there’s a clear pain.

- **Files / modules**
  - Keep **one v3 worker module** for tracks (`analytics/v3/workers/*`) instead of splitting into many tiny workers per operation.
  - Keep **one v3 API module** for tracks (`analytics/v3/api/tracks/*`) instead of separate folders per minor variation.
  - **Only create a new file/module** when:
    - The code would otherwise become confusing/huge, or
    - You need a clearly separate responsibility (e.g. a shared checkpoint repo).

- **DB tables**
  - Default to **reusing existing tables** (`track_play_events`, `artist_*` projections).
  - Add a **new table only** when:
    - The data shape is fundamentally different, or
    - The query patterns can’t be supported cleanly with existing tables/indexes.
  - Avoid creating a new table for every small operation unless you have a concrete analytics/read need.

- **Future scaling**
  - If v3 becomes too coupled or slow, then:
    - Split the worker into multiple workers (e.g. one for `artist_stats`, one for `denorm`),
    - Or introduce additional tables/indices for specific heavy use-cases.
  - Until then, **opt for the simplest layout that works**.










  
## Post Implementation summary 

Paths under `analytics/v3/`.

**API**
- **Entry point**: `POST /analytics/v3/tracks/:trackId/play` · `api/tracks/tracks.router.ts`
- **Tables**: Write `track_events`.
- **Flow**: Router → controller → service → repository. Validate trackId; ensure track exists; INSERT one row into `track_events`. Return 204, 400, or 404.

**Worker**
- **Entry point**: `start()` · `workers/track-events.worker.ts` (called from `server.ts`). Config: `workers/common/worker.config.ts`
- **Tables**: Read `track_events`, `track_events_checkpoint`. Write: four projection tables + checkpoint; every 10th tick rebuild writes `artist_stats` (shadow+swap).
- **Flow**: Loop via `setTimeout`. Each tick: (1) checkpoint, (2) getEventsSince, (3) expand via catalog, (4) compute deltas, (5) one transaction: four upserts + checkpoint. Every 10th tick: rebuildArtistMonthlyListeners. DB in `workers/track-events.repository.ts`.

**artist_stats**: total_plays per batch; monthly_listeners every 10 ticks (shadow+swap, atomic).
