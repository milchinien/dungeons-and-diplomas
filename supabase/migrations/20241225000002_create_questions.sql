-- Create questions table
CREATE TABLE IF NOT EXISTS questions (
  id BIGSERIAL PRIMARY KEY,
  subject_key TEXT NOT NULL,
  subject_name TEXT NOT NULL,
  question TEXT NOT NULL,
  answers JSONB NOT NULL,
  correct_index INTEGER NOT NULL CHECK (correct_index >= 0 AND correct_index <= 3),
  difficulty INTEGER DEFAULT 5,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for subject queries
CREATE INDEX IF NOT EXISTS idx_questions_subject_key ON questions(subject_key);

-- RLS
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;

-- Everyone can read questions
CREATE POLICY "Allow public read access to questions"
  ON questions FOR SELECT TO public USING (true);

-- Service role can manage questions
CREATE POLICY "Service role can manage questions"
  ON questions FOR ALL TO service_role USING (true) WITH CHECK (true);
