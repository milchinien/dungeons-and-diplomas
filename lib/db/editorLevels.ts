/**
 * Editor levels database operations
 *
 * Uses database adapter for backend-agnostic operations.
 */

import { getAdapter } from './adapters';

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
export async function saveEditorLevel(level: EditorLevel): Promise<number> {
  const adapter = await getAdapter();
  return adapter.saveEditorLevel(level);
}

/**
 * Get all editor levels (optionally filtered by user)
 */
export async function getEditorLevels(userId?: number): Promise<EditorLevel[]> {
  const adapter = await getAdapter();
  return adapter.getEditorLevels(userId);
}

/**
 * Get a single editor level by ID
 */
export async function getEditorLevel(id: number): Promise<EditorLevel | null> {
  const adapter = await getAdapter();
  return adapter.getEditorLevel(id);
}

/**
 * Update an existing editor level
 */
export async function updateEditorLevel(id: number, updates: Partial<EditorLevel>): Promise<void> {
  const adapter = await getAdapter();
  return adapter.updateEditorLevel(id, updates);
}

/**
 * Delete an editor level
 */
export async function deleteEditorLevel(id: number): Promise<void> {
  const adapter = await getAdapter();
  return adapter.deleteEditorLevel(id);
}
