/**
 * Tileset CRUD operations
 *
 * Uses database adapter for backend-agnostic operations.
 */

import { getAdapter } from '../../db/adapters';
import type { ImportedTileset } from '../types';

/**
 * Save a new tileset
 */
export async function saveTileset(
  tileset: Omit<ImportedTileset, 'id' | 'created_at'>
): Promise<number> {
  const adapter = await getAdapter();
  return adapter.saveTileset(tileset);
}

/**
 * Get all tilesets
 */
export async function getTilesets(): Promise<ImportedTileset[]> {
  const adapter = await getAdapter();
  return adapter.getTilesets();
}

/**
 * Get a single tileset by ID
 */
export async function getTileset(id: number): Promise<ImportedTileset | null> {
  const adapter = await getAdapter();
  return adapter.getTileset(id);
}

/**
 * Delete a tileset by ID
 */
export async function deleteTileset(id: number): Promise<void> {
  const adapter = await getAdapter();
  return adapter.deleteTileset(id);
}
