/**
 * Tile Theme CRUD operations
 *
 * Uses database adapter for backend-agnostic operations.
 */

import { getAdapter } from '../../db/adapters';
import type { TileTheme } from '../types';

/**
 * Save a new tile theme
 */
export async function saveTileTheme(
  theme: Omit<TileTheme, 'id' | 'created_at' | 'updated_at'>
): Promise<number> {
  const adapter = await getAdapter();
  return adapter.saveTileTheme(theme);
}

/**
 * Get all tile themes
 */
export async function getTileThemes(): Promise<TileTheme[]> {
  const adapter = await getAdapter();
  return adapter.getTileThemes();
}

/**
 * Get a single tile theme by ID
 */
export async function getTileTheme(id: number): Promise<TileTheme | null> {
  const adapter = await getAdapter();
  return adapter.getTileTheme(id);
}

/**
 * Update a tile theme
 */
export async function updateTileTheme(id: number, updates: Partial<TileTheme>): Promise<void> {
  const adapter = await getAdapter();
  return adapter.updateTileTheme(id, updates);
}

/**
 * Delete a tile theme by ID
 */
export async function deleteTileTheme(id: number): Promise<void> {
  const adapter = await getAdapter();
  return adapter.deleteTileTheme(id);
}
