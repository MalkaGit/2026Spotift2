import { ConflictError, NotFoundError, mysqlPool } from "@mycompanyname/lib-common";
import * as albumsRepo from "./albums.repository";
import * as activityEventsService from "../activity-events/activity-events.service";
import * as feedsEventsService from "../../feeds/_old/v3/writer/feeds-events.service";
import type { Album } from "./types/album.model";
import { AlbumsErrorCode } from "./albums.error.codes";
import { AlbumReleasedEventPayload } from "../activity-events/types/activity-events.payloads";

/**
 * release Album v1:
 * write path:
 * update writer module: sets released_at = NOW() on album table
 * read path:
 * feed releases endpoint will read directly from source-of-truth tables.
 * @throws NotFoundError if album does not exist or is soft-deleted
 */
export async function releaseAlbum(albumId: string): Promise<void> {
  //bl: 
  // requireRole(["admin"]);
  const updated = await albumsRepo.releaseAlbumById(albumId, new Date());
  if (!updated) {
    throw new NotFoundError(AlbumsErrorCode.ALBUM_NOT_FOUND, "Album not found");
  }
}

/**
 * Release album V2: set released_at and record the release in the activity log.
 *
 * Write path flow (single transaction):
 * 1. Read album details (for existence, "already released?" check, and payload).
 * 2. Update domain: albums.released_at
 * 3. Update activity events (reused by all events of all modules of all domains):
 *    Insert one row into activity_events and N rows into activity_event_actors.
 *
 * Read path flow: 
 * read services of all domains (search, analytics, feeds, notifications etc)
 * read activity_events directoly (and optionally  activity_event_actors);
 * no projection tables for now, no workers, no message queues + consumers.
 *
 * Design notes:
 * 1. We read album details inside the transaction.
 *    this ensures consistency
 *    (no two api requests calling set release data for the same album)
 * 2.  We use a single releasedAt for 
 *     both albums.released_at and the activity event payload (event time and payload). 
 *     The same instant is stored everywhere so
 *     there is one canonical release time and we avoid clock skew between app and DB.
 * 
 * @throws NotFoundError if album does not exist or is soft-deleted
 * @throws ConflictError if album is already released
 */
export async function releaseAlbumV2(albumId: string): Promise<void> {
  const conn = await mysqlPool.getConnection();
  try {
    await conn.beginTransaction();

    const details = await albumsRepo.getAlbumDetailsTx(conn, albumId);
    if (!details) {
      throw new NotFoundError(AlbumsErrorCode.ALBUM_NOT_FOUND, "Album not found");
    }
    //if (details.releasedAt != null) {
    //  throw new ConflictError(AlbumsErrorCode.ALBUM_ALREADY_RELEASED, "Album already released");
    //}

    const releasedAt = new Date();
    const updated = await albumsRepo.releaseAlbumByIdTx(conn, albumId, releasedAt);
    if (!updated) {
      throw new NotFoundError(AlbumsErrorCode.ALBUM_NOT_FOUND, "Album not found");
    }

   
    const eventId = crypto.randomUUID();
    const payload : AlbumReleasedEventPayload = {
      releasedAt,
      album: {
        id: details.id,
        title: details.name,
        imageUrl: details.imageUrl,
        albumType: details.albumType,
      },
      artists: details.artists.map((a) => ({ id: a.id, name: a.name })),
    };

    await activityEventsService.insertAlbumReleaseActivityEvent(conn, eventId, payload);

    await conn.commit();
  } catch (err) {
    try {
      await conn.rollback();
    } catch {
      // ignore rollback errors, surface original error
    }
    throw err;
  } finally {
    conn.release();
  }
}

/**
 * Release album V3: set released_at and record the release directly
 * into the feed projection tables (`feeds` + `feed_actors`).
 *
 * This mirrors the V2 flow but writes to feeds v3 instead of
 * activity_events. All writes happen inside a single transaction.
 */
