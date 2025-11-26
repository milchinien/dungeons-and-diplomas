/**
 * Tileset CRUD operations
 */
import { getDatabase } from '../../db';
import type { ImportedTileset } from '../types';
import { initializeTilethemeTables } from './init';

/**
 * Save a new tileset
 */
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

/**
 * Get all tilesets
 */
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

/**
 * Get a single tileset by ID
 */
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

/**
 * Delete a tileset by ID
 */
export function deleteTileset(id: number): void {
  const db = getDatabase();
  initializeTilethemeTables();

  db.prepare('DELETE FROM tilesets WHERE id = ?').run(id);
}
