/**
 * important design decisions:
 * 
 * 1.   for simplicity, all domains (catalog, player, social) use the same 
 *      activity_events table.
 *  
 *      Shared repository for the central activity_events log.
 *
 *      Current design:
 *      - all domains write to the same activity_events table
 *      - workers consume events incrementally using sequence_no
 *
 *      Future evolution:
 *      - storage may later be split into per-domain event tables
 *      - this repository API can remain stable while the storage routing changes
 . 
 *
 * 2.   the activity events table has an auto-generated column that is used by workers
 *      to keep track of the last processed event.
 
 * 3.   Event payloads hold all the data that worker/consumer in the reader domain needs
 *      to populate the reader projection table.
 *      This way, the reader does not need to read data from the producer domain
 *      (which would otherwise require REST calls in a microservices world and likely joins in a monolith).
*/