/**
 * Types for the track-play incremental projection worker (v3).
 */
export interface WorkerConfig {
  intervalMs: number;         //interval in milliseconds at which the worker is triggered
  firstRunDelayMs?: number;   //delay the first run of the worker by this amount of milliseconds
  batchSize: number;          //number of events to read in one batch each time the worker is triggered by the interval
}

export interface RebuildResult {
  ok: boolean;
  error?: string;
}
