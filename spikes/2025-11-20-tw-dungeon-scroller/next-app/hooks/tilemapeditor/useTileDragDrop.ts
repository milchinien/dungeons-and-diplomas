import { useState, useCallback } from 'react';
import type { DraggedTile, SelectedSlot, SlotCategory } from '@/lib/tiletheme/types';

export interface TileDragDropState {
  selectedSlot: SelectedSlot | null;
  draggedTile: DraggedTile | null;
}

export interface TileDragDropActions {
  selectSlot: (category: SlotCategory, type: string) => void;
  clearSlotSelection: () => void;
  startDrag: (tile: DraggedTile) => void;
  endDrag: () => void;
}

export function useTileDragDrop(): [TileDragDropState, TileDragDropActions] {
  const [selectedSlot, setSelectedSlot] = useState<SelectedSlot | null>(null);
  const [draggedTile, setDraggedTile] = useState<DraggedTile | null>(null);

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

  const state: TileDragDropState = {
    selectedSlot,
    draggedTile
  };

  const actions: TileDragDropActions = {
    selectSlot,
    clearSlotSelection,
    startDrag,
    endDrag
  };

  return [state, actions];
}
