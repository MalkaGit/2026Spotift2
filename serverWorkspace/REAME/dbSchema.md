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
  image_url VARCHAR(512), -- URL to artist image/photo
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_artist_user FOREIGN KEY (user_id)
    REFERENCES users(id) ON DELETE CASCADE --when user deleted, the Artists it manages are deleted
) ENGINE=InnoDB;

-- when user deleted, the artirst it manages are deleted as well
-- Full-text search index on name for fast text search (used by search/v2)
CREATE FULLTEXT INDEX idx_artist_name_ft ON artists(name);

-- Regular index for LIKE-based search (used by search/v1) and sorting
CREATE INDEX idx_artist_name ON artists(name);

-- Fetch all artists of a given user
CREATE INDEX idx_artist_user ON artists(user_id);








INSERT INTO artists (id, user_id, name, bio, image_url)
VALUES
('111a1e45-c1c2-4b56-a331-eba6bd9b9db8', 'c636cfc0-4ac9-455f-a510-013ab1e2ccc4', 'Taylor Swift', 'American singer-songwriter', 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b5/191125_Taylor_Swift_at_the_2019_American_Music_Awards_%28cropped%29.png/256px-191125_Taylor_Swift_at_the_2019_American_Music_Awards_%28cropped%29.png'),

('222a1e45-c1c2-4b56-a331-eba6bd9b9db8', 'c636cfc0-4ac9-455f-a510-013ab1e2ccc4', 'Drake', 'Canadian rapper and singer', 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a0/Drake_-_OVO_Fest_2018_%2848634431131%29_%28cropped%29.jpg/256px-Drake_-_OVO_Fest_2018_%2848634431131%29_%28cropped%29.jpg'),

('333a1e45-c1c2-4b56-a331-eba6bd9b9db8', 'c636cfc0-4ac9-455f-a510-013ab1e2ccc4', 'Ed Sheeran', 'English pop singer-songwriter', 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/7e/Ed_Sheeran_%288508047844%29.jpg/256px-Ed_Sheeran_%288508047844%29.jpg'),

('444a1e45-c1c2-4b56-a331-eba6bd9b9db8', 'c636cfc0-4ac9-455f-a510-013ab1e2ccc4', 'Beyoncé', 'American singer and performer', 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/17/Beyonc%C3%A9_at_The_Lion_King_European_Premiere_2019.png/256px-Beyonc%C3%A9_at_The_Lion_King_European_Premiere_2019.png'),

('555a1e45-c1c2-4b56-a331-eba6bd9b9db8', 'c636cfc0-4ac9-455f-a510-013ab1e2ccc4', 'Eminem', 'American rapper and producer', 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/87/Eminem_-_Concert_for_Valor%2C_Washington%2C_D.C._Nov._11%2C_2014_%282%29_%28Cropped%29.jpg/256px-Eminem_-_Concert_for_Valor%2C_Washington%2C_D.C._Nov._11%2C_2014_%282%29_%28Cropped%29.jpg'),

('666a1e45-c1c2-4b56-a331-eba6bd9b9db8', 'c636cfc0-4ac9-455f-a510-013ab1e2ccc4', 'Ariana Grande', 'American pop and R&B singer', 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/dd/20200629_Ariana_Grande_White_House_%28cropped%29.jpg/256px-20200629_Ariana_Grande_White_House_%28cropped%29.jpg'),

('777a1e45-c1c2-4b56-a331-eba6bd9b9db8', 'c636cfc0-4ac9-455f-a510-013ab1e2ccc4', 'Imagine Dragons', 'American pop rock band', 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4f/Imagine_Dragons_2017_%28cropped%29.jpg/256px-Imagine_Dragons_2017_%28cropped%29.jpg'),

('888a1e45-c1c2-4b56-a331-eba6bd9b9db8', 'c636cfc0-4ac9-455f-a510-013ab1e2ccc4', 'Rihanna', 'Barbadian singer and entrepreneur', 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c7/Rihanna_Fenty_2018.png/256px-Rihanna_Fenty_2018.png'),

('999a1e45-c1c2-4b56-a331-eba6bd9b9db8', 'c636cfc0-4ac9-455f-a510-013ab1e2ccc4', 'The Weeknd', 'Canadian R&B singer', 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/7a/The_Weeknd_%2848448443451%29_%28cropped%29.jpg/256px-The_Weeknd_%2848448443451%29_%28cropped%29.jpg'),

('aaa1e450-c1c2-4b56-a331-eba6bd9b9db8', 'c636cfc0-4ac9-455f-a510-013ab1e2ccc4', 'Metallica', 'American heavy metal band', 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8a/Metallica_Live_at_The_O2_Arena_London_2017_11_10_%284%29_%28cropped%29.jpg/256px-Metallica_Live_at_The_O2_Arena_London_2017_11_10_%284%29_%28cropped%29.jpg');






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
 

 

 

 