-- Create xp_log table
CREATE TABLE IF NOT EXISTS xp_log (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  gained_at TIMESTAMPTZ DEFAULT NOW(),
  xp_amount INTEGER NOT NULL,
  reason TEXT NOT NULL,
  enemy_level INTEGER
);

-- Index for user queries
CREATE INDEX IF NOT EXISTS idx_xp_log_user_id ON xp_log(user_id);

-- RLS
ALTER TABLE xp_log ENABLE ROW LEVEL SECURITY;

-- Service role can manage xp_log
CREATE POLICY "Service role can manage xp_log"
  ON xp_log FOR ALL TO service_role USING (true) WITH CHECK (true);
