/**
 * Types for the track-play projection rebuild worker.
 */
export interface WorkerConfig {
  intervalMs: number;
  firstRunDelayMs?: number;
}

export interface RebuildResult {
  ok: boolean;
  error?: string;
}
