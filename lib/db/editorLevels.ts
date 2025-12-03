/**
 * Editor levels database operations
 */
import { getDatabase } from './connection';

export interface EditorLevel {
  id?: number;
  name: string;
  structure_seed: number;
  decoration_seed: number;
  spawn_seed: number;
  width: number;
  height: number;
  algorithm: number;
  created_by?: number;
  created_at?: string;
  updated_at?: string;
  notes?: string;
}

/**
 * Save a new editor level
 */
export function saveEditorLevel(level: EditorLevel): number {
  const db = getDatabase();
  const stmt = db.prepare(`
    INSERT INTO editor_levels (name, structure_seed, decoration_seed, spawn_seed, width, height, algorithm, created_by, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const result = stmt.run(
    level.name,
    level.structure_seed,
    level.decoration_seed,
    level.spawn_seed,
    level.width,
    level.height,
    level.algorithm,
    level.created_by || null,
    level.notes || null
  );

  return result.lastInsertRowid as number;
}

/**
 * Get all editor levels (optionally filtered by user)
 */
export function getEditorLevels(userId?: number): EditorLevel[] {
  const db = getDatabase();

  let query = 'SELECT * FROM editor_levels';
  const params: any[] = [];

  if (userId) {
    query += ' WHERE created_by = ?';
    params.push(userId);
  }

  query += ' ORDER BY updated_at DESC';

  const stmt = db.prepare(query);
  return stmt.all(...params) as EditorLevel[];
}

/**
 * Get a single editor level by ID
 */
export function getEditorLevel(id: number): EditorLevel | null {
  const db = getDatabase();
  const stmt = db.prepare('SELECT * FROM editor_levels WHERE id = ?');
  const result = stmt.get(id);
  return result ? (result as EditorLevel) : null;
}

/**
 * Update an existing editor level
 */
export function updateEditorLevel(id: number, updates: Partial<EditorLevel>): void {
  const db = getDatabase();

  const fields: string[] = [];
  const values: any[] = [];

  if (updates.name !== undefined) {
    fields.push('name = ?');
    values.push(updates.name);
  }
  if (updates.structure_seed !== undefined) {
    fields.push('structure_seed = ?');
    values.push(updates.structure_seed);
  }
  if (updates.decoration_seed !== undefined) {
    fields.push('decoration_seed = ?');
    values.push(updates.decoration_seed);
  }
  if (updates.spawn_seed !== undefined) {
    fields.push('spawn_seed = ?');
    values.push(updates.spawn_seed);
  }
  if (updates.width !== undefined) {
    fields.push('width = ?');
    values.push(updates.width);
  }
  if (updates.height !== undefined) {
    fields.push('height = ?');
    values.push(updates.height);
  }
  if (updates.algorithm !== undefined) {
    fields.push('algorithm = ?');
    values.push(updates.algorithm);
  }
  if (updates.notes !== undefined) {
    fields.push('notes = ?');
    values.push(updates.notes);
  }

  fields.push('updated_at = CURRENT_TIMESTAMP');
  values.push(id);

  const stmt = db.prepare(`
    UPDATE editor_levels
    SET ${fields.join(', ')}
    WHERE id = ?
  `);

  stmt.run(...values);
}

/**
 * Delete an editor level
 */
export function deleteEditorLevel(id: number): void {
  const db = getDatabase();
  const stmt = db.prepare('DELETE FROM editor_levels WHERE id = ?');
  stmt.run(id);
}
