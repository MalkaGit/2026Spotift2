import type { WorkerConfig } from "../types/worker.types";

const DEFAULT_INTERVAL_MS = 60_000;
const DEFAULT_FIRST_RUN_DELAY_MS = 10_000;
const DEFAULT_BATCH_SIZE = 500;

/**
 * Feeds v4a worker configuration from environment or defaults.
 */
export function getWorkerConfig(): WorkerConfig {
  const intervalMs = process.env.FEEDS_WORKER_INTERVAL_MS
    ? parseInt(process.env.FEEDS_WORKER_INTERVAL_MS, 10)
    : DEFAULT_INTERVAL_MS;

  const firstRunDelayMsRaw = process.env.FEEDS_WORKER_FIRST_RUN_DELAY_MS;
  const firstRunDelayMs =
    firstRunDelayMsRaw != null && firstRunDelayMsRaw !== ""
      ? parseInt(firstRunDelayMsRaw, 10)
      : DEFAULT_FIRST_RUN_DELAY_MS;

  const batchSizeRaw = process.env.FEEDS_WORKER_BATCH_SIZE;
  const batchSize =
    batchSizeRaw != null && batchSizeRaw !== ""
      ? parseInt(batchSizeRaw, 10)
      : DEFAULT_BATCH_SIZE;

  return {
    intervalMs: Number.isNaN(intervalMs) ? DEFAULT_INTERVAL_MS : intervalMs,
    firstRunDelayMs: Number.isNaN(firstRunDelayMs)
      ? DEFAULT_FIRST_RUN_DELAY_MS
      : firstRunDelayMs,
    batchSize: Number.isNaN(batchSize) ? DEFAULT_BATCH_SIZE : batchSize,
  };
}

