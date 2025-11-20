-- Create app_metadata table for application-level configuration and version tracking
-- This table stores static information like version numbers, feature flags, etc.

CREATE TABLE IF NOT EXISTS app_metadata (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT UNIQUE NOT NULL,
  value TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add RLS (Row Level Security) policies
ALTER TABLE app_metadata ENABLE ROW LEVEL SECURITY;

-- Allow read access to everyone (metadata is public info)
CREATE POLICY "Allow public read access to app_metadata"
  ON app_metadata
  FOR SELECT
  TO public
  USING (true);

-- Only authenticated users can insert/update (for future admin features)
CREATE POLICY "Allow authenticated users to manage app_metadata"
  ON app_metadata
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Create index for faster key lookups
CREATE INDEX idx_app_metadata_key ON app_metadata(key);

-- Add updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_app_metadata_updated_at
  BEFORE UPDATE ON app_metadata
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
