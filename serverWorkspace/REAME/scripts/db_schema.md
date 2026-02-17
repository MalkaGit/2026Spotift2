-- =====================================================
-- Spotify2DB: Full MySQL Setup + Sample Data
-- All IDs are valid UUIDs
-- Includes FULLTEXT indexes
-- =====================================================
DROP DATABASE IF EXISTS spotify2db;
CREATE DATABASE spotify2db;
USE spotify2db;
-- =============================================
-- Users 
-- =============================================
CREATE TABLE users (
    id CHAR(36) PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(255) NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO users (id,email,password_hash,role) VALUES
('3fa85f64-5717-4562-b3fc-2c963f66afa6','alice@example.com','hash1','listener'),
('3fa85f64-5717-4562-b3fc-2c963f66afb7','bob@example.com','hash2','listener');
-- =============================================
--  Artists 
-- =============================================
CREATE TABLE artists (
    id CHAR(36) PRIMARY KEY,
    user_id CHAR(36) NOT NULL,
    name VARCHAR(255) NOT NULL,
    bio TEXT,
    image_url VARCHAR(512),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);
-- Full-text search index on name for fast text search
CREATE FULLTEXT INDEX idx_artist_name_ft ON artists(name);
INSERT INTO artists (id,user_id,name,bio,image_url) VALUES
('d290f1ee-6c54-4b01-90e6-d701748f0851','3fa85f64-5717-4562-b3fc-2c963f66afa6','Taylor Swift','Pop singer','https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQUb00DH3n0v2jSivtTamHdYqx43xyR51-Hcg&s'),
('d290f1ee-6c54-4b01-90e6-d701748f0852','3fa85f64-5717-4562-b3fc-2c963f66afa6','Drake','Rap artist','https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSx4srWGPMQrPiSrqEI4oI3QKXoveB-f4UI5Q&s'),
('d290f1ee-6c54-4b01-90e6-d701748f0853','3fa85f64-5717-4562-b3fc-2c963f66afa6','Ed Sheeran','Singer-songwriter','https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTkV1bPiUDbSj6QV7w_tFyJrgGy77smiXnybB5nXZCOltmYBAzY_a_BmDY&s'),
('d290f1ee-6c54-4b01-90e6-d701748f0854','3fa85f64-5717-4562-b3fc-2c963f66afa6','Beyoncé','Pop singer','https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcS9gXAHZYhIQ-0iGnHRL38rcwCCAsER6KfzQg&s'),
('d290f1ee-6c54-4b01-90e6-d701748f0855','3fa85f64-5717-4562-b3fc-2c963f66afa6','Eminem','Rap legend','https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTMtMZKiqJZMq26-kYYN56PvYECADkZG0pKCA&s'),
('d290f1ee-6c54-4b01-90e6-d701748f0856','3fa85f64-5717-4562-b3fc-2c963f66afa6','Ariana Grande','Pop singer','https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcS_GSsX68QVsi_k16pEKW0ExOCzhbk78JEQ8w&s'),
('d290f1ee-6c54-4b01-90e6-d701748f0857','3fa85f64-5717-4562-b3fc-2c963f66afa6','Imagine Dragons','Rock band','https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTJuFdDT2tn1xeF8x_4Y6DBmkTWMah5JrLogQ&s'),
('d290f1ee-6c54-4b01-90e6-d701748f0858','3fa85f64-5717-4562-b3fc-2c963f66afa6','Rihanna','Pop singer','https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTMmGVcX-zXjjKWK5BqEFPitD4eYfMWHUartw&s'),
('d290f1ee-6c54-4b01-90e6-d701748f0859','3fa85f64-5717-4562-b3fc-2c963f66afa6','The Weeknd','R&B singer','https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRHnzgLe6ywwAgyAZ6Aymp5IpC6dvJKkSd9bg&s'),
('d290f1ee-6c54-4b01-90e6-d701748f0860','3fa85f64-5717-4562-b3fc-2c963f66afa6','Metallica','Heavy metal band','https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRHnzgLe6ywwAgyAZ6Aymp5IpC6dvJKkSd9bg&s');
-- =============================================
--  Albums 
-- =============================================
CREATE TABLE albums (
    id CHAR(36) PRIMARY KEY,
    artist_id CHAR(36) NOT NULL,
    name VARCHAR(255) NOT NULL,
    release_date DATE,
    image_url VARCHAR(512),
    FOREIGN KEY (artist_id) REFERENCES artists(id)
);
INSERT INTO albums (id,artist_id,name,release_date,image_url) VALUES
('5b1c2f68-89de-4f07-9a2c-1e7f9c1f77c1','d290f1ee-6c54-4b01-90e6-d701748f0851','Fearless','2008-11-11','https://via.placeholder.com/200x200.png?text=Fearless'),
('5b1c2f68-89de-4f07-9a2c-1e7f9c1f77c2','d290f1ee-6c54-4b01-90e6-d701748f0852','Scorpion','2018-06-29','https://via.placeholder.com/200x200.png?text=Scorpion'),
('5b1c2f68-89de-4f07-9a2c-1e7f9c1f77c3','d290f1ee-6c54-4b01-90e6-d701748f0853','Divide','2017-03-03','https://via.placeholder.com/200x200.png?text=Divide');
-- =============================================
--  Tracks (including one artist with 11 tracks for top-10) 
-- =============================================
CREATE TABLE tracks (
    id CHAR(36) PRIMARY KEY,
    album_id CHAR(36),
    artist_id CHAR(36),
    name VARCHAR(255) NOT NULL,
    duration_ms INT,
    FOREIGN KEY (album_id) REFERENCES albums(id),
    FOREIGN KEY (artist_id) REFERENCES artists(id)
);
INSERT INTO tracks (id,album_id,artist_id,name,duration_ms) VALUES
('f1a7f1b2-1b1c-4b52-88c6-0e9e1f3b67a1','5b1c2f68-89de-4f07-9a2c-1e7f9c1f77c1','d290f1ee-6c54-4b01-90e6-d701748f0851','Love Story',230000),
('f1a7f1b2-1b1c-4b52-88c6-0e9e1f3b67a2','5b1c2f68-89de-4f07-9a2c-1e7f9c1f77c1','d290f1ee-6c54-4b01-90e6-d701748f0851','You Belong With Me',210000),
('f1a7f1b2-1b1c-4b52-88c6-0e9e1f3b67a3','5b1c2f68-89de-4f07-9a2c-1e7f9c1f77c1','d290f1ee-6c54-4b01-90e6-d701748f0851','Shake It Off',220000),
('f1a7f1b2-1b1c-4b52-88c6-0e9e1f3b67a4','5b1c2f68-89de-4f07-9a2c-1e7f9c1f77c1','d290f1ee-6c54-4b01-90e6-d701748f0851','Blank Space',215000),
('f1a7f1b2-1b1c-4b52-88c6-0e9e1f3b67a5','5b1c2f68-89de-4f07-9a2c-1e7f9c1f77c1','d290f1ee-6c54-4b01-90e6-d701748f0851','Style',200000),
('f1a7f1b2-1b1c-4b52-88c6-0e9e1f3b67a6','5b1c2f68-89de-4f07-9a2c-1e7f9c1f77c1','d290f1ee-6c54-4b01-90e6-d701748f0851','Wildest Dreams',205000),
('f1a7f1b2-1b1c-4b52-88c6-0e9e1f3b67a7','5b1c2f68-89de-4f07-9a2c-1e7f9c1f77c1','d290f1ee-6c54-4b01-90e6-d701748f0851','Bad Blood',210000),
('f1a7f1b2-1b1c-4b52-88c6-0e9e1f3b67a8','5b1c2f68-89de-4f07-9a2c-1e7f9c1f77c1','d290f1ee-6c54-4b01-90e6-d701748f0851','Mine',215000),
('f1a7f1b2-1b1c-4b52-88c6-0e9e1f3b67a9','5b1c2f68-89de-4f07-9a2c-1e7f9c1f77c1','d290f1ee-6c54-4b01-90e6-d701748f0851','Enchanted',220000),
('f1a7f1b2-1b1c-4b52-88c6-0e9e1f3b67b0','5b1c2f68-89de-4f07-9a2c-1e7f9c1f77c1','d290f1ee-6c54-4b01-90e6-d701748f0851','All Too Well',230000),
('f1a7f1b2-1b1c-4b52-88c6-0e9e1f3b67b1','5b1c2f68-89de-4f07-9a2c-1e7f9c1f77c1','d290f1ee-6c54-4b01-90e6-d701748f0851','The Archer',210000);
-- =============================================
--  Likes (FULLTEXT index) 
-- =============================================
CREATE TABLE likes (
    id CHAR(36) PRIMARY KEY,
    user_id CHAR(36) NOT NULL,
    entity_type VARCHAR(50) NOT NULL,
    entity_id CHAR(36) NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uq_user_entity (user_id, entity_type, entity_id)
);
CREATE FULLTEXT INDEX idx_likes_entity_type_ft ON likes(entity_type);
INSERT INTO likes (id,user_id,entity_type,entity_id) VALUES
('b0c1e1f2-4a4b-4d6f-b1a7-2c2f9d3e4a1b','3fa85f64-5717-4562-b3fc-2c963f66afa6','track','f1a7f1b2-1b1c-4b52-88c6-0e9e1f3b67a1');
-- =============================================
--  Playlists & Playlist Tracks 
-- =============================================
CREATE TABLE playlists (
    id CHAR(36) PRIMARY KEY,
    owner_id CHAR(36) NOT NULL,
    name VARCHAR(255) NOT NULL,
    image_url VARCHAR(512)
);
INSERT INTO playlists (id,owner_id,name,image_url) VALUES
('6a1b2c3d-1234-4c5d-8e9f-abcdef123456','3fa85f64-5717-4562-b3fc-2c963f66afa6','My Favorites','https://via.placeholder.com/200x200.png?text=Playlist');
CREATE TABLE playlist_tracks (
    playlist_id CHAR(36) NOT NULL,
    track_id CHAR(36) NOT NULL,
    position INT NOT NULL,
    PRIMARY KEY(playlist_id, track_id)
);
INSERT INTO playlist_tracks (playlist_id,track_id,position) VALUES
('6a1b2c3d-1234-4c5d-8e9f-abcdef123456','f1a7f1b2-1b1c-4b52-88c6-0e9e1f3b67a1',1),
('6a1b2c3d-1234-4c5d-8e9f-abcdef123456','f1a7f1b2-1b1c-4b52-88c6-0e9e1f3b67a2',2);
-- =============================================
--  User Follows 
-- =============================================
CREATE TABLE user_followed_artists (
    user_id CHAR(36) NOT NULL,
    artist_id CHAR(36) NOT NULL,
    PRIMARY KEY(user_id, artist_id)
);
INSERT INTO user_followed_artists (user_id,artist_id) VALUES
('3fa85f64-5717-4562-b3fc-2c963f66afa6','d290f1ee-6c54-4b01-90e6-d701748f0851');
-- =============================================
--  Track Play Events (renamed)
-- =============================================
CREATE TABLE track_play_events (
    id CHAR(36) PRIMARY KEY,
    user_id CHAR(36) NOT NULL,
    track_id CHAR(36) NOT NULL,
    artist_id CHAR(36),
    played_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_track_id (track_id),
    INDEX idx_artist_id (artist_id),
    INDEX idx_user_id (user_id)
);
-- Example: Taylor Swift tracks played multiple times
INSERT INTO track_play_events (id,user_id,track_id,artist_id) VALUES
('7f1e1d2c-1234-4b52-88c6-0e9e1f3b67a1','3fa85f64-5717-4562-b3fc-2c963f66afa6','f1a7f1b2-1b1c-4b52-88c6-0e9e1f3b67a1','d290f1ee-6c54-4b01-90e6-d701748f0851'),
('7f1e1d2c-1234-4b52-88c6-0e9e1f3b67a2','3fa85f64-5717-4562-b3fc-2c963f66afa6','f1a7f1b2-1b1c-4b52-88c6-0e9e1f3b67a2','d290f1ee-6c54-4b01-90e6-d701748f0851'),
('7f1e1d2c-1234-4b52-88c6-0e9e1f3b67a3','3fa85f64-5717-4562-b3fc-2c963f66afa6','f1a7f1b2-1b1c-4b52-88c6-0e9e1f3b67a3','d290f1ee-6c54-4b01-90e6-d701748f0851');
-- =============================================
--  Track Stats 
-- =============================================
CREATE TABLE
track_stats (
track_id CHAR(36) PRIMARY KEY,
total_plays BIGINT DEFAULT 0,
popularity_score FLOAT DEFAULT 0
);
INSERT INTO track_stats (track_id,total_plays,popularity_score) VALUES
('f1a7f1b2-1b1c-4b52-88c6-0e9e1f3b67a1',15,90.5),
('f1a7f1b2-1b1c-4b52-88c6-0e9e1f3b67a2',10,80.0);
-- =============================================
--  Artist Stats 
-- =============================================
CREATE TABLE artist_stats (
artist_id CHAR(36) PRIMARY KEY,
monthly_listeners BIGINT DEFAULT 0,
popularity_score FLOAT DEFAULT 0
);
INSERT INTO artist_stats (artist_id,monthly_listeners,popularity_score) VALUES
('d290f1ee-6c54-4b01-90e6-d701748f0851',5000000,95.0),
('d290f1ee-6c54-4b01-90e6-d701748f0852',3000000,85.0);
-- =============================================
--  Artist Top Tracks Stats (new)
-- =============================================
CREATE TABLE artist_top_tracks_stats (
    artist_id CHAR(36) NOT NULL,
    track_id CHAR(36) NOT NULL,
    total_plays BIGINT DEFAULT 0,
    PRIMARY KEY(artist_id, track_id),
    FOREIGN KEY (artist_id) REFERENCES artists(id),
    FOREIGN KEY (track_id) REFERENCES tracks(id)
);
-- Populate from track_stats and tracks
INSERT INTO artist_top_tracks_stats (artist_id, track_id, total_plays)
SELECT t.artist_id, ts.track_id, ts.total_plays
FROM tracks t
JOIN track_stats ts ON t.id = ts.track_id;
