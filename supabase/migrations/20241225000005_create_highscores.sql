-- Create highscores table
CREATE TABLE IF NOT EXISTS highscores (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  score INTEGER NOT NULL,
  enemies_defeated INTEGER DEFAULT 0,
  rooms_explored INTEGER DEFAULT 0,
  xp_gained INTEGER DEFAULT 0,
  max_combo INTEGER DEFAULT 0,
  play_time_seconds INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indices for leaderboard queries
CREATE INDEX IF NOT EXISTS idx_highscores_score ON highscores(score DESC);
CREATE INDEX IF NOT EXISTS idx_highscores_user_id ON highscores(user_id);

-- RLS
ALTER TABLE highscores ENABLE ROW LEVEL SECURITY;

-- Anyone can read highscores
CREATE POLICY "Allow public read access to highscores"
  ON highscores FOR SELECT TO public USING (true);

-- Service role can manage highscores
CREATE POLICY "Service role can manage highscores"
  ON highscores FOR ALL TO service_role USING (true) WITH CHECK (true);
