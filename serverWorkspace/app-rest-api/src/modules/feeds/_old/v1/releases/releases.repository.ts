/**
 * Release feed repository: "what's new" feed of albums from liked artists.
 * Single query with CTE for cursor-based pagination.
 */
import { mysqlPool, logger } from "@mycompanyname/lib-common";
import type {
  ReleaseFeedItem,
  ReleaseFeedActor,
  ReleaseFeedOutput,
  QueryReleaseFeedInput,
} from "./types";

const LOG_SCOPE = "feed.v1.releases";

/**
 * Get release feeds for the current user (starts from likes for single query).
 * v1: albums from liked artists only (shows/episodes not supported).
 */
export async function getReleaseFeeds(
  userId: string,
  query: QueryReleaseFeedInput
): Promise<ReleaseFeedOutput> {
  const { days, limit, cursor } = query;

  const cursorDecoded = decodeCursor(cursor?.trim() ?? "");
  const cursorCondition = cursorDecoded
    ? `AND (a2.released_at < ? OR (a2.released_at = ? AND a2.id > ?))`
    : "";
  const cursorParams = cursorDecoded
    ? [cursorDecoded.releaseDate, cursorDecoded.releaseDate, cursorDecoded.releasedObjectId]
    : [];

  const sql = `
    WITH page_albums AS (
      SELECT a2.id, a2.released_at
      FROM likes l
      JOIN album_artists aa ON aa.artist_id = l.entity_id
      JOIN albums a2 ON a2.id = aa.album_id
      WHERE l.user_id = ?
        AND l.entity_type = 'artist'
        AND l.deleted_at IS NULL
        AND a2.deleted_at IS NULL
        AND a2.released_at >= CURDATE() - INTERVAL ? DAY
        ${cursorCondition}
      GROUP BY a2.id, a2.released_at
      ORDER BY a2.released_at DESC, a2.id ASC
      LIMIT ?
    )
    SELECT
      a.id AS album_id,
      a.name AS album_name,
      a.image_url AS album_image_url,
      a.album_type,
      a.released_at,
      ar.id AS artist_id,
      ar.name AS artist_name
    FROM page_albums pa
    JOIN albums a ON a.id = pa.id
    JOIN album_artists aa ON aa.album_id = a.id
    JOIN artists ar ON ar.id = aa.artist_id
    WHERE ar.deleted_at IS NULL
    ORDER BY pa.released_at DESC, pa.id ASC
  `;
  const params = [userId, days, ...cursorParams, limit + 1];

  logger.debug(`${LOG_SCOPE}.getReleaseFeeds - SQL`, {
    sql: sql.replace(/\s+/g, " ").trim(),
    params,
  });

  const [rows] = await mysqlPool.query(sql, params);
  const rowList = (rows as Record<string, unknown>[]) ?? [];

  type AlbumEntry = { albumId: string; albumName: string; imageUrl: string; albumType: string; releasedAt: Date; artists: ReleaseFeedActor[] };
  const byAlbum = new Map<string, AlbumEntry>();

  for (const r of rowList) {
    const albumId = String(r.album_id ?? "");
    const artistId = String(r.artist_id ?? "");
    const artistName = String(r.artist_name ?? "");

    let entry = byAlbum.get(albumId);
    if (!entry) {
      entry = {
        albumId,
        albumName: String(r.album_name ?? ""),
        imageUrl: r.album_image_url != null ? String(r.album_image_url) : "",
        albumType: String(r.album_type ?? "album"),
        releasedAt:
          r.released_at instanceof Date
            ? r.released_at
            : new Date(String(r.released_at)),
        artists: [],
      };
      byAlbum.set(albumId, entry);
    }
    if (!entry.artists.some((a) => a.id === artistId)) {
      entry.artists.push({ type: "artist", id: artistId, name: artistName });
    }
  }

  const albumEntries = [...byAlbum.entries()];
  const hasMore = albumEntries.length > limit;
  const pageEntries = albumEntries.slice(0, limit);

  const items: ReleaseFeedItem[] = pageEntries.map(([, e]) => ({
    feedActors: e.artists,
    feedVerb: "released",
    feedObject: {
      type: "album",
      id: e.albumId,
      title: e.albumName,
      imageUrl: e.imageUrl,
      albumType: e.albumType as "album" | "single" | "compilation",
    },
    occurredAt: e.releasedAt.toISOString(),
  }));

  const lastEntry = pageEntries[pageEntries.length - 1];
  const nextCursor =
    hasMore && lastEntry
      ? encodeCursor(lastEntry[1].releasedAt.toISOString(), lastEntry[1].albumId)
      : undefined;

  return { items, cursor: nextCursor };
}




interface ReleaseFeedCursor {
  releaseDate: string;
  releasedObjectId: string;
}

function encodeCursor(releaseDate: string, releasedObjectId: string): string {
  return Buffer.from(
    JSON.stringify({ releaseDate, releasedObjectId }),
    "utf-8"
  ).toString("base64url");
}

function decodeCursor(cursor: string): ReleaseFeedCursor | null {
  if (!cursor?.trim()) return null;
  try {
    const parsed = JSON.parse(
      Buffer.from(cursor, "base64url").toString("utf-8")
    ) as Record<string, unknown>;
    if (
      typeof parsed.releaseDate === "string" &&
      typeof parsed.releasedObjectId === "string"
    ) {
      return { releaseDate: parsed.releaseDate, releasedObjectId: parsed.releasedObjectId };
    }
  } catch {
    /* invalid */
  }
  return null;
}
