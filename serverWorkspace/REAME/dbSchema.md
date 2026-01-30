


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
('111a1e45-c1c2-4b56-a331-eba6bd9b9db8', '000f0e50-c1c2-4b56-a331-eba6bd9b9db9', 'Taylor Swift', 'American singer-songwriter'),

('222a1e45-c1c2-4b56-a331-eba6bd9b9db8', '000f0e50-c1c2-4b56-a331-eba6bd9b9db9', 'Drake', 'Canadian rapper and singer'),

('333a1e45-c1c2-4b56-a331-eba6bd9b9db8', '000f0e50-c1c2-4b56-a331-eba6bd9b9db9', 'Ed Sheeran', 'English pop singer-songwriter'),

('444a1e45-c1c2-4b56-a331-eba6bd9b9db8', '000f0e50-c1c2-4b56-a331-eba6bd9b9db9', 'Beyoncé', 'American singer and performer'),

('555a1e45-c1c2-4b56-a331-eba6bd9b9db8', '000f0e50-c1c2-4b56-a331-eba6bd9b9db9', 'Eminem', 'American rapper and producer'),

('666a1e45-c1c2-4b56-a331-eba6bd9b9db8', '000f0e50-c1c2-4b56-a331-eba6bd9b9db9', 'Ariana Grande', 'American pop and R&B singer'),

('777a1e45-c1c2-4b56-a331-eba6bd9b9db8', '000f0e50-c1c2-4b56-a331-eba6bd9b9db9', 'Imagine Dragons', 'American pop rock band'),

('888a1e45-c1c2-4b56-a331-eba6bd9b9db8', '000f0e50-c1c2-4b56-a331-eba6bd9b9db9', 'Rihanna', 'Barbadian singer and entrepreneur'),

('999a1e45-c1c2-4b56-a331-eba6bd9b9db8', '000f0e50-c1c2-4b56-a331-eba6bd9b9db9', 'The Weeknd', 'Canadian R&B singer'),

('aaa1e450-c1c2-4b56-a331-eba6bd9b9db8', '000f0e50-c1c2-4b56-a331-eba6bd9b9db9', 'Metallica', 'American heavy metal band');






========================================================
--  user_likes TABLE (artist\album\playlists has many likes)
--  ======================================================== 
DROP TABLE IF EXISTS user_likes;

CREATE TABLE user_likes (
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
CREATE INDEX idx_likes_user ON user_likes(user_id);

--  Sort likes by creation time per user (pagination by created_at)
CREATE INDEX idx_likes_user_created ON user_likes(user_id, created_at DESC);

--  Quickly count or fetch likes for a specific entity
CREATE INDEX idx_likes_entity ON user_likes(entity_type, entity_id);

 
--Insert Example

--INSERT INTO user_likes (id, user_id, entity_type, entity_id)
--VALUES
--('like-1', '000f0e50-c1c2-4b56-a331-eba6bd9b9db9', 'artist', 'artist-1'),
--('like-2', '000f0e50-c1c2-4b56-a331-eba6bd9b9db9', 'artist', 'artist-2'),
--('like-3', '47e3f0fd-ea37-4b45-9894-b9779bd670df', 'artist', 'artist-3');

 

 

 