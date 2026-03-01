import type { WorkerConfig } from "./worker.types.js";

const DEFAULT_INTERVAL_MS = 60_000;
const DEFAULT_FIRST_RUN_DELAY_MS = 10_000;

/**
 * v2 worker config: intervalMs, firstRunDelayMs (no batchSize; full rebuild only).
 */
export function getWorkerConfig(): WorkerConfig {
  const intervalMs = process.env.PROJECTION_REBUILD_INTERVAL_MS
    ? parseInt(process.env.PROJECTION_REBUILD_INTERVAL_MS, 10)
    : DEFAULT_INTERVAL_MS;
  const firstRunDelayMsRaw = process.env.PROJECTION_REBUILD_FIRST_RUN_DELAY_MS;
  const firstRunDelayMs =
    firstRunDelayMsRaw != null && firstRunDelayMsRaw !== ""
      ? parseInt(firstRunDelayMsRaw, 10)
      : DEFAULT_FIRST_RUN_DELAY_MS;
  return {
    intervalMs: Number.isNaN(intervalMs) ? DEFAULT_INTERVAL_MS : intervalMs,
    firstRunDelayMs: Number.isNaN(firstRunDelayMs)
      ? DEFAULT_FIRST_RUN_DELAY_MS
      : firstRunDelayMs,
  };
}
