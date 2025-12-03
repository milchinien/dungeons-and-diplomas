import { useCallback } from 'react';
import type { Player } from '@/lib/enemy';
import type { DungeonManager } from '@/lib/game/DungeonManager';
import { api } from '@/lib/api';
import { generateTreasureLoot, type DroppedItem } from '@/lib/items';

interface UseTreasureCollectionProps {
  userId: number | null;
  playerRef: React.MutableRefObject<Player>;
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  dungeonManagerRef: React.MutableRefObject<DungeonManager | null>;
  onXpGained?: (amount: number) => void;
  onTreasureCollected?: (screenX: number, screenY: number, xpAmount: number) => void;
  onItemDropped?: (item: DroppedItem) => void;
}

interface UseTreasureCollectionResult {
  handleTreasureCollected: (tileX: number, tileY: number) => Promise<void>;
}

const TREASURE_XP_AMOUNT = 200;

/**
 * Hook for handling treasure collection logic.
 * Manages XP awards and screen position calculations for treasure popups.
 */
export function useTreasureCollection({
  userId,
  playerRef,
  canvasRef,
  dungeonManagerRef,
  onXpGained,
  onTreasureCollected,
  onItemDropped
}: UseTreasureCollectionProps): UseTreasureCollectionResult {

  const handleTreasureCollected = useCallback(async (tileX: number, tileY: number) => {
    if (!userId) return;

    try {
      await api.xp.addXp({
        user_id: userId,
        xp_amount: TREASURE_XP_AMOUNT,
        reason: 'treasure',
        enemy_level: undefined
      });

      if (onXpGained) {
        onXpGained(TREASURE_XP_AMOUNT);
      }

      // Calculate screen position for the bubble
      if (onTreasureCollected && canvasRef.current && dungeonManagerRef.current) {
        const canvas = canvasRef.current;
        const tileSize = dungeonManagerRef.current.tileSize;
        const player = playerRef.current;

        // Calculate camera offset (camera is centered on player)
        const cameraX = player.x + tileSize / 2 - canvas.width / 2;
        const cameraY = player.y + tileSize / 2 - canvas.height / 2;

        // Convert tile position to world position
        const worldX = tileX * tileSize + tileSize / 2;
        const worldY = tileY * tileSize + tileSize / 2;

        // Convert world position to screen position
        const screenX = worldX - cameraX;
        const screenY = worldY - cameraY;

        onTreasureCollected(screenX, screenY, TREASURE_XP_AMOUNT);
      }

      console.log(`Treasure collected at (${tileX}, ${tileY})! +${TREASURE_XP_AMOUNT} XP`);

      // Generate item drop for treasure chest (always common/gray)
      if (onItemDropped && dungeonManagerRef.current) {
        const tileSize = dungeonManagerRef.current.tileSize;
        const worldX = tileX * tileSize;
        const worldY = tileY * tileSize;
        const droppedItem = generateTreasureLoot(worldX, worldY, tileSize);
        console.log(`[TreasureCollection] Chest dropped: ${droppedItem.item.name} (${droppedItem.item.rarity})`);
        onItemDropped(droppedItem);
      }
    } catch (error) {
      console.error('Failed to award treasure XP:', error);
    }
  }, [userId, playerRef, canvasRef, dungeonManagerRef, onXpGained, onTreasureCollected, onItemDropped]);

  return { handleTreasureCollected };
}
