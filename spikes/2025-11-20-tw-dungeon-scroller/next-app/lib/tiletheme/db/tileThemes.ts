/**
 * Tile Theme CRUD operations
 */
import { getDatabase } from '../../db';
import type { TileTheme } from '../types';
import { initializeTilethemeTables } from './init';

/**
 * Save a new tile theme
 */
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

/**
 * Get all tile themes
 */
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

/**
 * Get a single tile theme by ID
 */
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

/**
 * Update a tile theme
 */
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

/**
 * Delete a tile theme by ID
 */
export function deleteTileTheme(id: number): void {
  const db = getDatabase();
  initializeTilethemeTables();

  db.prepare('DELETE FROM tile_themes WHERE id = ?').run(id);
}
