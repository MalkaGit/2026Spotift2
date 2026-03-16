
-- =============================================================
-- Run as MySQL script. Connection: root @ localhost:1234 (adjust as needed).
--
-- Soft delete: tables have deleted_at TIMESTAMP NULL.
--   NULL = active row, non-NULL = deleted at that time.
--   Queries for "active" data: WHERE deleted_at IS NULL
-- =============================================================

DROP DATABASE IF EXISTS spotify2db;
CREATE DATABASE spotify2db;
USE spotify2db;

--  ========================================
--  users TABLE
--  ========================================
DROP TABLE IF EXISTS users;

CREATE TABLE users (
  id CHAR(36) PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL DEFAULT NULL
);

--  ========================================
--  Seed users (required for artist FK; adjust password in production)
--  ========================================
INSERT INTO users (id, email, password_hash, role)
VALUES ('c636cfc0-4ac9-455f-a510-013ab1e2ccc4', 'admin@spotify2.local', '$2a$10$placeholder.hash.replace.in.production', 'admin');

--  ========================================
--  artists TABLE (user manages many artists)
--  ========================================
DROP TABLE IF EXISTS artists;

CREATE TABLE artists (
  id CHAR(36) NOT NULL PRIMARY KEY,
  user_id CHAR(36) NOT NULL,       -- user who manages the artist data
  name VARCHAR(255) NOT NULL,
  bio TEXT,
  image_url VARCHAR(512),          -- URL to artist image/photo
  header_image_url VARCHAR(512),   -- URL to artist header/banner image
  action_bar_image_url VARCHAR(512), -- URL to small action-bar image (e.g. next to Play button)
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL DEFAULT NULL,
  CONSTRAINT fk_artist_user FOREIGN KEY (user_id)
    REFERENCES users(id) ON DELETE CASCADE
    -- cascade: when user is deleted, their artists are deleted by DB in same transaction
) ENGINE=InnoDB;

-- Full-text search index on name for fast text search (used by search/v2)
CREATE FULLTEXT INDEX idx_artist_name_ft ON artists(name);

-- Regular index for LIKE-based search (used by search/v1) and sorting
CREATE INDEX idx_artist_name ON artists(name);

-- Fetch all artists of a given user
CREATE INDEX idx_artist_user ON artists(user_id);






