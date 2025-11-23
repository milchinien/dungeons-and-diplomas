'use client';

import { useState, useRef, useEffect } from 'react';
import type { TileTheme, TileVariant, ImportedTileset, DraggedTile, SelectedSlot, SlotCategory, WallType, DoorType } from '@/lib/tiletheme/types';
import { TILE_SOURCE_SIZE } from '@/lib/constants';
import { getSlotLabel } from '@/lib/tiletheme/ThemeValidator';
import { getContext2D } from '@/lib/rendering/canvasUtils';

interface VariantEditorProps {
  theme: TileTheme;
  selectedSlot: SelectedSlot;
  tilesets: ImportedTileset[];
  onRemoveVariant: (category: SlotCategory, type: string, index: number) => void;
  onUpdateWeight: (category: SlotCategory, type: string, index: number, weight: number) => void;
  draggedTile: DraggedTile | null;
  onDropTile: (category: SlotCategory, type: string, variant: TileVariant) => void;
  onEndDrag: () => void;
}

const VARIANT_SIZE = 48;

export function VariantEditor({
  theme,
  selectedSlot,
  tilesets,
  onRemoveVariant,
  onUpdateWeight,
  draggedTile,
  onDropTile,
  onEndDrag
}: VariantEditorProps) {
  const [isDragOver, setIsDragOver] = useState(false);

  const getVariants = (): TileVariant[] => {
    if (selectedSlot.category === 'floor') {
      return theme.floor.default || [];
    } else if (selectedSlot.category === 'wall') {
      return theme.wall[selectedSlot.type as WallType] || [];
    } else if (selectedSlot.category === 'door') {
      return theme.door[selectedSlot.type as DoorType] || [];
    }
    return [];
  };

  const variants = getVariants();
  const label = getSlotLabel(selectedSlot.category, selectedSlot.type);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);

    if (!draggedTile) return;

    const variant: TileVariant = {
      source: {
        tilesetId: draggedTile.tilesetId,
        x: draggedTile.x,
        y: draggedTile.y
      },
      weight: 50
    };

    onDropTile(selectedSlot.category, selectedSlot.type, variant);
    onEndDrag();
  };

  return (
    <div className="h-full p-4 bg-gray-800 overflow-auto">
      <h3 className="text-white font-bold mb-2 text-sm">
        Varianten: {label} ({variants.length})
      </h3>

      <div
        className={`flex gap-2 flex-wrap p-2 min-h-20 border-2 border-dashed rounded ${
          isDragOver ? 'border-green-500 bg-green-900/20' : 'border-gray-600'
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {variants.map((variant, index) => (
          <VariantItem
            key={index}
            variant={variant}
            index={index}
            tilesets={tilesets}
            onRemove={() => onRemoveVariant(selectedSlot.category, selectedSlot.type, index)}
            onUpdateWeight={(weight) => onUpdateWeight(selectedSlot.category, selectedSlot.type, index, weight)}
          />
        ))}

        {variants.length === 0 && !isDragOver && (
          <div className="flex-1 flex items-center justify-center text-gray-500 text-sm">
            Tile hierher ziehen zum Hinzufügen
          </div>
        )}

        {isDragOver && (
          <div className="flex items-center justify-center border-2 border-green-500 border-dashed rounded p-2">
            <span className="text-green-400 text-sm">+ Hinzufügen</span>
          </div>
        )}
      </div>
    </div>
  );
}

interface VariantItemProps {
  variant: TileVariant;
  index: number;
  tilesets: ImportedTileset[];
  onRemove: () => void;
  onUpdateWeight: (weight: number) => void;
}

function VariantItem({ variant, index, tilesets, onRemove, onUpdateWeight }: VariantItemProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [tilesetImage, setTilesetImage] = useState<HTMLImageElement | null>(null);

  // Load tileset image
  useEffect(() => {
    const tileset = tilesets.find((t) => t.id === variant.source.tilesetId);
    if (!tileset) return;

    const img = new Image();
    img.onload = () => setTilesetImage(img);
    img.src = tileset.path;
  }, [variant.source.tilesetId, tilesets]);

  // Draw tile
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !tilesetImage) return;

    const ctx = getContext2D(canvas);
    if (!ctx) return;

    canvas.width = VARIANT_SIZE;
    canvas.height = VARIANT_SIZE;

    ctx.drawImage(
      tilesetImage,
      variant.source.x * TILE_SOURCE_SIZE,
      variant.source.y * TILE_SOURCE_SIZE,
      TILE_SOURCE_SIZE,
      TILE_SOURCE_SIZE,
      0,
      0,
      VARIANT_SIZE,
      VARIANT_SIZE
    );
  }, [tilesetImage, variant.source]);

  return (
    <div className="flex flex-col items-center bg-gray-700 rounded p-2">
      <div className="relative">
        <canvas
          ref={canvasRef}
          width={VARIANT_SIZE}
          height={VARIANT_SIZE}
          className="border border-gray-600 rounded"
          style={{ imageRendering: 'pixelated' }}
        />
        <button
          onClick={onRemove}
          className="absolute -top-1 -right-1 w-5 h-5 bg-red-600 hover:bg-red-700 text-white text-xs rounded-full flex items-center justify-center"
          title="Entfernen"
        >
          ×
        </button>
      </div>

      {/* Weight slider */}
      <div className="w-full mt-2">
        <input
          type="range"
          min={1}
          max={100}
          value={variant.weight}
          onChange={(e) => onUpdateWeight(parseInt(e.target.value))}
          className="w-full h-1 bg-gray-600 rounded appearance-none cursor-pointer"
        />
        <div className="text-gray-400 text-xs text-center">{variant.weight}%</div>
      </div>
    </div>
  );
}
