# Engineering guidelines

## 1. Simplicity first

- Prefer **reusing existing code and tables** over adding new ones.
- Create a new file/module/table only when:
  - The existing one would become confusing or huge, or
  - There is a clear, concrete new responsibility or query pattern.

## 2. Files and modules

- Keep **related behavior together** (same feature + same bounded context).
- New file/module when:
  - A file is no longer understandable in one pass, or
  - You introduce a distinct responsibility (e.g. checkpoint repo, email sender).
- Avoid “one file per tiny operation” unless it truly has its own lifecycle.

## 3. Database tables

- Model **per domain concept**, not per tiny operation.
  - Good: `track_play_events`, `artist_stats`.
- Add a new table only when:
  - The data shape is different, or
  - New queries cannot be supported cleanly with existing tables + indexes.
- Try **indexes or projection tables** before inventing another events table.

## 4. Batch vs row-by-row

- Default: **read in batches, write in bulk**.
  - Reads: `WHERE id > ? ORDER BY id LIMIT batchSize`.
  - Writes: aggregate in memory, then bulk upsert.
- Row-by-row read/write is only acceptable for very low volume or admin/debug tools.

## 5. Transactions and checkpoints

- Always update:
  - Projection tables, and
  - Checkpoints/watermarks
  in **one DB transaction**.
- Design projection writes to be **idempotent** so reprocessing a batch is safe
  (e.g. recompute totals for keys and upsert, not blind `+1` per event).

## 6. Evolving with scale

- Start with the **simplest design that works**.
- Only add:
  - More workers/services,
  - More tables,
  - More abstraction,
  when you see real pain: performance issues, complexity, or unclear ownership.

