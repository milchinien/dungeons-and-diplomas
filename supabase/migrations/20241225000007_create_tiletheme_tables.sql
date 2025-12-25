-- Create tilesets table
CREATE TABLE IF NOT EXISTS tilesets (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  path TEXT NOT NULL,
  width_tiles INTEGER NOT NULL,
  height_tiles INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create tile_themes table
CREATE TABLE IF NOT EXISTS tile_themes (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  floor_config JSONB NOT NULL,
  wall_config JSONB NOT NULL,
  door_config JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create dungeon_themes table
CREATE TABLE IF NOT EXISTS dungeon_themes (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  dark_theme_id BIGINT NOT NULL REFERENCES tile_themes(id) ON DELETE RESTRICT,
  light_theme_id BIGINT NOT NULL REFERENCES tile_themes(id) ON DELETE RESTRICT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indices
CREATE INDEX IF NOT EXISTS idx_tile_themes_name ON tile_themes(name);
CREATE INDEX IF NOT EXISTS idx_dungeon_themes_name ON dungeon_themes(name);

-- RLS for all tiletheme tables
ALTER TABLE tilesets ENABLE ROW LEVEL SECURITY;
ALTER TABLE tile_themes ENABLE ROW LEVEL SECURITY;
ALTER TABLE dungeon_themes ENABLE ROW LEVEL SECURITY;

-- Public read access
CREATE POLICY "Allow public read access to tilesets"
  ON tilesets FOR SELECT TO public USING (true);
CREATE POLICY "Allow public read access to tile_themes"
  ON tile_themes FOR SELECT TO public USING (true);
CREATE POLICY "Allow public read access to dungeon_themes"
  ON dungeon_themes FOR SELECT TO public USING (true);

-- Service role management
CREATE POLICY "Service role can manage tilesets"
  ON tilesets FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Service role can manage tile_themes"
  ON tile_themes FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Service role can manage dungeon_themes"
  ON dungeon_themes FOR ALL TO service_role USING (true) WITH CHECK (true);

-- updated_at triggers (reuses function from app_metadata migration)
CREATE TRIGGER update_tile_themes_updated_at
  BEFORE UPDATE ON tile_themes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_dungeon_themes_updated_at
  BEFORE UPDATE ON dungeon_themes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
