/**
 * Track-play projection rebuild worker.
 * Rebuilds artist_stats, artist_top_tracks_stats, artist_top_tracks_denorm from track_play_events on a timer.
 */
export { start as startTrackEventsWorker } from "./track-events.worker";
export { getWorkerConfig } from "./common/worker.config";
export type { WorkerConfig, RebuildResult } from "./common/worker.types";
