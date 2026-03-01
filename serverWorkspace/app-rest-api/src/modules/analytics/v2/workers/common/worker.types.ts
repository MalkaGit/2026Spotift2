/**
 * Types for the v2 track-events worker (full rebuild). No batchSize; no checkpoint.
 */
export interface WorkerConfig {
  intervalMs: number;
  firstRunDelayMs?: number;
}

export interface RebuildResult {
  ok: boolean;
  error?: string;
}
