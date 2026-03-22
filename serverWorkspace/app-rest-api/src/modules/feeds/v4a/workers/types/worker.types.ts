/**
 * Worker types for feeds v4a projection workers.
 *
 * writer domain updates the source of truth tables
 * and also populate events
 * (eg to activity event tables for workers to read from
 *  or to queues that consumers can read from)
 * 
 * reader domain has worker/consumer that reads events from source stream
 *   - workers read events from activity events tables
 *   - consumers read events from queues
 * Then the  worker/consumers maps the events
 * and writes them to projection tables within the reader domain
 * (eg, feeds projection tables, analytics projection tables, search projection tables, notifications projection tables)
* 
*  Then the reader domain's APIs read from the projection tables to give api results 
*  - Reader domains (feeds, analytics, search, notifications) own projection tables.
 * - APIs read from projection tables to serve responses.

* - The worker runs periodically
*  reading events from a source stream
*  and writing them to a projection table.
*  Configuration for feed workers
 * Aligned with analytics/v3/workers.
 * 

 * Worker responsibility:
 * - Runs periodically.
 * - Reads events from a source stream (activity log table or message queue).
 * - Maps events into projection table columns.
 * - Writes/upserts rows into projection tables.
 */
export interface WorkerConfig {
  intervalMs: number; // interval in milliseconds between worker runs
  firstRunDelayMs?: number; // optional delay before the first run
  batchSize: number; // number of events to process per run
}

