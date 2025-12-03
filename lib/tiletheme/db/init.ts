/**
 * Tiletheme database initialization
 *
 * Creates all required tables for the tile theme system
 */
import { getDatabase } from '../../db';

let initialized = false;

/**
 * Initialize tiletheme tables (idempotent)
 */
export function initializeTilethemeTables(): void {
  if (initialized) return;

  const db = getDatabase();

  // Create tilesets table
  db.exec(`
    CREATE TABLE IF NOT EXISTS tilesets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      path TEXT NOT NULL,
      width_tiles INTEGER NOT NULL,
      height_tiles INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Create tile_themes table
  db.exec(`
    CREATE TABLE IF NOT EXISTS tile_themes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      floor_config TEXT NOT NULL,
      wall_config TEXT NOT NULL,
      door_config TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Create dungeon_themes table
  db.exec(`
    CREATE TABLE IF NOT EXISTS dungeon_themes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      dark_theme_id INTEGER NOT NULL,
      light_theme_id INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (dark_theme_id) REFERENCES tile_themes(id),
      FOREIGN KEY (light_theme_id) REFERENCES tile_themes(id)
    )
  `);

  // Create indices
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_tile_themes_name ON tile_themes(name)
  `);
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_dungeon_themes_name ON dungeon_themes(name)
  `);

  initialized = true;
}
