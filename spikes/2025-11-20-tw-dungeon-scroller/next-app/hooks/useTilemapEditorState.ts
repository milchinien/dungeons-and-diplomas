import { useState, useCallback, useEffect } from 'react';
import type {
  TileTheme,
  TileVariant,
  ImportedTileset,
  DraggedTile,
  SelectedSlot,
  SlotCategory,
  WallType,
  DoorType
} from '@/lib/tiletheme/types';
import { createEmptyTheme, validateTileTheme, type ValidationResult } from '@/lib/tiletheme/ThemeValidator';

export interface TilemapEditorState {
  // Current theme being edited
  theme: TileTheme | null;
  isDirty: boolean;

  // Available tilesets
  tilesets: ImportedTileset[];
  selectedTilesetId: number | null;

  // Selection state
  selectedSlot: SelectedSlot | null;
  draggedTile: DraggedTile | null;

  // Validation
  validationResult: ValidationResult | null;

  // UI State
  isLoading: boolean;
  error: string | null;
}

export interface TilemapEditorActions {
  // Theme management
  newTheme: () => void;
  loadTheme: (id: number) => Promise<void>;
  saveTheme: () => Promise<void>;
  setThemeName: (name: string) => void;

  // Tileset management
  loadTilesets: () => Promise<void>;
  selectTileset: (id: number) => void;

  // Slot selection
  selectSlot: (category: SlotCategory, type: string) => void;
  clearSlotSelection: () => void;

  // Drag & Drop
  startDrag: (tile: DraggedTile) => void;
  endDrag: () => void;

  // Tile variant management
  addVariant: (category: SlotCategory, type: string, variant: TileVariant) => void;
  removeVariant: (category: SlotCategory, type: string, index: number) => void;
  updateVariantWeight: (category: SlotCategory, type: string, index: number, weight: number) => void;

  // Validation
  validate: () => void;
}

