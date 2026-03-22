# Entry points → plan docs

Map from API endpoints and workers/consumers to their design and implementation plans. Paths under repo root.

**API**
- `POST /analytics/v1/tracks/:trackId/play` · `app-rest-api/.../analytics/v1/api/tracks/tracks.router.ts` → [UC00011 Play track (v1)](uc00011-backend-play-track-operation-v1.plan.md)
- `POST /analytics/v3/tracks/:trackId/play` · `app-rest-api/.../analytics/v3/api/tracks/tracks.router.ts` → [UC00011 Play track (v3)](uc00011-backend-play-track-operation-v3.plan.md)

**Worker**
- `start()` (track events v3) · `app-rest-api/.../analytics/v3/workers/track-events.worker.ts` → [UC00011 Play track (v3)](uc00011-backend-play-track-operation-v3.plan.md)
