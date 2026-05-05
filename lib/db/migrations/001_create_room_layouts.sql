-- Create room_layouts table for pre-generated room layouts
-- Used by the Room Layout System to store handcrafted room designs

CREATE TABLE IF NOT EXISTS room_layouts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  width INTEGER NOT NULL CHECK (width >= 5 AND width <= 15),
  height INTEGER NOT NULL CHECK (height >= 5 AND height <= 15),
  tile_grid TEXT NOT NULL,           -- JSON: number[][] (TileType values)
  door_positions TEXT NOT NULL,      -- JSON: { north: bool, south: bool, east: bool, west: bool }
  room_type TEXT DEFAULT 'any' CHECK (room_type IN ('empty', 'treasure', 'combat', 'shop', 'any')),
  difficulty INTEGER DEFAULT 5 CHECK (difficulty >= 1 AND difficulty <= 10),
  tags TEXT DEFAULT '[]',            -- JSON: string[]
  created_by INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (created_by) REFERENCES users(id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_room_layouts_type ON room_layouts(room_type);
CREATE INDEX IF NOT EXISTS idx_room_layouts_size ON room_layouts(width, height);
CREATE INDEX IF NOT EXISTS idx_room_layouts_difficulty ON room_layouts(difficulty);
