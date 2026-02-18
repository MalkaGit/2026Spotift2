
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
  action_bar_image_url VARCHAR(512), -- URL to small action-bar thumbnail
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
('111a1e45-c1c2-4b56-a331-eba6bd9b9db8', 'c636cfc0-4ac9-455f-a510-013ab1e2ccc4', 'Taylor Swift', 'American singer-songwriter',
 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQUb00DH3n0v2jSivtTamHdYqx43xyR51-Hcg&s',
 'https://img.freepik.com/premium-photo/watercolor-illustration-depicting-artist-working-their-craft-surrounded-by-vibrant-spl_924727-134276.jpg?semt=ais_user_personalization&w=740&q=80',
 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQUb00DH3n0v2jSivtTamHdYqx43xyR51-Hcg&s'),

('222a1e45-c1c2-4b56-a331-eba6bd9b9db8', 'c636cfc0-4ac9-455f-a510-013ab1e2ccc4', 'Drake', 'Canadian rapper and singer',
 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSx4srWGPMQrPiSrqEI4oI3QKXoveB-f4UI5Q&s',
 'https://headerart.weebly.com/uploads/5/7/5/7/5757212/eye-catching-colorful-paints-art-header_orig.jpg',
 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSx4srWGPMQrPiSrqEI4oI3QKXoveB-f4UI5Q&s'),

('333a1e45-c1c2-4b56-a331-eba6bd9b9db8', 'c636cfc0-4ac9-455f-a510-013ab1e2ccc4', 'Ed Sheeran', 'English pop singer-songwriter',
 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTkV1bPiUDbSj6QV7w_tFyJrgGy77smiXnybB5nXZCOltmYBAzY_a_BmDY&s',
 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQXfpdFmvpRY2-_cjIdEj-l59jukh4oE_CrEQ&s',
 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTkV1bPiUDbSj6QV7w_tFyJrgGy77smiXnybB5nXZCOltmYBAzY_a_BmDY&s'),

('444a1e45-c1c2-4b56-a331-eba6bd9b9db8', 'c636cfc0-4ac9-455f-a510-013ab1e2ccc4', 'Beyoncé', 'American singer and performer',
 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcS9gXAHZYhIQ-0iGnHRL38rcwCCAsER6KfzQg&s',
 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRFeWSMPJ13SvJXow9XLlncZp442Rr3va4KIw&s',
 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcS9gXAHZYhIQ-0iGnHRL38rcwCCAsER6KfzQg&s'),

('555a1e45-c1c2-4b56-a331-eba6bd9b9db8', 'c636cfc0-4ac9-455f-a510-013ab1e2ccc4', 'Eminem', 'American rapper and producer',
 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTMtMZKiqJZMq26-kYYN56PvYECADkZG0pKCA&s',
 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSMNdsfpywUeKwm-6lrWS_YU2QQtTy-1k750Q&s',
 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTMtMZKiqJZMq26-kYYN56PvYECADkZG0pKCA&s'),

('666a1e45-c1c2-4b56-a331-eba6bd9b9db8', 'c636cfc0-4ac9-455f-a510-013ab1e2ccc4', 'Ariana Grande', 'American pop and R&B singer',
 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcS_GSsX68QVsi_k16pEKW0ExOCzhbk78JEQ8w&s',
 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQVeCSxm75WS-7lppF-gIfxBJ5LEWG0oWC-wA&s',
 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcS_GSsX68QVsi_k16pEKW0ExOCzhbk78JEQ8w&s'),

('777a1e45-c1c2-4b56-a331-eba6bd9b9db8', 'c636cfc0-4ac9-455f-a510-013ab1e2ccc4', 'Imagine Dragons', 'American pop rock band',
 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTJuFdDT2tn1xeF8x_4Y6DBmkTWMah5JrLogQ&s',
 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcT-VlqGKfVZGwvP-6V1oLEQOICtlmJ0EC58JA&s',
 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTJuFdDT2tn1xeF8x_4Y6DBmkTWMah5JrLogQ&s'),

('888a1e45-c1c2-4b56-a331-eba6bd9b9db8', 'c636cfc0-4ac9-455f-a510-013ab1e2ccc4', 'Rihanna', 'Barbadian singer and entrepreneur',
 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTMmGVcX-zXjjKWK5BqEFPitD4eYfMWHUartw&s',
 'https://img.freepik.com/premium-photo/watercolor-illustration-depicting-artist-working-their-craft-surrounded-by-vibrant-spl_924727-134276.jpg?semt=ais_user_personalization&w=740&q=80',
 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTMmGVcX-zXjjKWK5BqEFPitD4eYfMWHUartw&s'),

('999a1e45-c1c2-4b56-a331-eba6bd9b9db8', 'c636cfc0-4ac9-455f-a510-013ab1e2ccc4', 'The Weeknd', 'Canadian R&B singer',
 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRHnzgLe6ywwAgyAZ6Aymp5IpC6dvJKkSd9bg&s',
 'https://headerart.weebly.com/uploads/5/7/5/7/5757212/eye-catching-colorful-paints-art-header_orig.jpg',
 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRHnzgLe6ywwAgyAZ6Aymp5IpC6dvJKkSd9bg&s'),

('aaa1e450-c1c2-4b56-a331-eba6bd9b9db8', 'c636cfc0-4ac9-455f-a510-013ab1e2ccc4', 'Metallica', 'American heavy metal band',
 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRHnzgLe6ywwAgyAZ6Aymp5IpC6dvJKkSd9bg&s',
 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQXfpdFmvpRY2-_cjIdEj-l59jukh4oE_CrEQ&s',
 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRHnzgLe6ywwAgyAZ6Aymp5IpC6dvJKkSd9bg&s');

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
  artist_id CHAR(36) NOT NULL,      -- FK → artists.id
  name VARCHAR(255) NOT NULL,
  image_url VARCHAR(512),           -- URL to album cover image
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL DEFAULT NULL,
  CONSTRAINT fk_album_artist FOREIGN KEY (artist_id)
    REFERENCES artists(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Fetch all albums of an artist and support search/sort
CREATE INDEX idx_album_artist ON albums(artist_id);
CREATE INDEX idx_album_artist_name ON albums(artist_id, name);

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
--  artist_stats TABLE (per-artist aggregate stats)
--  ========================================
DROP TABLE IF EXISTS artist_stats;

CREATE TABLE artist_stats (
  artist_id CHAR(36) NOT NULL PRIMARY KEY,  -- FK → artists.id
  monthly_listeners BIGINT NOT NULL,
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
--  track_play_events TABLE (denormalized play events)
--  ========================================
DROP TABLE IF EXISTS track_play_events;

CREATE TABLE track_play_events (
  id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  user_id CHAR(36) NOT NULL,       -- FK → users.id
  track_id CHAR(36) NOT NULL,      -- FK → tracks.id
  artist_id CHAR(36) NOT NULL,     -- FK → artists.id (denormalized)
  played_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_tpe_user FOREIGN KEY (user_id)
    REFERENCES users(id),         -- NO CASCADE: keep historical play events even if user is soft-deleted
  CONSTRAINT fk_tpe_track FOREIGN KEY (track_id)
    REFERENCES tracks(id),        -- NO CASCADE: keep historical play events even if track is soft-deleted
  CONSTRAINT fk_tpe_artist FOREIGN KEY (artist_id)
    REFERENCES artists(id)        -- NO CASCADE: keep historical play events even if artist is soft-deleted
) ENGINE=InnoDB;

-- Common analytics and query patterns
CREATE INDEX idx_tpe_user_played_at ON track_play_events(user_id, played_at DESC);
CREATE INDEX idx_tpe_artist_played_at ON track_play_events(artist_id, played_at DESC);
CREATE INDEX idx_tpe_track_played_at ON track_play_events(track_id, played_at DESC);

--  ========================================
--  Seed albums, tracks, and stats
--  ========================================

--  Seed albums (artist has albums). Album cover images reuse existing artist images.
INSERT INTO albums (id, artist_id, name, image_url)
VALUES
  -- Taylor Swift
  ('10000000-0000-0000-0000-000000000001', '111a1e45-c1c2-4b56-a331-eba6bd9b9db8', '1989 (Taylor''s Version)', 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQUb00DH3n0v2jSivtTamHdYqx43xyR51-Hcg&s'),
  ('10000000-0000-0000-0000-000000000002', '111a1e45-c1c2-4b56-a331-eba6bd9b9db8', 'Midnights', 'https://img.freepik.com/premium-photo/watercolor-illustration-depicting-artist-working-their-craft-surrounded-by-vibrant-spl_924727-134276.jpg?semt=ais_user_personalization&w=740&q=80'),

  -- Drake
  ('20000000-0000-0000-0000-000000000001', '222a1e45-c1c2-4b56-a331-eba6bd9b9db8', 'Scorpion', 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSx4srWGPMQrPiSrqEI4oI3QKXoveB-f4UI5Q&s'),

  -- Ed Sheeran
  ('30000000-0000-0000-0000-000000000001', '333a1e45-c1c2-4b56-a331-eba6bd9b9db8', '÷ (Divide)', 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTkV1bPiUDbSj6QV7w_tFyJrgGy77smiXnybB5nXZCOltmYBAzY_a_BmDY&s'),

  -- Beyoncé
  ('40000000-0000-0000-0000-000000000001', '444a1e45-c1c2-4b56-a331-eba6bd9b9db8', 'Lemonade', 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcS9gXAHZYhIQ-0iGnHRL38rcwCCAsER6KfzQg&s');

--  Seed tracks (id, name, duration_ms, album_id)
INSERT INTO tracks (id, name, duration_ms, album_id)
VALUES
  -- Taylor Swift - 1989 (Taylor's Version)
  ('31000000-0000-0000-0000-000000000001', 'Blank Space (Taylor''s Version)', 231000, '10000000-0000-0000-0000-000000000001'),
  ('31000000-0000-0000-0000-000000000002', 'Style (Taylor''s Version)', 231000, '10000000-0000-0000-0000-000000000001'),

  -- Taylor Swift - Midnights
  ('31000000-0000-0000-0000-000000000003', 'Anti-Hero', 200000, '10000000-0000-0000-0000-000000000002'),

  -- Drake - Scorpion
  ('32000000-0000-0000-0000-000000000001', 'God''s Plan', 198000, '20000000-0000-0000-0000-000000000001'),

  -- Ed Sheeran - ÷ (Divide)
  ('33000000-0000-0000-0000-000000000001', 'Shape of You', 234000, '30000000-0000-0000-0000-000000000001'),

  -- Beyoncé - Lemonade
  ('34000000-0000-0000-0000-000000000001', 'Formation', 215000, '40000000-0000-0000-0000-000000000001');

--  Seed artist_stats (artist_id, monthly_listeners)
INSERT INTO artist_stats (artist_id, monthly_listeners)
VALUES
  ('111a1e45-c1c2-4b56-a331-eba6bd9b9db8', 95000000),  -- Taylor Swift
  ('222a1e45-c1c2-4b56-a331-eba6bd9b9db8', 72000000),  -- Drake
  ('333a1e45-c1c2-4b56-a331-eba6bd9b9db8', 68000000),  -- Ed Sheeran
  ('444a1e45-c1c2-4b56-a331-eba6bd9b9db8', 55000000);  -- Beyoncé

--  Seed artist_top_tracks_stats (artist_id, track_id, total_plays)
INSERT INTO artist_top_tracks_stats (artist_id, track_id, total_plays)
VALUES
  ('111a1e45-c1c2-4b56-a331-eba6bd9b9db8', '31000000-0000-0000-0000-000000000001', 1500000000), -- Taylor Swift - Blank Space
  ('111a1e45-c1c2-4b56-a331-eba6bd9b9db8', '31000000-0000-0000-0000-000000000003', 1200000000), -- Taylor Swift - Anti-Hero
  ('222a1e45-c1c2-4b56-a331-eba6bd9b9db8', '32000000-0000-0000-0000-000000000001', 1800000000), -- Drake - God's Plan
  ('333a1e45-c1c2-4b56-a331-eba6bd9b9db8', '33000000-0000-0000-0000-000000000001', 2100000000), -- Ed Sheeran - Shape of You
  ('444a1e45-c1c2-4b56-a331-eba6bd9b9db8', '34000000-0000-0000-0000-000000000001', 800000000);  -- Beyoncé - Formation

--  Seed track_play_events (user_id, track_id, artist_id, played_at)
INSERT INTO track_play_events (user_id, track_id, artist_id, played_at)
VALUES
  -- Admin user playing various tracks
  ('c636cfc0-4ac9-455f-a510-013ab1e2ccc4', '31000000-0000-0000-0000-000000000001', '111a1e45-c1c2-4b56-a331-eba6bd9b9db8', NOW() - INTERVAL 2 DAY),
  ('c636cfc0-4ac9-455f-a510-013ab1e2ccc4', '31000000-0000-0000-0000-000000000003', '111a1e45-c1c2-4b56-a331-eba6bd9b9db8', NOW() - INTERVAL 1 DAY),
  ('c636cfc0-4ac9-455f-a510-013ab1e2ccc4', '32000000-0000-0000-0000-000000000001', '222a1e45-c1c2-4b56-a331-eba6bd9b9db8', NOW() - INTERVAL 3 HOUR),
  ('c636cfc0-4ac9-455f-a510-013ab1e2ccc4', '33000000-0000-0000-0000-000000000001', '333a1e45-c1c2-4b56-a331-eba6bd9b9db8', NOW() - INTERVAL 90 MINUTE),
  ('c636cfc0-4ac9-455f-a510-013ab1e2ccc4', '34000000-0000-0000-0000-000000000001', '444a1e45-c1c2-4b56-a331-eba6bd9b9db8', NOW() - INTERVAL 10 MINUTE);
