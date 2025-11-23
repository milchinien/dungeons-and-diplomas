'use client';

import { useCallback } from 'react';
import type { TileTheme, TileVariant, ImportedTileset, DraggedTile, SelectedSlot, SlotCategory, WallType, DoorType } from '@/lib/tiletheme/types';
import { REQUIRED_WALL_TYPES, OPTIONAL_WALL_TYPES, REQUIRED_DOOR_TYPES } from '@/lib/tiletheme/types';
import { getSlotLabel, getSlotSymbol } from '@/lib/tiletheme/ThemeValidator';
import { TileSlot } from './TileSlot';

interface TileSlotGridProps {
  theme: TileTheme | null;
  selectedSlot: SelectedSlot | null;
  onSelectSlot: (category: SlotCategory, type: string) => void;
  draggedTile: DraggedTile | null;
  onDropTile: (category: SlotCategory, type: string, variant: TileVariant) => void;
  onEndDrag: () => void;
  tilesets: ImportedTileset[];
}

export function TileSlotGrid({
  theme,
  selectedSlot,
  onSelectSlot,
  draggedTile,
  onDropTile,
  onEndDrag,
  tilesets
}: TileSlotGridProps) {
  const getVariants = useCallback((category: SlotCategory, type: string): TileVariant[] => {
    if (!theme) return [];

    if (category === 'floor') {
      return theme.floor.default || [];
    } else if (category === 'wall') {
      return theme.wall[type as WallType] || [];
    } else if (category === 'door') {
      return theme.door[type as DoorType] || [];
    }
    return [];
  }, [theme]);

  const handleDrop = useCallback((category: SlotCategory, type: string) => {
    if (!draggedTile) return;

    const variant: TileVariant = {
      source: {
        tilesetId: draggedTile.tilesetId,
        x: draggedTile.x,
        y: draggedTile.y
      },
      weight: 50 // Default weight
    };

    onDropTile(category, type, variant);
    onEndDrag();
  }, [draggedTile, onDropTile, onEndDrag]);

  if (!theme) {
    return (
      <div className="flex items-center justify-center h-full text-gray-500">
        <div className="text-center">
          <p className="mb-2">Kein Theme geladen</p>
          <p className="text-sm">Erstelle ein neues Theme oder lade ein bestehendes</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Floor Section */}
      <section>
        <h2 className="text-white font-bold mb-2 text-sm uppercase tracking-wide">Floor</h2>
        <div className="flex gap-2 flex-wrap">
          <TileSlot
            category="floor"
            type="default"
            label={getSlotLabel('floor', 'default')}
            symbol={getSlotSymbol('floor', 'default')}
            required={true}
            variants={getVariants('floor', 'default')}
            isSelected={selectedSlot?.category === 'floor' && selectedSlot?.type === 'default'}
            onSelect={() => onSelectSlot('floor', 'default')}
            onDrop={() => handleDrop('floor', 'default')}
            isDragOver={draggedTile !== null}
            tilesets={tilesets}
          />
        </div>
      </section>

      {/* Walls Section - Required */}
      <section>
        <h2 className="text-white font-bold mb-2 text-sm uppercase tracking-wide">Walls (Pflicht)</h2>
        <div className="flex gap-2 flex-wrap">
          {REQUIRED_WALL_TYPES.map((wallType) => (
            <TileSlot
              key={wallType}
              category="wall"
              type={wallType}
              label={getSlotLabel('wall', wallType)}
              symbol={getSlotSymbol('wall', wallType)}
              required={true}
              variants={getVariants('wall', wallType)}
              isSelected={selectedSlot?.category === 'wall' && selectedSlot?.type === wallType}
              onSelect={() => onSelectSlot('wall', wallType)}
              onDrop={() => handleDrop('wall', wallType)}
              isDragOver={draggedTile !== null}
              tilesets={tilesets}
            />
          ))}
        </div>
      </section>

      {/* Walls Section - Optional */}
      <section>
        <h2 className="text-gray-400 font-bold mb-2 text-sm uppercase tracking-wide">Walls (Optional)</h2>
        <div className="flex gap-2 flex-wrap">
          {OPTIONAL_WALL_TYPES.map((wallType) => (
            <TileSlot
              key={wallType}
              category="wall"
              type={wallType}
              label={getSlotLabel('wall', wallType)}
              symbol={getSlotSymbol('wall', wallType)}
              required={false}
              variants={getVariants('wall', wallType)}
              isSelected={selectedSlot?.category === 'wall' && selectedSlot?.type === wallType}
              onSelect={() => onSelectSlot('wall', wallType)}
              onDrop={() => handleDrop('wall', wallType)}
              isDragOver={draggedTile !== null}
              tilesets={tilesets}
            />
          ))}
        </div>
      </section>

      {/* Doors Section */}
      <section>
        <h2 className="text-white font-bold mb-2 text-sm uppercase tracking-wide">Doors (Pflicht)</h2>
        <div className="flex gap-2 flex-wrap">
          {REQUIRED_DOOR_TYPES.map((doorType) => (
            <TileSlot
              key={doorType}
              category="door"
              type={doorType}
              label={getSlotLabel('door', doorType)}
              symbol={getSlotSymbol('door', doorType)}
              required={true}
              variants={getVariants('door', doorType)}
              isSelected={selectedSlot?.category === 'door' && selectedSlot?.type === doorType}
              onSelect={() => onSelectSlot('door', doorType)}
              onDrop={() => handleDrop('door', doorType)}
              isDragOver={draggedTile !== null}
              tilesets={tilesets}
            />
          ))}
        </div>
      </section>
    </div>
  );
}