export async function releaseAlbumV3(albumId: string): Promise<void> {
  const conn = await mysqlPool.getConnection();
  try {
    await conn.beginTransaction();

    const details = await albumsRepo.getAlbumDetailsTx(conn, albumId);
    if (!details) {
      throw new NotFoundError(AlbumsErrorCode.ALBUM_NOT_FOUND, "Album not found");
    }

    //if (details.releasedAt != null) {
    //  throw new ConflictError(AlbumsErrorCode.ALBUM_ALREADY_RELEASED, "Album already released");
    //}

    const releasedAt = new Date();
    const updated = await albumsRepo.releaseAlbumByIdTx(conn, albumId, releasedAt);
    if (!updated) {
      throw new NotFoundError(AlbumsErrorCode.ALBUM_NOT_FOUND, "Album not found");
    }

    const eventId = crypto.randomUUID();
    const payload: AlbumReleasedEventPayload = {
      releasedAt,
      album: {
        id: details.id,
        title: details.name,
        imageUrl: details.imageUrl,
        albumType: details.albumType,
      },
      artists: details.artists.map((a) => ({ id: a.id, name: a.name })),
    };

    await feedsEventsService.insertAlbumReleaseEvent(conn, eventId, payload);

    await conn.commit();
  } catch (err) {
    try {
      await conn.rollback();
    } catch {
      // ignore rollback errors, surface original error
    }
    throw err;
  } finally {
    conn.release();
  }
}

/**
 * Release album V4a: set released_at and record the release in the activity log.
 *
 * Write path flow (single transaction):
 * 1. Read album details (for existence, "already released?" check, and payload).
 * 2. Update domain: albums.released_at
 * 3. Update activity events tables
 *    v4a - global tables:    activity_events and activity_event_actors (reused by all events of all modules of all domains)
 *    v4b - per domain tables:atalog_activity_events and catalog_activity_event_actors 
 * 
 * worker code:
 * every reader domain x has its projection tables,
 * its worker code (that reads activity events and writes to the proection tables)
 * and its x_worker_offset table 
 * each worker on reaer doamin x reads the last processed event id from its offset table
 * and reads unprocessed events
 * and writes to the reader domain's projection tables and the new offset to the x_worker_offset table
 *
 *  
 * Read path flow: 
 * read services of all domains (search, analytics, feeds, notifications etc)
 * reads projection tables.
 * for now, no message queues + consumers.
 *
 * Design notes:
 * 1. We read album details inside the transaction.
 *    this ensures consistency
 *    (no two api requests calling set release data for the same album)
 * 2.  We use a single releasedAt for 
 *     both albums.released_at and the activity event payload (event time and payload). 
 *     The same instant is stored everywhere so
 *     there is one canonical release time and we avoid clock skew between app and DB.
 * 
 * @throws NotFoundError if album does not exist or is soft-deleted
 * @throws ConflictError if album is already released
 */
export async function releaseAlbumV4a(albumId: string): Promise<void> {
  const conn = await mysqlPool.getConnection();
  try {
    await conn.beginTransaction();

    const details = await albumsRepo.getAlbumDetailsTx(conn, albumId);
    if (!details) {
      throw new NotFoundError(AlbumsErrorCode.ALBUM_NOT_FOUND, "Album not found");
    }

    // if (details.releasedAt != null) {
    //   throw new ConflictError(AlbumsErrorCode.ALBUM_ALREADY_RELEASED, "Album already released");
    // }

    const releasedAt = new Date();
    const updated = await albumsRepo.releaseAlbumByIdTx(conn, albumId, releasedAt);
    if (!updated) {
      throw new NotFoundError(AlbumsErrorCode.ALBUM_NOT_FOUND, "Album not found");
    }

    const eventId = crypto.randomUUID();
    const payload: AlbumReleasedEventPayload = {
      releasedAt,
      album: {
        id: details.id,
        title: details.name,
        imageUrl: details.imageUrl,
        albumType: details.albumType,
      },
      artists: details.artists.map((a) => ({ id: a.id, name: a.name })),
    };

    await activityEventsService.insertAlbumReleaseActivityEvent(conn, eventId, payload);

    await conn.commit();
  } catch (err) {
    try {
      await conn.rollback();
    } catch {
      // ignore rollback errors, surface original error
    }
    throw err;
  } finally {
    conn.release();
  }
}

/**
 * Get albums by ids (albums table only, no join). Returns only existing non-deleted albums.
 * Used by artist overview v3; caller composes with getTracksByIds for track data.
 */
export async function getAlbumsByIds(
  albumIds: string[]
): Promise<Map<string, Album>> {
  return albumsRepo.getAlbumsByIds(albumIds);
}
