import { useState, useCallback } from 'react';
import type { ImportedTileset } from '@/lib/tiletheme/types';

export interface TilesetSelectionState {
  tilesets: ImportedTileset[];
  selectedTilesetId: number | null;
  error: string | null;
}

export interface TilesetSelectionActions {
  loadTilesets: () => Promise<void>;
  selectTileset: (id: number) => void;
}

export function useTilesetSelection(): [TilesetSelectionState, TilesetSelectionActions] {
  const [tilesets, setTilesets] = useState<ImportedTileset[]>([]);
  const [selectedTilesetId, setSelectedTilesetId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Load tilesets
  const loadTilesets = useCallback(async () => {
    try {
      const response = await fetch('/api/tilemapeditor/tilesets');
      if (!response.ok) throw new Error('Failed to load tilesets');
      const data = await response.json();
      setTilesets(data);
      if (data.length > 0 && !selectedTilesetId) {
        setSelectedTilesetId(data[0].id);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load tilesets');
    }
  }, [selectedTilesetId]);

  // Select tileset
  const selectTileset = useCallback((id: number) => {
    setSelectedTilesetId(id);
  }, []);

  const state: TilesetSelectionState = {
    tilesets,
    selectedTilesetId,
    error
  };

  const actions: TilesetSelectionActions = {
    loadTilesets,
    selectTileset
  };

  return [state, actions];
}
