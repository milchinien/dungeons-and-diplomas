'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useTilemapEditorState } from '@/hooks/useTilemapEditorState';
import { TilesetViewer } from './TilesetViewer';
import { TileSlotGrid } from './TileSlotGrid';
import { VariantEditor } from './VariantEditor';
import { ThemePreview } from './ThemePreview';
import { ThemeToolbar } from './ThemeToolbar';
import type { TileTheme } from '@/lib/tiletheme/types';

// Panel size constraints (in pixels)
const MIN_PANEL_WIDTH = 200;
const MAX_PANEL_WIDTH = 600;
const DEFAULT_PANEL_WIDTH = 320;

export function TilemapEditorCanvas() {
  const [state, actions] = useTilemapEditorState();
  const [themes, setThemes] = useState<TileTheme[]>([]);

  // Resizable panel widths
  const [leftWidth, setLeftWidth] = useState(DEFAULT_PANEL_WIDTH);
  const [rightWidth, setRightWidth] = useState(DEFAULT_PANEL_WIDTH);

  // Drag state
  const [isDraggingLeft, setIsDraggingLeft] = useState(false);
  const [isDraggingRight, setIsDraggingRight] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Load tilesets and themes on mount
  useEffect(() => {
    const init = async () => {
      // Seed default tilesets first (idempotent)
      await fetch('/api/tilemapeditor/seed');
      // Then load tilesets and themes
      await actions.loadTilesets();
      await loadThemes();
    };
    init();
  }, []);

  const loadThemes = async () => {
    try {
      const response = await fetch('/api/tilemapeditor/themes');
      if (response.ok) {
        const data = await response.json();
        setThemes(data);
      }
    } catch (err) {
      console.error('Failed to load themes:', err);
    }
  };

  const handleNewTheme = () => {
    actions.newTheme();
  };

  const handleLoadTheme = async (id: number) => {
    await actions.loadTheme(id);
  };

  const handleSaveTheme = async () => {
    await actions.saveTheme();
    await loadThemes(); // Refresh theme list
  };

  // Handle mouse move for resizing
  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!containerRef.current) return;

    const containerRect = containerRef.current.getBoundingClientRect();

    if (isDraggingLeft) {
      const newWidth = Math.max(MIN_PANEL_WIDTH, Math.min(MAX_PANEL_WIDTH, e.clientX - containerRect.left));
      setLeftWidth(newWidth);
    }

    if (isDraggingRight) {
      const newWidth = Math.max(MIN_PANEL_WIDTH, Math.min(MAX_PANEL_WIDTH, containerRect.right - e.clientX));
      setRightWidth(newWidth);
    }
  }, [isDraggingLeft, isDraggingRight]);

  // Handle mouse up to stop resizing
  const handleMouseUp = useCallback(() => {
    setIsDraggingLeft(false);
    setIsDraggingRight(false);
  }, []);

  // Add/remove global event listeners for resizing
  useEffect(() => {
    if (isDraggingLeft || isDraggingRight) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';

      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
      };
    }
  }, [isDraggingLeft, isDraggingRight, handleMouseMove, handleMouseUp]);

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <ThemeToolbar
        themeName={state.theme?.name || ''}
        onThemeNameChange={actions.setThemeName}
        onNew={handleNewTheme}
        onSave={handleSaveTheme}
        onLoad={handleLoadTheme}
        themes={themes}
        isDirty={state.isDirty}
        validationResult={state.validationResult}
        isLoading={state.isLoading}
      />

      {/* Error display */}
      {state.error && (
        <div className="bg-red-500 text-white px-4 py-2 text-sm">
          {state.error}
        </div>
      )}

      {/* Main content */}
      <div ref={containerRef} className="flex flex-1 overflow-hidden">
        {/* Left: Tileset Viewer */}
        <div
          className="border-r border-gray-700 flex flex-col flex-shrink-0"
          style={{ width: leftWidth }}
        >
          <TilesetViewer
            tilesets={state.tilesets}
            selectedTilesetId={state.selectedTilesetId}
            onSelectTileset={actions.selectTileset}
            onStartDrag={actions.startDrag}
          />
        </div>

        {/* Left Resize Handle */}
        <div
          className="w-1 bg-gray-700 hover:bg-blue-500 cursor-col-resize flex-shrink-0 transition-colors"
          onMouseDown={() => setIsDraggingLeft(true)}
          style={{ backgroundColor: isDraggingLeft ? '#3b82f6' : undefined }}
        />

        {/* Center: Tile Slot Grid */}
        <div className="flex-1 flex flex-col overflow-hidden min-w-0">
          <div className="flex-1 overflow-auto p-4">
            <TileSlotGrid
              theme={state.theme}
              selectedSlot={state.selectedSlot}
              onSelectSlot={actions.selectSlot}
              draggedTile={state.draggedTile}
              onDropTile={actions.addVariant}
              onEndDrag={actions.endDrag}
              tilesets={state.tilesets}
            />
          </div>

          {/* Bottom: Variant Editor */}
          {state.selectedSlot && state.theme && (
            <div className="h-48 border-t border-gray-700">
              <VariantEditor
                theme={state.theme}
                selectedSlot={state.selectedSlot}
                tilesets={state.tilesets}
                onRemoveVariant={actions.removeVariant}
                onUpdateWeight={actions.updateVariantWeight}
                draggedTile={state.draggedTile}
                onDropTile={actions.addVariant}
                onEndDrag={actions.endDrag}
              />
            </div>
          )}
        </div>

        {/* Right Resize Handle */}
        <div
          className="w-1 bg-gray-700 hover:bg-blue-500 cursor-col-resize flex-shrink-0 transition-colors"
          onMouseDown={() => setIsDraggingRight(true)}
          style={{ backgroundColor: isDraggingRight ? '#3b82f6' : undefined }}
        />

        {/* Right: Theme Preview */}
        <div
          className="border-l border-gray-700 flex-shrink-0"
          style={{ width: rightWidth }}
        >
          <ThemePreview
            theme={state.theme}
            tilesets={state.tilesets}
          />
        </div>
      </div>
    </div>
  );
}