--  ========================================
--  Seed artists (owned by seed user above)
--  ========================================
INSERT INTO artists (id, user_id, name, bio, image_url, header_image_url, action_bar_image_url)
VALUES
('111a1e45-c1c2-4b56-a331-eba6bd9b9db8', 'c636cfc0-4ac9-455f-a510-013ab1e2ccc4', 'Taylor Swift', 'American singer-songwriter', 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQUb00DH3n0v2jSivtTamHdYqx43xyR51-Hcg&s', 'https://img.freepik.com/premium-photo/watercolor-illustration-depicting-artist-working-their-craft-surrounded-by-vibrant-spl_924727-134276.jpg?semt=ais_user_personalization&w=740&q=80', 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQUb00DH3n0v2jSivtTamHdYqx43xyR51-Hcg&s'),

('222a1e45-c1c2-4b56-a331-eba6bd9b9db8', 'c636cfc0-4ac9-455f-a510-013ab1e2ccc4', 'Drake', 'Canadian rapper and singer', 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSx4srWGPMQrPiSrqEI4oI3QKXoveB-f4UI5Q&s', 'https://headerart.weebly.com/uploads/5/7/5/7/5757212/eye-catching-colorful-paints-art-header_orig.jpg', 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSx4srWGPMQrPiSrqEI4oI3QKXoveB-f4UI5Q&s'),

('333a1e45-c1c2-4b56-a331-eba6bd9b9db8', 'c636cfc0-4ac9-455f-a510-013ab1e2ccc4', 'Ed Sheeran', 'English pop singer-songwriter', 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTkV1bPiUDbSj6QV7w_tFyJrgGy77smiXnybB5nXZCOltmYBAzY_a_BmDY&s', 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQXfpdFmvpRY2-_cjIdEj-l59jukh4oE_CrEQ&s', 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTkV1bPiUDbSj6QV7w_tFyJrgGy77smiXnybB5nXZCOltmYBAzY_a_BmDY&s'),

('444a1e45-c1c2-4b56-a331-eba6bd9b9db8', 'c636cfc0-4ac9-455f-a510-013ab1e2ccc4', 'Beyoncé', 'American singer and performer', 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcS9gXAHZYhIQ-0iGnHRL38rcwCCAsER6KfzQg&s', 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRFeWSMPJ13SvJXow9XLlncZp442Rr3va4KIw&s', 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcS9gXAHZYhIQ-0iGnHRL38rcwCCAsER6KfzQg&s'),

('555a1e45-c1c2-4b56-a331-eba6bd9b9db8', 'c636cfc0-4ac9-455f-a510-013ab1e2ccc4', 'Eminem', 'American rapper and producer', 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTMtMZKiqJZMq26-kYYN56PvYECADkZG0pKCA&s', 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSMNdsfpywUeKwm-6lrWS_YU2QQtTy-1k750Q&s', 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTMtMZKiqJZMq26-kYYN56PvYECADkZG0pKCA&s'),

('666a1e45-c1c2-4b56-a331-eba6bd9b9db8', 'c636cfc0-4ac9-455f-a510-013ab1e2ccc4', 'Ariana Grande', 'American pop and R&B singer', 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcS_GSsX68QVsi_k16pEKW0ExOCzhbk78JEQ8w&s', 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQVeCSxm75WS-7lppF-gIfxBJ5LEWG0oWC-wA&s', 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcS_GSsX68QVsi_k16pEKW0ExOCzhbk78JEQ8w&s'),

('777a1e45-c1c2-4b56-a331-eba6bd9b9db8', 'c636cfc0-4ac9-455f-a510-013ab1e2ccc4', 'Imagine Dragons', 'American pop rock band', 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTJuFdDT2tn1xeF8x_4Y6DBmkTWMah5JrLogQ&s', 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcT-VlqGKfVZGwvP-6V1oLEQOICtlmJ0EC58JA&s', 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTJuFdDT2tn1xeF8x_4Y6DBmkTWMah5JrLogQ&s'),

('888a1e45-c1c2-4b56-a331-eba6bd9b9db8', 'c636cfc0-4ac9-455f-a510-013ab1e2ccc4', 'Rihanna', 'Barbadian singer and entrepreneur', 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTMmGVcX-zXjjKWK5BqEFPitD4eYfMWHUartw&s', 'https://img.freepik.com/premium-photo/watercolor-illustration-depicting-artist-working-their-craft-surrounded-by-vibrant-spl_924727-134276.jpg?semt=ais_user_personalization&w=740&q=80', 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTMmGVcX-zXjjKWK5BqEFPitD4eYfMWHUartw&s'),

('999a1e45-c1c2-4b56-a331-eba6bd9b9db8', 'c636cfc0-4ac9-455f-a510-013ab1e2ccc4', 'The Weeknd', 'Canadian R&B singer', 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRHnzgLe6ywwAgyAZ6Aymp5IpC6dvJKkSd9bg&s', 'https://headerart.weebly.com/uploads/5/7/5/7/5757212/eye-catching-colorful-paints-art-header_orig.jpg', 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRHnzgLe6ywwAgyAZ6Aymp5IpC6dvJKkSd9bg&s'),

('aaa1e450-c1c2-4b56-a331-eba6bd9b9db8', 'c636cfc0-4ac9-455f-a510-013ab1e2ccc4', 'Metallica', 'American heavy metal band', 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRHnzgLe6ywwAgyAZ6Aymp5IpC6dvJKkSd9bg&s', 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQXfpdFmvpRY2-_cjIdEj-l59jukh4oE_CrEQ&s', 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRHnzgLe6ywwAgyAZ6Aymp5IpC6dvJKkSd9bg&s');

-- ========================================================
--  likes TABLE (artists/albums/playlists can have many likes)
-- ========================================================
DROP TABLE IF EXISTS likes;

CREATE TABLE likes (
  id CHAR(36) NOT NULL PRIMARY KEY,
  user_id CHAR(36) NOT NULL,                           -- FK → users.id
  entity_type VARCHAR(32) NOT NULL,                    -- artist, album, playlist, etc.
  entity_id CHAR(36) NOT NULL,                         -- ID of liked entity (no FK; app manages orphans)
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL DEFAULT NULL,
  UNIQUE KEY uq_like (user_id, entity_type, entity_id), -- one like per user per entity
  CONSTRAINT fk_like_user FOREIGN KEY (user_id)
    REFERENCES users(id) ON DELETE CASCADE             -- if user deleted, their likes deleted in same transaction
) ENGINE=InnoDB;

-- Quickly fetch all likes of a user
CREATE INDEX idx_likes_user ON likes(user_id);

--  Sort likes by creation time per user (pagination by created_at)
CREATE INDEX idx_likes_user_created ON likes(user_id, created_at DESC);

--  Quickly count or fetch likes for a specific entity
CREATE INDEX idx_likes_entity ON likes(entity_type, entity_id);

-- Note: likes has no FK to artists/albums/playlists, only entity_type + entity_id.
-- When an artist (or album/playlist) is deleted, the app must remove related likes in the same transaction to avoid orphans.

--  ========================================
--  albums TABLE
--  ========================================
DROP TABLE IF EXISTS albums;

CREATE TABLE albums (
  id CHAR(36) NOT NULL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  image_url VARCHAR(512),           -- URL to album cover image
  album_type ENUM('album', 'single', 'compilation') NOT NULL, -- album category
  released_at DATE NOT NULL,        -- album release date (required)
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL DEFAULT NULL
) ENGINE=InnoDB;

--  ========================================
--  playlists TABLE
--  ========================================
DROP TABLE IF EXISTS playlists;

CREATE TABLE playlists (
  id CHAR(36) NOT NULL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  image_url VARCHAR(512),         -- URL to playlist cover image
  deleted_at TIMESTAMP NULL DEFAULT NULL
) ENGINE=InnoDB;

--  ========================================
--  tracks TABLE
--  ========================================
DROP TABLE IF EXISTS tracks;

CREATE TABLE tracks (
  id CHAR(36) NOT NULL PRIMARY KEY,
  album_id CHAR(36) NOT NULL,        -- FK → albums.id
  name VARCHAR(255) NOT NULL,
  duration_ms INT NOT NULL,          -- track duration in milliseconds
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL DEFAULT NULL,
  CONSTRAINT fk_track_album FOREIGN KEY (album_id)
    REFERENCES albums(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Fetch tracks by album and support search/sort
CREATE INDEX idx_track_album ON tracks(album_id);
CREATE INDEX idx_track_album_name ON tracks(album_id, name);

--  ========================================
--  track_artists TABLE (many-to-many: track can have several artists)
--  Every track must have at least one row. Analytics uses this as single source of truth (no fallback to album).
--  ========================================
DROP TABLE IF EXISTS track_artists;

CREATE TABLE track_artists (
  track_id CHAR(36) NOT NULL,
  artist_id CHAR(36) NOT NULL,
  role VARCHAR(32) NULL,
  PRIMARY KEY (track_id, artist_id),
  CONSTRAINT fk_track_artists_track FOREIGN KEY (track_id)
    REFERENCES tracks(id) ON DELETE CASCADE,
  CONSTRAINT fk_track_artists_artist FOREIGN KEY (artist_id)
    REFERENCES artists(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE INDEX idx_track_artists_artist ON track_artists(artist_id);

--  ========================================
--  album_artists TABLE (many-to-many: album can have several artists)
--  Mirrors track_artists pattern so analytics can treat albums similarly.
--  ========================================
DROP TABLE IF EXISTS album_artists;

CREATE TABLE album_artists (
  album_id CHAR(36) NOT NULL,
  artist_id CHAR(36) NOT NULL,
  role VARCHAR(32) NOT NULL,         -- 'primary' or 'featured'
  PRIMARY KEY (album_id, artist_id),
  CONSTRAINT fk_album_artists_album FOREIGN KEY (album_id)
    REFERENCES albums(id) ON DELETE CASCADE,
  CONSTRAINT fk_album_artists_artist FOREIGN KEY (artist_id)
    REFERENCES artists(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE INDEX idx_album_artists_artist ON album_artists(artist_id);

--  ========================================
--  artist_stats TABLE (per-artist aggregate stats)
--  ========================================
DROP TABLE IF EXISTS artist_stats;

CREATE TABLE artist_stats (
  artist_id CHAR(36) NOT NULL PRIMARY KEY,  -- FK → artists.id
  monthly_listeners BIGINT NOT NULL,
  total_plays BIGINT NOT NULL DEFAULT 0,   -- all-time play count for this artist (from track_events)
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_artist_stats_artist FOREIGN KEY (artist_id)
    REFERENCES artists(id)       -- NO CASCADE: keep historical stats even if artist is soft-deleted
) ENGINE=InnoDB;

-- Rank and browse artists by monthly listeners
CREATE INDEX idx_artist_stats_monthly_listeners ON artist_stats(monthly_listeners DESC);

--  ========================================
--  artist_top_tracks_stats TABLE (per-artist top tracks aggregates)
--  ========================================
DROP TABLE IF EXISTS artist_top_tracks_stats;

CREATE TABLE artist_top_tracks_stats (
  artist_id CHAR(36) NOT NULL,     -- FK → artists.id
  track_id CHAR(36) NOT NULL,      -- FK → tracks.id
  total_plays BIGINT NOT NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (artist_id, track_id),
  CONSTRAINT fk_artist_top_tracks_artist FOREIGN KEY (artist_id)
    REFERENCES artists(id),      -- NO CASCADE: keep historical top tracks even if artist is soft-deleted
  CONSTRAINT fk_artist_top_tracks_track FOREIGN KEY (track_id)
    REFERENCES tracks(id)        -- NO CASCADE: keep historical top tracks even if track is soft-deleted
) ENGINE=InnoDB;

--  ========================================
--  artist_top_tracks_denorm TABLE (denormalized from artist_top_tracks_stats, no join at read time)
--  ========================================
DROP TABLE IF EXISTS artist_top_tracks_denorm;

CREATE TABLE artist_top_tracks_denorm (
  artist_id CHAR(36) NOT NULL,
  track_id CHAR(36) NOT NULL,
  track_name VARCHAR(255) NOT NULL,
  duration_ms INT NOT NULL,
  album_id CHAR(36) NOT NULL,
  album_image_url VARCHAR(512) NULL,
  total_plays BIGINT NOT NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (artist_id, track_id),
  CONSTRAINT fk_artist_top_tracks_denorm_artist FOREIGN KEY (artist_id)
    REFERENCES artists(id),
  CONSTRAINT fk_artist_top_tracks_denorm_track FOREIGN KEY (track_id)
    REFERENCES tracks(id)
) ENGINE=InnoDB;

-- Single-table read for v2 overview: WHERE artist_id = ? ORDER BY total_plays DESC LIMIT ?
-- PK (artist_id, track_id) supports range scan on artist_id
CREATE INDEX idx_artist_top_tracks_denorm_artist_plays ON artist_top_tracks_denorm(artist_id, total_plays DESC);

--  ========================================
--  track_stats TABLE (per-track play count; populated by v3 worker)
--  ========================================
DROP TABLE IF EXISTS track_stats;

CREATE TABLE track_stats (
  track_id CHAR(36) NOT NULL PRIMARY KEY,  -- FK → tracks.id
  total_count BIGINT NOT NULL DEFAULT 0,    -- all-time play count for this track
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_track_stats_track FOREIGN KEY (track_id)
    REFERENCES tracks(id)  -- NO CASCADE: keep historical stats even if track is soft-deleted
) ENGINE=InnoDB;

--  ========================================
--  track_events TABLE
--  ========================================
--  We normally enrich events at ingest (e.g. add artist_id to the event table or message), since that
--  avoids extra lookups in the worker. When enrichment would create multiple rows or messages per
--  logical occurrence, we skip it at ingest and enrich in the worker instead. A track can have many
--  artists (track_artists); adding artist_id at ingest would mean multiple rows per play, making
--  downstream processing harder (e.g. counting track total plays when reading batches). So we do not
--  add artist_id: one play, one row. The worker joins with track_artists to attribute plays to artists.
--  ========================================
DROP TABLE IF EXISTS track_events;

CREATE TABLE track_events (
  id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  event_type VARCHAR(32) NOT NULL, -- e.g. 'play', 'pause', 'skip'
  user_id CHAR(36) NOT NULL,       -- FK → users.id
  track_id CHAR(36) NOT NULL,      -- FK → tracks.id
  occurred_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_te_user FOREIGN KEY (user_id)
    REFERENCES users(id),         -- NO CASCADE: keep historical events even if user is soft-deleted
  CONSTRAINT fk_te_track FOREIGN KEY (track_id)
    REFERENCES tracks(id)        -- NO CASCADE: keep historical events even if track is soft-deleted
) ENGINE=InnoDB;

CREATE INDEX idx_track_events_play_track_time
  ON track_events (event_type, track_id, occurred_at DESC);

--  ========================================
--  track_events_checkpoint TABLE (v3 incremental worker)
--  ========================================
DROP TABLE IF EXISTS track_events_checkpoint;

CREATE TABLE track_events_checkpoint (
  worker_id VARCHAR(64) NOT NULL PRIMARY KEY,
  last_processed_event_id BIGINT NOT NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

--  ========================================
--  activity_events TABLE (centralized activity log)
--  ========================================
DROP TABLE IF EXISTS activity_event_actors;
DROP TABLE IF EXISTS activity_events;

CREATE TABLE activity_events (
  event_id CHAR(36) NOT NULL PRIMARY KEY,
  event_time TIMESTAMP NOT NULL,
  verb VARCHAR(32) NOT NULL,
  object_type VARCHAR(32) NOT NULL,
  object_id CHAR(36) NOT NULL,
  object_name VARCHAR(255) NOT NULL,
  context_object_type VARCHAR(32) NULL,
  context_object_id CHAR(36) NULL,
  context_object_name VARCHAR(255) NULL,
  event_data JSON NULL
) ENGINE=InnoDB;

CREATE INDEX idx_activity_events_event_time ON activity_events (event_time DESC);
CREATE INDEX idx_activity_events_context ON activity_events (context_object_type, context_object_id);

--  ========================================
--  activity_event_actors TABLE (centralized activity log)
--  ========================================
CREATE TABLE activity_event_actors (
  event_id CHAR(36) NOT NULL,
  actor_type VARCHAR(32) NOT NULL,
  actor_id CHAR(36) NOT NULL,
  actor_name VARCHAR(255) NOT NULL,
  PRIMARY KEY (event_id, actor_id),
  CONSTRAINT fk_activity_event_actors_event FOREIGN KEY (event_id)
    REFERENCES activity_events(event_id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE INDEX idx_activity_event_actors_actor ON activity_event_actors (actor_type, actor_id, event_id DESC);

--  ========================================
--  feed_events TABLE (feeds v2 CQRS projection)
--  ========================================
DROP TABLE IF EXISTS feed_event_actors;
DROP TABLE IF EXISTS feed_events;

CREATE TABLE feed_events (
  event_id CHAR(36) NOT NULL PRIMARY KEY,
  event_time TIMESTAMP NOT NULL,
  verb VARCHAR(32) NOT NULL,
  object_type VARCHAR(32) NOT NULL,
  object_id CHAR(36) NOT NULL,
  object_name VARCHAR(255) NOT NULL,
  context_object_type VARCHAR(32) NULL,
  context_object_id CHAR(36) NULL,
  context_object_name VARCHAR(255) NULL,
  event_data JSON NULL
) ENGINE=InnoDB;

CREATE INDEX idx_feed_events_event_time ON feed_events (event_time DESC);
CREATE INDEX idx_feed_events_context ON feed_events (context_object_type, context_object_id);

--  ========================================
--  feed_event_actors TABLE (feeds v2 CQRS projection)
--  ========================================
CREATE TABLE feed_event_actors (
  event_id CHAR(36) NOT NULL,
  actor_type VARCHAR(32) NOT NULL,
  actor_id CHAR(36) NOT NULL,
  actor_name VARCHAR(255) NOT NULL,
  PRIMARY KEY (event_id, actor_id),
  CONSTRAINT fk_feed_event_actors_event FOREIGN KEY (event_id)
    REFERENCES feed_events(event_id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE INDEX idx_feed_event_actors_actor ON feed_event_actors (actor_type, actor_id, event_id DESC);

--  ========================================
--  Seed albums, tracks, and stats
--  ========================================

--  Seed albums (artist has albums). Album cover images reuse existing artist images.
INSERT INTO albums (id, name, image_url, album_type, released_at)
VALUES
  -- Taylor Swift
  ('10000000-0000-4000-8000-000000000001', '1989 (Taylor''s Version)', 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQUb00DH3n0v2jSivtTamHdYqx43xyR51-Hcg&s', 'album', CURDATE() - INTERVAL 58 DAY),
  ('10000000-0000-4000-8000-000000000002', 'Midnights', 'https://img.freepik.com/premium-photo/watercolor-illustration-depicting-artist-working-their-craft-surrounded-by-vibrant-spl_924727-134276.jpg?semt=ais_user_personalization&w=740&q=80', 'single', CURDATE() - INTERVAL 59 DAY),
  ('10000000-0000-4000-8000-000000000003', 'Taylor''s Mix (Compilation)', 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQUb00DH3n0v2jSivtTamHdYqx43xyR51-Hcg&s', 'compilation', CURDATE() - INTERVAL 60 DAY),

  -- Drake
  ('20000000-0000-4000-8000-000000000001', 'Scorpion', 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSx4srWGPMQrPiSrqEI4oI3QKXoveB-f4UI5Q&s', 'album', CURDATE() - INTERVAL 60 DAY),

  -- Ed Sheeran
  ('30000000-0000-4000-8000-000000000001', '÷ (Divide)', 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTkV1bPiUDbSj6QV7w_tFyJrgGy77smiXnybB5nXZCOltmYBAzY_a_BmDY&s', 'album', CURDATE() - INTERVAL 61 DAY),

  -- Beyoncé
  ('40000000-0000-4000-8000-000000000001', 'Lemonade', 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcS9gXAHZYhIQ-0iGnHRL38rcwCCAsER6KfzQg&s', 'album', CURDATE() - INTERVAL 62 DAY);

--  Seed album_artists (every album has ≥1 artist; one album could be extended with featured artists)
INSERT INTO album_artists (album_id, artist_id, role)
VALUES
  -- Taylor Swift albums
  ('10000000-0000-4000-8000-000000000001', '111a1e45-c1c2-4b56-a331-eba6bd9b9db8', 'primary'),
  ('10000000-0000-4000-8000-000000000002', '111a1e45-c1c2-4b56-a331-eba6bd9b9db8', 'primary'),
  ('10000000-0000-4000-8000-000000000003', '111a1e45-c1c2-4b56-a331-eba6bd9b9db8', 'primary'),
  -- Drake
  ('20000000-0000-4000-8000-000000000001', '222a1e45-c1c2-4b56-a331-eba6bd9b9db8', 'primary'),
  -- Ed Sheeran
  ('30000000-0000-4000-8000-000000000001', '333a1e45-c1c2-4b56-a331-eba6bd9b9db8', 'primary'),
  -- Beyoncé
  ('40000000-0000-4000-8000-000000000001', '444a1e45-c1c2-4b56-a331-eba6bd9b9db8', 'primary');

--  Backfill feed_events and feed_event_actors from albums (released_at)
INSERT INTO feed_events (event_id, event_time, verb, object_type, object_id, object_name, event_data)
SELECT UUID(), TIMESTAMP(a.released_at), 'released', 'album', a.id, a.name, JSON_OBJECT('album_type', a.album_type, 'image_url', a.image_url)
FROM albums a WHERE a.deleted_at IS NULL;

INSERT INTO feed_event_actors (event_id, actor_type, actor_id, actor_name)
SELECT fe.event_id, 'artist', ar.id, ar.name
FROM feed_events fe
JOIN album_artists aa ON aa.album_id = fe.object_id AND fe.object_type = 'album'
JOIN artists ar ON ar.id = aa.artist_id AND ar.deleted_at IS NULL
WHERE fe.verb = 'released';

--  Backfill activity_events and activity_event_actors from recent albums (released in last 60 days)
INSERT INTO activity_events (event_id, event_time, verb, object_type, object_id, object_name, event_data)
SELECT
  UUID(),
  TIMESTAMP(a.released_at),
  'released',
  'album',
  a.id,
  a.name,
  JSON_OBJECT('album_type', a.album_type, 'image_url', a.image_url)
FROM albums a
WHERE a.deleted_at IS NULL
  AND a.released_at >= CURDATE() - INTERVAL 60 DAY;

INSERT INTO activity_event_actors (event_id, actor_type, actor_id, actor_name)
SELECT ae.event_id, 'artist', ar.id, ar.name
FROM activity_events ae
JOIN album_artists aa ON aa.album_id = ae.object_id AND ae.object_type = 'album'
JOIN artists ar ON ar.id = aa.artist_id AND ar.deleted_at IS NULL
WHERE ae.verb = 'released'
  AND ae.event_time >= CURDATE() - INTERVAL 60 DAY;

--  Seed tracks (id, name, duration_ms, album_id)
INSERT INTO tracks (id, name, duration_ms, album_id)
VALUES
  -- Taylor Swift - 1989 (Taylor's Version)
  ('31000000-0000-4000-8000-000000000001', 'Blank Space (Taylor''s Version)', 231000, '10000000-0000-4000-8000-000000000001'),
  ('31000000-0000-4000-8000-000000000002', 'Style (Taylor''s Version)', 231000, '10000000-0000-4000-8000-000000000001'),

  -- Taylor Swift - Midnights
  ('31000000-0000-4000-8000-000000000003', 'Anti-Hero', 200000, '10000000-0000-4000-8000-000000000002'),

  -- Drake - Scorpion
  ('32000000-0000-4000-8000-000000000001', 'God''s Plan', 198000, '20000000-0000-4000-8000-000000000001'),

  -- Ed Sheeran - ÷ (Divide)
  ('33000000-0000-4000-8000-000000000001', 'Shape of You', 234000, '30000000-0000-4000-8000-000000000001'),

  -- Beyoncé - Lemonade
  ('34000000-0000-4000-8000-000000000001', 'Formation', 215000, '40000000-0000-4000-8000-000000000001');

--  Seed track_artists (every track has ≥1 artist; one track has 2 artists for multi-artist verification)
INSERT INTO track_artists (track_id, artist_id, role)
VALUES
  -- Taylor Swift - 1989
  ('31000000-0000-4000-8000-000000000001', '111a1e45-c1c2-4b56-a331-eba6bd9b9db8', 'primary'),
  ('31000000-0000-4000-8000-000000000002', '111a1e45-c1c2-4b56-a331-eba6bd9b9db8', 'primary'),
  -- Anti-Hero: Taylor Swift + Ed Sheeran (featured) – multi-artist example
  ('31000000-0000-4000-8000-000000000003', '111a1e45-c1c2-4b56-a331-eba6bd9b9db8', 'primary'),
  ('31000000-0000-4000-8000-000000000003', '333a1e45-c1c2-4b56-a331-eba6bd9b9db8', 'featured'),
  -- Drake
  ('32000000-0000-4000-8000-000000000001', '222a1e45-c1c2-4b56-a331-eba6bd9b9db8', 'primary'),
  -- Ed Sheeran
  ('33000000-0000-4000-8000-000000000001', '333a1e45-c1c2-4b56-a331-eba6bd9b9db8', 'primary'),
  -- Beyoncé
  ('34000000-0000-4000-8000-000000000001', '444a1e45-c1c2-4b56-a331-eba6bd9b9db8', 'primary');

--  Seed artist_stats (artist_id, monthly_listeners, total_plays) – all with total_plays 1
INSERT INTO artist_stats (artist_id, monthly_listeners, total_plays)
VALUES
  ('111a1e45-c1c2-4b56-a331-eba6bd9b9db8', 0, 1),
  ('222a1e45-c1c2-4b56-a331-eba6bd9b9db8', 0, 1),
  ('333a1e45-c1c2-4b56-a331-eba6bd9b9db8', 0, 1),
  ('444a1e45-c1c2-4b56-a331-eba6bd9b9db8', 0, 1);

--  Seed artist_top_tracks_stats (artist_id, track_id, total_plays) – all with total_plays 1
INSERT INTO artist_top_tracks_stats (artist_id, track_id, total_plays)
VALUES
  ('111a1e45-c1c2-4b56-a331-eba6bd9b9db8', '31000000-0000-4000-8000-000000000001', 1),
  ('111a1e45-c1c2-4b56-a331-eba6bd9b9db8', '31000000-0000-4000-8000-000000000003', 1),
  ('222a1e45-c1c2-4b56-a331-eba6bd9b9db8', '32000000-0000-4000-8000-000000000001', 1),
  ('333a1e45-c1c2-4b56-a331-eba6bd9b9db8', '33000000-0000-4000-8000-000000000001', 1),
  ('444a1e45-c1c2-4b56-a331-eba6bd9b9db8', '34000000-0000-4000-8000-000000000001', 1);

--  Backfill artist_top_tracks_denorm from join (artist_top_tracks_stats + tracks + albums); total_plays comes from stats (1)
INSERT INTO artist_top_tracks_denorm (artist_id, track_id, track_name, duration_ms, album_id, album_image_url, total_plays)
SELECT ats.artist_id, ats.track_id, t.name, t.duration_ms, al.id, al.image_url, ats.total_plays
FROM artist_top_tracks_stats ats
JOIN tracks t ON t.id = ats.track_id AND t.deleted_at IS NULL
JOIN albums al ON al.id = t.album_id AND al.deleted_at IS NULL;

--  Seed track_events (one row per play)
INSERT INTO track_events (event_type, user_id, track_id, occurred_at)
VALUES
  ('play', 'c636cfc0-4ac9-455f-a510-013ab1e2ccc4', '31000000-0000-4000-8000-000000000001', NOW() - INTERVAL 2 DAY),
  ('play', 'c636cfc0-4ac9-455f-a510-013ab1e2ccc4', '31000000-0000-4000-8000-000000000003', NOW() - INTERVAL 1 DAY),
  ('play', 'c636cfc0-4ac9-455f-a510-013ab1e2ccc4', '32000000-0000-4000-8000-000000000001', NOW() - INTERVAL 3 HOUR),
  ('play', 'c636cfc0-4ac9-455f-a510-013ab1e2ccc4', '33000000-0000-4000-8000-000000000001', NOW() - INTERVAL 90 MINUTE),
  ('play', 'c636cfc0-4ac9-455f-a510-013ab1e2ccc4', '34000000-0000-4000-8000-000000000001', NOW() - INTERVAL 10 MINUTE);

--  Populate track_stats: one row per track with total_count 1 (v3 worker maintains this incrementally)
INSERT INTO track_stats (track_id, total_count)
SELECT id, 1
FROM tracks
WHERE deleted_at IS NULL;
