---
title: UC00011 – Backend play-track operation v2 (full rebuild)
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
5. Backend records the play (API writes to `track_events`); on a schedule the background worker runs a **full rebuild** of all projection tables from `track_events`.
6. When the user opens the same artist overview again, total plays and monthly listeners reflect the new play.



## HLD: Architecture

- **API**: write flow  
  `POST /analytics/v2/tracks/:trackId/play` writes to `track_events` (same event table as v3; one row per play, `event_type = 'play'`).

- **Background worker**  
  Single track-events worker triggered by a timer. Each tick it performs a **full rebuild** of all projection tables from `track_events` (filtered by `event_type = 'play'`) and `track_artists`. **No checkpoint table**; every run scans the full event history and rebuilds via shadow+swap so readers never see a half-updated state.

- **Projection tables** (same as v1/v3)  
  - `track_stats` – play count per track  
  - `artist_stats` – total_plays and monthly_listeners per artist  
  - `artist_top_tracks_stats` – play count per (artist_id, track_id)  
  - `artist_top_tracks_denorm` – denormalized top tracks per artist (from stats + tracks + albums)

- **API read flow**  
  Get artist overview API reads projection tables (unchanged; out of scope).



## HLD: Changes from previous version

- **v1** = direct update in the request; no event table, no worker. **Low scale only** (hot rows on concurrent play of same track).
- **v2** = event table + worker that does **full rebuild** on a schedule. Improves scalability (no hot rows in API). **Works only if the events table does not grow unbounded** — at high event volume, full rebuild becomes expensive or infeasible. **No checkpoint table**; structure aligned with v3 (worker + repository), but logic is full rebuild only.
- **v3** = event table + worker that does **incremental** processing with a checkpoint. More scalable for a large events table. Limited to a single worker today.



## HLD: API endpoint – write path & flow

- **Method**: `POST`
- **Path**: `/analytics/v2/tracks/:trackId/play`
- **Description**: Record a play event for the given track.
- **Path params**: `trackId` – track ID (UUID), same validation as v1/v3.
- **Request body**: ignored (no body required).
- **Responses**: `204 No Content` on success; `400 Bad Request` if not a valid UUID; `404 Not Found` if the track does not exist.



## HLD: Database

Uses the same tables as v3 (from `serverWorkspace/REAME/scripts/db_schema.md`):

- **track_events** – one row per play; no `artist_id`; worker expands via `track_artists`.
- **track_artists** – many-to-many track → artist; analytics uses it to attribute plays to artists.

**v2 does not use** `track_events_checkpoint` (v3 only).

**Projection tables** (written by v2 worker): `track_stats`, `artist_stats`, `artist_top_tracks_stats`, `artist_top_tracks_denorm`.



## HLD: API writer flow

Same as v3: validate track exists, then append one row to `track_events` with `event_type = 'play'`, `user_id`, `track_id`.



## HLD: Worker & flow

- **Start**: Read config (intervalMs, firstRunDelayMs). Start a timer loop; each run executes a full rebuild. Next run is scheduled only after the current rebuild finishes (no overlapping runs).

- **Each run (full rebuild)**:
  1. **track_stats**: shadow+swap; `INSERT INTO shadow SELECT track_id, COUNT(*) FROM track_events WHERE event_type = 'play' GROUP BY track_id`.
  2. **artist_stats**: shadow+swap; from `track_events` JOIN `track_artists`; `total_plays` = all-time count per artist; `monthly_listeners` = distinct `user_id` in last 30 days.
  3. **artist_top_tracks_stats**: shadow+swap; from `track_events` JOIN `track_artists` GROUP BY artist_id, track_id.
  4. **artist_top_tracks_denorm**: shadow+swap; from `artist_top_tracks_stats` JOIN tracks JOIN albums (only non-deleted); order matters because denorm reads from stats.

- **No checkpoint**: every tick rebuilds from the full `track_events` history. Shadow+swap ensures readers never see a half-updated table.



## HLD: Read flow

Out of scope (same as v1/v3). GET artist overview reads projection tables.



## HLD: Modules & table ownership

- **Analytics v2 API** – Goal: record play events. Owns: `track_events` (shared with v3 API if both are used).
- **Analytics v2 Worker** – Goal: full rebuild of projection tables from events. Owns: `track_stats`, `artist_stats`, `artist_top_tracks_stats`, `artist_top_tracks_denorm`. Does **not** use or own a checkpoint table.
- **Catalog** – Goal: entity data and relationships. Owns: `artists`, `tracks`, `albums`, `track_artists`. Worker reads `track_artists` and catalog tables (tracks, albums) for denorm rebuild.



## LLD: Entry points

Paths under `app-rest-api/src/modules/`:

- **API write** – `POST /analytics/v2/tracks/:trackId/play` · `analytics/v2/api/tracks/tracks.router.ts`
- **Worker** – `start()` (optional from server bootstrap) · `analytics/v2/workers/track-events.worker.ts`
- **API read** – out of scope (e.g. GET artist overview)



## LLD: File structure (aligned with v3)

- **analytics/v2/api/tracks/** – router, controller, service, repository (write to `track_events`); types (params schema).
- **analytics/v2/workers/** – `track-events.worker.ts` (loop + `rebuildAll()`), `track-events.repository.ts` (rebuildTrackStats, rebuildArtistStats, rebuildArtistTopTracksStats, rebuildArtistTopTracksDenorm); `common/worker.config.ts`, `common/worker.types.ts` (intervalMs, firstRunDelayMs; no batchSize).



## TODO checklist

- [x] **v2 tracks API**: `POST /analytics/v2/tracks/:trackId/play` (append to `track_events` with `event_type = 'play'`).
- [x] **v2 workers module**: `analytics/v2/workers/*` (track-events.worker, track-events.repository, common config/types).
- [x] **Full rebuild from track_events**: filter `event_type = 'play'`; join `track_artists` for artist attribution.
- [x] **rebuildTrackStats**: shadow+swap from track_events GROUP BY track_id.
- [x] **rebuildArtistStats**: shadow+swap from track_events JOIN track_artists; total_plays and monthly_listeners (30d distinct user).
- [x] **rebuildArtistTopTracksStats**: shadow+swap from track_events JOIN track_artists GROUP BY artist_id, track_id.
- [x] **rebuildArtistTopTracksDenorm**: shadow+swap from artist_top_tracks_stats JOIN tracks JOIN albums.
- [ ] **Wire v2 worker** from `server.ts` (optional; e.g. `workersV2.trackEventsWorker.start()`) if running v2 instead of or in addition to v3.



## Post-implementation summary

**API**  
- Entry: `POST /analytics/v2/tracks/:trackId/play` · `api/tracks/tracks.router.ts`  
- Writes one row to `track_events`. Flow: router → controller → service → repository. Returns 204, 400, or 404.

**Worker**  
- Entry: `start()` · `workers/track-events.worker.ts`. Config: `workers/common/worker.config.ts` (intervalMs, firstRunDelayMs).  
- Each tick: `rebuildAll()` → repo.rebuildTrackStats, rebuildArtistStats, rebuildArtistTopTracksStats, rebuildArtistTopTracksDenorm.  
- All rebuilds in `workers/track-events.repository.ts`; shadow+swap; no checkpoint.