export function useTilemapEditorState(): [TilemapEditorState, TilemapEditorActions] {
  const [theme, setTheme] = useState<TileTheme | null>(null);
  const [isDirty, setIsDirty] = useState(false);
  const [tilesets, setTilesets] = useState<ImportedTileset[]>([]);
  const [selectedTilesetId, setSelectedTilesetId] = useState<number | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<SelectedSlot | null>(null);
  const [draggedTile, setDraggedTile] = useState<DraggedTile | null>(null);
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load tilesets on mount
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

  // Create a new theme
  const newTheme = useCallback(() => {
    const emptyTheme = createEmptyTheme('Neues Theme');
    setTheme({
      ...emptyTheme,
      id: 0, // Will be assigned on save
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    } as TileTheme);
    setIsDirty(true);
    setValidationResult(null);
  }, []);

  // Load an existing theme
  const loadTheme = useCallback(async (id: number) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/tilemapeditor/themes/${id}`);
      if (!response.ok) throw new Error('Failed to load theme');
      const data = await response.json();
      setTheme(data);
      setIsDirty(false);
      setValidationResult(validateTileTheme(data));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load theme');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Save the current theme
  const saveTheme = useCallback(async () => {
    if (!theme) return;

    setIsLoading(true);
    setError(null);
    try {
      const method = theme.id ? 'PUT' : 'POST';
      const url = theme.id
        ? `/api/tilemapeditor/themes/${theme.id}`
        : '/api/tilemapeditor/themes';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: theme.name,
          floor: theme.floor,
          wall: theme.wall,
          door: theme.door
        })
      });

      if (!response.ok) throw new Error('Failed to save theme');

      const savedTheme = await response.json();
      setTheme(savedTheme);
      setIsDirty(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save theme');
    } finally {
      setIsLoading(false);
    }
  }, [theme]);

  // Set theme name
  const setThemeName = useCallback((name: string) => {
    setTheme(prev => prev ? { ...prev, name } : null);
    setIsDirty(true);
  }, []);

  // Select tileset
  const selectTileset = useCallback((id: number) => {
    setSelectedTilesetId(id);
  }, []);

  // Select slot
  const selectSlot = useCallback((category: SlotCategory, type: string) => {
    setSelectedSlot({ category, type });
  }, []);

  // Clear slot selection
  const clearSlotSelection = useCallback(() => {
    setSelectedSlot(null);
  }, []);

  // Start drag
  const startDrag = useCallback((tile: DraggedTile) => {
    setDraggedTile(tile);
  }, []);

  // End drag
  const endDrag = useCallback(() => {
    setDraggedTile(null);
  }, []);

  // Add variant to a slot
  const addVariant = useCallback((category: SlotCategory, type: string, variant: TileVariant) => {
    setTheme(prev => {
      if (!prev) return null;

      const updated = { ...prev };

      if (category === 'floor') {
        updated.floor = {
          ...updated.floor,
          default: [...(updated.floor.default || []), variant]
        };
      } else if (category === 'wall') {
        updated.wall = {
          ...updated.wall,
          [type as WallType]: [...(updated.wall[type as WallType] || []), variant]
        };
      } else if (category === 'door') {
        updated.door = {
          ...updated.door,
          [type as DoorType]: [...(updated.door[type as DoorType] || []), variant]
        };
      }

      return updated;
    });
    setIsDirty(true);
  }, []);

  // Remove variant from a slot
  const removeVariant = useCallback((category: SlotCategory, type: string, index: number) => {
    setTheme(prev => {
      if (!prev) return null;

      const updated = { ...prev };

      if (category === 'floor') {
        const variants = [...(updated.floor.default || [])];
        variants.splice(index, 1);
        updated.floor = { ...updated.floor, default: variants };
      } else if (category === 'wall') {
        const variants = [...(updated.wall[type as WallType] || [])];
        variants.splice(index, 1);
        updated.wall = { ...updated.wall, [type as WallType]: variants };
      } else if (category === 'door') {
        const variants = [...(updated.door[type as DoorType] || [])];
        variants.splice(index, 1);
        updated.door = { ...updated.door, [type as DoorType]: variants };
      }

      return updated;
    });
    setIsDirty(true);
  }, []);

  // Update variant weight
  const updateVariantWeight = useCallback((category: SlotCategory, type: string, index: number, weight: number) => {
    setTheme(prev => {
      if (!prev) return null;

      const updated = { ...prev };

      if (category === 'floor') {
        const variants = [...(updated.floor.default || [])];
        if (variants[index]) {
          variants[index] = { ...variants[index], weight };
        }
        updated.floor = { ...updated.floor, default: variants };
      } else if (category === 'wall') {
        const variants = [...(updated.wall[type as WallType] || [])];
        if (variants[index]) {
          variants[index] = { ...variants[index], weight };
        }
        updated.wall = { ...updated.wall, [type as WallType]: variants };
      } else if (category === 'door') {
        const variants = [...(updated.door[type as DoorType] || [])];
        if (variants[index]) {
          variants[index] = { ...variants[index], weight };
        }
        updated.door = { ...updated.door, [type as DoorType]: variants };
      }

      return updated;
    });
    setIsDirty(true);
  }, []);

  // Validate the current theme
  const validate = useCallback(() => {
    if (theme) {
      setValidationResult(validateTileTheme(theme));
    }
  }, [theme]);

  // Auto-validate when theme changes
  useEffect(() => {
    if (theme) {
      setValidationResult(validateTileTheme(theme));
    }
  }, [theme]);

  const state: TilemapEditorState = {
    theme,
    isDirty,
    tilesets,
    selectedTilesetId,
    selectedSlot,
    draggedTile,
    validationResult,
    isLoading,
    error
  };

  const actions: TilemapEditorActions = {
    newTheme,
    loadTheme,
    saveTheme,
    setThemeName,
    loadTilesets,
    selectTileset,
    selectSlot,
    clearSlotSelection,
    startDrag,
    endDrag,
    addVariant,
    removeVariant,
    updateVariantWeight,
    validate
  };

  return [state, actions];
}
