CREATE TABLE videos (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  filename TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_size INTEGER,
  duration INTEGER DEFAULT 0,
  thumbnail_url TEXT,
  views INTEGER DEFAULT 0,
  user_id TEXT,
  user_email TEXT,
  status TEXT DEFAULT 'ready',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE analytics (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  video_id TEXT NOT NULL,
  event_type TEXT NOT NULL,
  user_id TEXT,
  timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (video_id) REFERENCES videos(id)
);

CREATE INDEX idx_videos_created ON videos(created_at DESC);
CREATE INDEX idx_videos_user ON videos(user_id);
CREATE INDEX idx_analytics_video ON analytics(video_id);