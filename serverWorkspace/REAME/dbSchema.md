root
Aa12345678!
--  ========================================
--  users TABLE (user manages many artists)
--  ======================================== 
use  spotify2db;
DROP TABLE IF EXISTS users;

CREATE TABLE users (
  id CHAR(36) PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);



--  ========================================
--  ARTISTS TABLE (user manages many artists)
--  ======================================== 

DROP TABLE IF EXISTS artists;

CREATE TABLE artists (
  id CHAR(36) NOT NULL PRIMARY KEY,
  user_id CHAR(36) NOT NULL,--the user that manage the artist data
  name VARCHAR(255) NOT NULL,
  bio TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_artist_user FOREIGN KEY (user_id)
    REFERENCES users(id) ON DELETE CASCADE --when user deleted, the Artists it manages are deleted
) ENGINE=InnoDB;

-- when user deleted, the artirst it manages are deleted as well
--  Quickly search artists by name, migh5 help reading favorites by name
CREATE INDEX idx_artist_name ON artists(name);

-- Fetch all artists of a given user
CREATE INDEX idx_artist_user ON artists(user_id);








INSERT INTO artists (id, user_id, name, bio)
VALUES
('111a1e45-c1c2-4b56-a331-eba6bd9b9db8', 'c636cfc0-4ac9-455f-a510-013ab1e2ccc4', 'Taylor Swift', 'American singer-songwriter'),

('222a1e45-c1c2-4b56-a331-eba6bd9b9db8', 'c636cfc0-4ac9-455f-a510-013ab1e2ccc4', 'Drake', 'Canadian rapper and singer'),

('333a1e45-c1c2-4b56-a331-eba6bd9b9db8', 'c636cfc0-4ac9-455f-a510-013ab1e2ccc4', 'Ed Sheeran', 'English pop singer-songwriter'),

('444a1e45-c1c2-4b56-a331-eba6bd9b9db8', 'c636cfc0-4ac9-455f-a510-013ab1e2ccc4', 'Beyoncé', 'American singer and performer'),

('555a1e45-c1c2-4b56-a331-eba6bd9b9db8', 'c636cfc0-4ac9-455f-a510-013ab1e2ccc4', 'Eminem', 'American rapper and producer'),

('666a1e45-c1c2-4b56-a331-eba6bd9b9db8', 'c636cfc0-4ac9-455f-a510-013ab1e2ccc4', 'Ariana Grande', 'American pop and R&B singer'),

('777a1e45-c1c2-4b56-a331-eba6bd9b9db8', 'c636cfc0-4ac9-455f-a510-013ab1e2ccc4', 'Imagine Dragons', 'American pop rock band'),

('888a1e45-c1c2-4b56-a331-eba6bd9b9db8', 'c636cfc0-4ac9-455f-a510-013ab1e2ccc4', 'Rihanna', 'Barbadian singer and entrepreneur'),

('999a1e45-c1c2-4b56-a331-eba6bd9b9db8', 'c636cfc0-4ac9-455f-a510-013ab1e2ccc4', 'The Weeknd', 'Canadian R&B singer'),

('aaa1e450-c1c2-4b56-a331-eba6bd9b9db8', 'c636cfc0-4ac9-455f-a510-013ab1e2ccc4', 'Metallica', 'American heavy metal band');






========================================================
--  likes TABLE (artist\album\playlists has many likes)
--  ======================================================== 
DROP TABLE IF EXISTS likes;

CREATE TABLE likes (
  id CHAR(36) NOT NULL PRIMARY KEY,                   -- unique like ID
  user_id CHAR(36) NOT NULL,                                 -- FK → users.id
  entity_type VARCHAR(32) NOT NULL,                  -- type of entity (artist, album, playlist, etc.)
  entity_id CHAR(36) NOT NULL,                             -- ID of liked entity, no fk and delete cascade
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,     -- timestamp of like
  UNIQUE KEY uq_like (user_id, entity_type, entity_id),--user can like same entity twice
  CONSTRAINT fk_like_user FOREIGN KEY (user_id)
    REFERENCES users(id) ON DELETE CASCADE -- fk, if user deleted it’s likes deleted automatically
) ENGINE=InnoDB;

-- when user is deleted, delete cascase ensure its likes are dleted in transaction as well
-- when artis is deleted , we need to code transaction to delete it’s likes



-- Quickly fetch all likes of a user
CREATE INDEX idx_likes_user ON likes(user_id);

--  Sort likes by creation time per user (pagination by created_at)
CREATE INDEX idx_likes_user_created ON likes(user_id, created_at DESC);

--  Quickly count or fetch likes for a specific entity
CREATE INDEX idx_likes_entity ON likes(entity_type, entity_id);

 
--Insert Example
with postman 







--  ========================================
--  ALBUMS TABLE (user manages many artists)
--  ======================================== 

DROP TABLE IF EXISTS albums;

CREATE TABLE albums (
  id CHAR(36) NOT NULL PRIMARY KEY,
   name VARCHAR(255) NOT NULL
) ENGINE=InnoDB;
 
--  ========================================
--  PLAYLISTS TABLE (user manages many artists)
--  ======================================== 

DROP TABLE IF EXISTS playlists;

CREATE TABLE playlists (
  id CHAR(36) NOT NULL PRIMARY KEY,
   name VARCHAR(255) NOT NULL
) ENGINE=InnoDB;
 

 

 

 