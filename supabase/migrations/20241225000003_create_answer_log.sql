-- Create answer_log table
CREATE TABLE IF NOT EXISTS answer_log (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  answered_at TIMESTAMPTZ DEFAULT NOW(),
  question_id BIGINT NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  selected_answer_index INTEGER NOT NULL CHECK (selected_answer_index >= 0 AND selected_answer_index <= 3),
  is_correct BOOLEAN NOT NULL,
  answer_time_ms INTEGER,
  timeout_occurred BOOLEAN DEFAULT FALSE
);

-- Indices for common queries
CREATE INDEX IF NOT EXISTS idx_answer_log_user_id ON answer_log(user_id);
CREATE INDEX IF NOT EXISTS idx_answer_log_question_id ON answer_log(question_id);
CREATE INDEX IF NOT EXISTS idx_answer_log_user_question ON answer_log(user_id, question_id);

-- RLS
ALTER TABLE answer_log ENABLE ROW LEVEL SECURITY;

-- Service role can manage all answer logs
CREATE POLICY "Service role can manage answer_log"
  ON answer_log FOR ALL TO service_role USING (true) WITH CHECK (true);
