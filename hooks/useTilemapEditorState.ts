import type {
  TileTheme,
  TileVariant,
  ImportedTileset,
  DraggedTile,
  SelectedSlot,
  SlotCategory
} from '@/lib/tiletheme/types';
import type { ValidationResult } from '@/lib/tiletheme/ThemeValidator';
import {
  useTileThemeState,
  useTilesetSelection,
  useTileDragDrop
} from './tilemapeditor';

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

/**
 * Main hook for Tilemap Editor state management.
 * Orchestrates sub-hooks for theme, tileset selection, and drag-drop.
 */
export function useTilemapEditorState(): [TilemapEditorState, TilemapEditorActions] {
  // Theme state management
  const [themeState, themeActions] = useTileThemeState();

  // Tileset selection
  const [tilesetState, tilesetActions] = useTilesetSelection();

  // Drag & Drop
  const [dragDropState, dragDropActions] = useTileDragDrop();

  // Combine errors from sub-hooks
  const combinedError = themeState.error || tilesetState.error;

  const state: TilemapEditorState = {
    theme: themeState.theme,
    isDirty: themeState.isDirty,
    tilesets: tilesetState.tilesets,
    selectedTilesetId: tilesetState.selectedTilesetId,
    selectedSlot: dragDropState.selectedSlot,
    draggedTile: dragDropState.draggedTile,
    validationResult: themeState.validationResult,
    isLoading: themeState.isLoading,
    error: combinedError
  };

  const actions: TilemapEditorActions = {
    // Theme actions
    newTheme: themeActions.newTheme,
    loadTheme: themeActions.loadTheme,
    saveTheme: themeActions.saveTheme,
    setThemeName: themeActions.setThemeName,
    addVariant: themeActions.addVariant,
    removeVariant: themeActions.removeVariant,
    updateVariantWeight: themeActions.updateVariantWeight,
    validate: themeActions.validate,

    // Tileset actions
    loadTilesets: tilesetActions.loadTilesets,
    selectTileset: tilesetActions.selectTileset,

    // Drag-Drop actions
    selectSlot: dragDropActions.selectSlot,
    clearSlotSelection: dragDropActions.clearSlotSelection,
    startDrag: dragDropActions.startDrag,
    endDrag: dragDropActions.endDrag
  };

  return [state, actions];
}
