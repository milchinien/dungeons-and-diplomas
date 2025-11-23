import { getDatabase } from '../db';
import type { ImportedTileset, TileTheme, DungeonTheme, TileVariant, WallType, DoorType } from './types';

// ============================================
// Initialize tiletheme tables
// ============================================

export function initializeTilethemeTables(): void {
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
}

// ============================================
// TILESET CRUD
// ============================================

export function saveTileset(tileset: Omit<ImportedTileset, 'id' | 'created_at'>): number {
  const db = getDatabase();
  initializeTilethemeTables();

  const stmt = db.prepare(`
    INSERT INTO tilesets (name, path, width_tiles, height_tiles)
    VALUES (?, ?, ?, ?)
  `);

  const result = stmt.run(
    tileset.name,
    tileset.path,
    tileset.widthTiles,
    tileset.heightTiles
  );

  return result.lastInsertRowid as number;
}

export function getTilesets(): ImportedTileset[] {
  const db = getDatabase();
  initializeTilethemeTables();

  const rows = db.prepare('SELECT * FROM tilesets ORDER BY created_at DESC').all() as any[];

  return rows.map(row => ({
    id: row.id,
    name: row.name,
    path: row.path,
    widthTiles: row.width_tiles,
    heightTiles: row.height_tiles,
    created_at: row.created_at
  }));
}

export function getTileset(id: number): ImportedTileset | null {
  const db = getDatabase();
  initializeTilethemeTables();

  const row = db.prepare('SELECT * FROM tilesets WHERE id = ?').get(id) as any;

  if (!row) return null;

  return {
    id: row.id,
    name: row.name,
    path: row.path,
    widthTiles: row.width_tiles,
    heightTiles: row.height_tiles,
    created_at: row.created_at
  };
}

export function deleteTileset(id: number): void {
  const db = getDatabase();
  initializeTilethemeTables();

  db.prepare('DELETE FROM tilesets WHERE id = ?').run(id);
}

// ============================================
// TILE THEME CRUD
// ============================================

export function saveTileTheme(theme: Omit<TileTheme, 'id' | 'created_at' | 'updated_at'>): number {
  const db = getDatabase();
  initializeTilethemeTables();

  const stmt = db.prepare(`
    INSERT INTO tile_themes (name, floor_config, wall_config, door_config)
    VALUES (?, ?, ?, ?)
  `);

  const result = stmt.run(
    theme.name,
    JSON.stringify(theme.floor),
    JSON.stringify(theme.wall),
    JSON.stringify(theme.door)
  );

  return result.lastInsertRowid as number;
}

export function getTileThemes(): TileTheme[] {
  const db = getDatabase();
  initializeTilethemeTables();

  const rows = db.prepare('SELECT * FROM tile_themes ORDER BY updated_at DESC').all() as any[];

  return rows.map(row => ({
    id: row.id,
    name: row.name,
    floor: JSON.parse(row.floor_config),
    wall: JSON.parse(row.wall_config),
    door: JSON.parse(row.door_config),
    created_at: row.created_at,
    updated_at: row.updated_at
  }));
}

export function getTileTheme(id: number): TileTheme | null {
  const db = getDatabase();
  initializeTilethemeTables();

  const row = db.prepare('SELECT * FROM tile_themes WHERE id = ?').get(id) as any;

  if (!row) return null;

  return {
    id: row.id,
    name: row.name,
    floor: JSON.parse(row.floor_config),
    wall: JSON.parse(row.wall_config),
    door: JSON.parse(row.door_config),
    created_at: row.created_at,
    updated_at: row.updated_at
  };
}

export function updateTileTheme(id: number, updates: Partial<TileTheme>): void {
  const db = getDatabase();
  initializeTilethemeTables();

  const fields: string[] = [];
  const values: any[] = [];

  if (updates.name !== undefined) {
    fields.push('name = ?');
    values.push(updates.name);
  }
  if (updates.floor !== undefined) {
    fields.push('floor_config = ?');
    values.push(JSON.stringify(updates.floor));
  }
  if (updates.wall !== undefined) {
    fields.push('wall_config = ?');
    values.push(JSON.stringify(updates.wall));
  }
  if (updates.door !== undefined) {
    fields.push('door_config = ?');
    values.push(JSON.stringify(updates.door));
  }

  if (fields.length === 0) return;

  fields.push('updated_at = CURRENT_TIMESTAMP');
  values.push(id);

  const stmt = db.prepare(`
    UPDATE tile_themes
    SET ${fields.join(', ')}
    WHERE id = ?
  `);

  stmt.run(...values);
}

export function deleteTileTheme(id: number): void {
  const db = getDatabase();
  initializeTilethemeTables();

  db.prepare('DELETE FROM tile_themes WHERE id = ?').run(id);
}

// ============================================
// DUNGEON THEME CRUD
// ============================================

export function saveDungeonTheme(theme: Omit<DungeonTheme, 'id' | 'created_at' | 'updated_at'>): number {
  const db = getDatabase();
  initializeTilethemeTables();

  const stmt = db.prepare(`
    INSERT INTO dungeon_themes (name, dark_theme_id, light_theme_id)
    VALUES (?, ?, ?)
  `);

  const result = stmt.run(
    theme.name,
    theme.darkThemeId,
    theme.lightThemeId
  );

  return result.lastInsertRowid as number;
}

export function getDungeonThemes(): DungeonTheme[] {
  const db = getDatabase();
  initializeTilethemeTables();

  const rows = db.prepare('SELECT * FROM dungeon_themes ORDER BY updated_at DESC').all() as any[];

  return rows.map(row => ({
    id: row.id,
    name: row.name,
    darkThemeId: row.dark_theme_id,
    lightThemeId: row.light_theme_id,
    created_at: row.created_at,
    updated_at: row.updated_at
  }));
}

export function getDungeonTheme(id: number): DungeonTheme | null {
  const db = getDatabase();
  initializeTilethemeTables();

  const row = db.prepare('SELECT * FROM dungeon_themes WHERE id = ?').get(id) as any;

  if (!row) return null;

  return {
    id: row.id,
    name: row.name,
    darkThemeId: row.dark_theme_id,
    lightThemeId: row.light_theme_id,
    created_at: row.created_at,
    updated_at: row.updated_at
  };
}

export function updateDungeonTheme(id: number, updates: Partial<DungeonTheme>): void {
  const db = getDatabase();
  initializeTilethemeTables();

  const fields: string[] = [];
  const values: any[] = [];

  if (updates.name !== undefined) {
    fields.push('name = ?');
    values.push(updates.name);
  }
  if (updates.darkThemeId !== undefined) {
    fields.push('dark_theme_id = ?');
    values.push(updates.darkThemeId);
  }
  if (updates.lightThemeId !== undefined) {
    fields.push('light_theme_id = ?');
    values.push(updates.lightThemeId);
  }

  if (fields.length === 0) return;

  fields.push('updated_at = CURRENT_TIMESTAMP');
  values.push(id);

  const stmt = db.prepare(`
    UPDATE dungeon_themes
    SET ${fields.join(', ')}
    WHERE id = ?
  `);

  stmt.run(...values);
}

export function deleteDungeonTheme(id: number): void {
  const db = getDatabase();
  initializeTilethemeTables();

  db.prepare('DELETE FROM dungeon_themes WHERE id = ?').run(id);
}
