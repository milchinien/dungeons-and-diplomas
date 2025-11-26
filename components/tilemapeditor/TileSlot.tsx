'use client';

import { useState, useRef, useEffect } from 'react';
import type { TileVariant, ImportedTileset, SlotCategory } from '@/lib/tiletheme/types';
import { TILE_SOURCE_SIZE } from '@/lib/constants';
import { getContext2D } from '@/lib/rendering/canvasUtils';

interface TileSlotProps {
  category: SlotCategory;
  type: string;
  label: string;
  symbol: string;
  required: boolean;
  variants: TileVariant[];
  isSelected: boolean;
  onSelect: () => void;
  onDrop: () => void;
  isDragOver: boolean;
  tilesets: ImportedTileset[];
}

const SLOT_SIZE = 64;

export function TileSlot({
  category,
  type,
  label,
  symbol,
  required,
  variants,
  isSelected,
  onSelect,
  onDrop,
  isDragOver,
  tilesets
}: TileSlotProps) {
  const [isHovering, setIsHovering] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [tilesetImages, setTilesetImages] = useState<Map<number, HTMLImageElement>>(new Map());

  // Load tileset images for variants
  useEffect(() => {
    const loadImages = async () => {
      const newImages = new Map<number, HTMLImageElement>();

      for (const variant of variants) {
        const tilesetId = variant.source.tilesetId;
        if (!newImages.has(tilesetId)) {
          const tileset = tilesets.find((t) => t.id === tilesetId);
          if (tileset) {
            const img = new Image();
            await new Promise<void>((resolve) => {
              img.onload = () => resolve();
              img.onerror = () => resolve();
              img.src = tileset.path;
            });
            newImages.set(tilesetId, img);
          }
        }
      }

      setTilesetImages(newImages);
    };

    if (variants.length > 0) {
      loadImages();
    }
  }, [variants, tilesets]);

  // Draw preview
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = getContext2D(canvas);
    if (!ctx) return;

    canvas.width = SLOT_SIZE;
    canvas.height = SLOT_SIZE;

    // Clear
    ctx.fillStyle = variants.length > 0 ? '#2a2a4e' : '#1a1a2e';
    ctx.fillRect(0, 0, SLOT_SIZE, SLOT_SIZE);

    if (variants.length > 0) {
      // Draw first variant as preview
      const variant = variants[0];
      const tilesetImage = tilesetImages.get(variant.source.tilesetId);

      if (tilesetImage) {
        ctx.drawImage(
          tilesetImage,
          variant.source.x * TILE_SOURCE_SIZE,
          variant.source.y * TILE_SOURCE_SIZE,
          TILE_SOURCE_SIZE,
          TILE_SOURCE_SIZE,
          0,
          0,
          SLOT_SIZE,
          SLOT_SIZE
        );
      }

      // Show variant count if more than 1
      if (variants.length > 1) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(SLOT_SIZE - 20, 0, 20, 16);
        ctx.fillStyle = '#fff';
        ctx.font = '10px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(`+${variants.length - 1}`, SLOT_SIZE - 10, 12);
      }
    } else {
      // Draw symbol for empty slot
      ctx.fillStyle = required ? '#ff6b6b' : '#666';
      ctx.font = '24px monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(symbol, SLOT_SIZE / 2, SLOT_SIZE / 2);
    }
  }, [variants, tilesetImages, symbol, required]);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
    setIsHovering(true);
  };

  const handleDragLeave = () => {
    setIsHovering(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsHovering(false);
    onDrop();
  };

  const isFilled = variants.length > 0;
  const borderColor = isSelected
    ? 'border-blue-500'
    : isHovering && isDragOver
    ? 'border-green-500'
    : isFilled
    ? 'border-gray-600'
    : required
    ? 'border-red-800'
    : 'border-gray-700';

  return (
    <div
      className={`flex flex-col items-center cursor-pointer transition-all ${
        isSelected ? 'scale-105' : ''
      }`}
      onClick={onSelect}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <div
        className={`border-2 rounded ${borderColor} ${
          isHovering && isDragOver ? 'shadow-lg shadow-green-500/50' : ''
        }`}
      >
        <canvas
          ref={canvasRef}
          width={SLOT_SIZE}
          height={SLOT_SIZE}
          style={{ imageRendering: 'pixelated' }}
        />
      </div>
      <span
        className={`text-xs mt-1 ${
          isFilled ? 'text-gray-300' : required ? 'text-red-400' : 'text-gray-500'
        }`}
      >
        {label}
      </span>
    </div>
  );
}
