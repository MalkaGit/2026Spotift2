/**
 * ### getWhatsNewFeeds api:
 *  it should return latest releases for albums and episodes for followed artists and shows.
   - ordered descending by released_at
   - cursor pagination
 * note:
 * - api is unified feed, it should mix albums and episodes for followed artists and shows.
 * 
 * 
 * ### This is v1: reading from source of truth tables only
 * - write path
 *  When an album is **released** (catalog `releaseAlbum`),
 *  we only write to the  **source of truth** table.
 *  eg, catalog.albums.released_at
 * - read path
 * For the authenticated user, 
 * load **newly released albums** from artists they **like**,
 * within **`days`**,
 * with **cursor** pagination — see `whats-new.repository` for SQL.
 * Note: normally paging is done by feed id \ event_occured_at+evemt_id but .... for now we dont have feed\event 
 *       so we jsut order by released_at, album_id
 *       that implementation detail is hidden from the caller thatks to the use of corsor parameter 
 *- v1 Limitation (why albums only for now)
 * The product **API** is a **unified** “what’s new” stream: 
 * it should mix * **albums** and **episodes**  for followed **artists** and **shows**. 
 * However, Paging with one * cursor** across **two** independent source tables (albums vs episodes) is **non-trivial**
 * (merge by time, stable cursors).
 * thereforethis v1 implements **albums only**; episode-only
 *
 * 
 * ### Service API vs repository API
 *
 * - **Service**: `QueryWhatsNewInput` → `WhatsNewOutput` — matches the **HTTP** contract
 *   (validated query, JSON response shape).
 * - **Repository**: **explicit** `days`, `limit`, `cursor` — **no** query DTO; `object_type`
 *   is enforced here (service) before calling the repository.
 *
 * This function is the **adapter** between those two.
 *
 * ### Business validation (same idea as GET `/me/feeds/v1/releases`)
 *
 * Zod only checks shape/ranges. Here we enforce **supported** filters: **v1 does not
 * implement episodes** (paging across albums + episodes is deferred). If `object_type`
 * includes **`episode`**, respond with **400** and `WhatsNewErrorCode.EPISODE_NOT_IMPLEMENTED`.
 */
