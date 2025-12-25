/**
 * Dungeon Theme CRUD operations
 *
 * Uses database adapter for backend-agnostic operations.
 */

import { getAdapter } from '../../db/adapters';
import type { DungeonTheme } from '../types';

/**
 * Save a new dungeon theme
 */
export async function saveDungeonTheme(
  theme: Omit<DungeonTheme, 'id' | 'created_at' | 'updated_at'>
): Promise<number> {
  const adapter = await getAdapter();
  return adapter.saveDungeonTheme(theme);
}

/**
 * Get all dungeon themes
 */
export async function getDungeonThemes(): Promise<DungeonTheme[]> {
  const adapter = await getAdapter();
  return adapter.getDungeonThemes();
}

/**
 * Get a single dungeon theme by ID
 */
export async function getDungeonTheme(id: number): Promise<DungeonTheme | null> {
  const adapter = await getAdapter();
  return adapter.getDungeonTheme(id);
}

/**
 * Update a dungeon theme
 */
export async function updateDungeonTheme(id: number, updates: Partial<DungeonTheme>): Promise<void> {
  const adapter = await getAdapter();
  return adapter.updateDungeonTheme(id, updates);
}

/**
 * Delete a dungeon theme by ID
 */
export async function deleteDungeonTheme(id: number): Promise<void> {
  const adapter = await getAdapter();
  return adapter.deleteDungeonTheme(id);
}
