/**
 * Dungeon Theme CRUD operations
 */
import { getDatabase } from '../../db';
import type { DungeonTheme } from '../types';
import { initializeTilethemeTables } from './init';

/**
 * Save a new dungeon theme
 */
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

/**
 * Get all dungeon themes
 */
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

/**
 * Get a single dungeon theme by ID
 */
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

/**
 * Update a dungeon theme
 */
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

/**
 * Delete a dungeon theme by ID
 */
export function deleteDungeonTheme(id: number): void {
  const db = getDatabase();
  initializeTilethemeTables();

  db.prepare('DELETE FROM dungeon_themes WHERE id = ?').run(id);
}
