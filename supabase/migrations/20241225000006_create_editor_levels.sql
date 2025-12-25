-- Create editor_levels table
CREATE TABLE IF NOT EXISTS editor_levels (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  structure_seed INTEGER NOT NULL,
  decoration_seed INTEGER NOT NULL,
  spawn_seed INTEGER NOT NULL,
  width INTEGER NOT NULL DEFAULT 100,
  height INTEGER NOT NULL DEFAULT 100,
  algorithm INTEGER NOT NULL DEFAULT 1,
  created_by BIGINT REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  notes TEXT
);

-- Indices
CREATE INDEX IF NOT EXISTS idx_editor_levels_created_by ON editor_levels(created_by);
CREATE INDEX IF NOT EXISTS idx_editor_levels_name ON editor_levels(name);

-- RLS
ALTER TABLE editor_levels ENABLE ROW LEVEL SECURITY;

-- Anyone can read levels
CREATE POLICY "Allow public read access to editor_levels"
  ON editor_levels FOR SELECT TO public USING (true);

-- Service role can manage levels
CREATE POLICY "Service role can manage editor_levels"
  ON editor_levels FOR ALL TO service_role USING (true) WITH CHECK (true);

-- updated_at trigger (reuses function from app_metadata migration)
CREATE TRIGGER update_editor_levels_updated_at
  BEFORE UPDATE ON editor_levels
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
