import { useState, useCallback, useRef, useEffect } from 'react';
import type { Player } from '@/lib/enemy';
import type { DungeonManager } from '@/lib/game/DungeonManager';
import type { RoomType } from '@/lib/constants';
import { setGodMode } from '@/lib/buff';
import { setSpeedBoost } from '@/lib/game/GameEngine';

interface UseCheatSystemProps {
  playerRef: React.MutableRefObject<Player>;
  dungeonManagerRef: React.MutableRefObject<DungeonManager | null>;
  onPlayerHpUpdate: (hp: number) => void;
  onXpGained?: (amount: number) => void;
  onGenerateNewDungeon?: () => void;
  /** Callback to kill current enemy in combat */
  onKillCurrentEnemy?: () => void;
  /** Callback to set cheat show answer mode */
  onSetShowCorrectAnswer?: (show: boolean) => void;
}

export interface CheatState {
  godMode: boolean;
  speedBoost: boolean;
  showCorrectAnswer: boolean;
  fogOfWarDisabled: boolean;
}

export function useCheatSystem({
  playerRef,
  dungeonManagerRef,
  onPlayerHpUpdate,
  onXpGained,
  onGenerateNewDungeon,
  onKillCurrentEnemy,
  onSetShowCorrectAnswer
}: UseCheatSystemProps) {
  const [showCheatModal, setShowCheatModal] = useState(false);
  const [cheatState, setCheatState] = useState<CheatState>({
    godMode: false,
    speedBoost: false,
    showCorrectAnswer: false,
    fogOfWarDisabled: false
  });

  // Ref to access cheat state synchronously (for game loop)
  const cheatStateRef = useRef(cheatState);
  cheatStateRef.current = cheatState;

  const toggleCheatModal = useCallback(() => {
    setShowCheatModal(prev => !prev);
  }, []);

  const closeCheatModal = useCallback(() => {
    setShowCheatModal(false);
  }, []);

  // Find nearest room of specific type
  const findNearestRoom = useCallback((roomType: RoomType): { x: number; y: number } | null => {
    const manager = dungeonManagerRef.current;
    if (!manager) return null;

    const playerTileX = Math.floor(playerRef.current.x / manager.tileSize);
    const playerTileY = Math.floor(playerRef.current.y / manager.tileSize);

    let nearestRoom = null;
    let nearestDistance = Infinity;

    for (const room of manager.rooms) {
      if (room.type === roomType) {
        // Calculate center of room
        const roomCenterX = room.x + Math.floor(room.width / 2);
        const roomCenterY = room.y + Math.floor(room.height / 2);

        const distance = Math.sqrt(
          Math.pow(roomCenterX - playerTileX, 2) +
          Math.pow(roomCenterY - playerTileY, 2)
        );

        if (distance > 2 && distance < nearestDistance) { // > 2 to avoid current room
          nearestDistance = distance;
          nearestRoom = {
            x: roomCenterX * manager.tileSize,
            y: roomCenterY * manager.tileSize
          };
        }
      }
    }

    return nearestRoom;
  }, [dungeonManagerRef, playerRef]);

  // Teleport to room type
  const teleportToRoom = useCallback((roomType: RoomType) => {
    const manager = dungeonManagerRef.current;
    if (!manager) {
      console.error('[Teleport] DungeonManager not available');
      return;
    }

    // Debug: Count rooms of each type
    const roomCounts = manager.rooms.reduce((acc, room) => {
      acc[room.type] = (acc[room.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    console.log('[Teleport] Room types in dungeon:', roomCounts);
    console.log('[Teleport] Looking for room type:', roomType);

    const target = findNearestRoom(roomType);
    if (target) {
      console.log('[Teleport] Found target:', target);
      playerRef.current.x = target.x;
      playerRef.current.y = target.y;

      // Make room visible
      const tileX = Math.floor(target.x / manager.tileSize);
      const tileY = Math.floor(target.y / manager.tileSize);
      const roomIndex = manager.roomMap[tileY]?.[tileX];
      if (roomIndex >= 0 && manager.rooms[roomIndex]) {
        manager.rooms[roomIndex].visible = true;
      }
    } else {
      console.warn('[Teleport] No room of type', roomType, 'found!');
    }
  }, [findNearestRoom, playerRef, dungeonManagerRef]);

  // HP manipulation
  const healPlayer = useCallback((amount: number) => {
    const newHp = Math.min(playerRef.current.hp + amount, playerRef.current.maxHp);
    playerRef.current.hp = newHp;
    onPlayerHpUpdate(newHp);
  }, [playerRef, onPlayerHpUpdate]);

  const fullHeal = useCallback(() => {
    playerRef.current.hp = playerRef.current.maxHp;
    onPlayerHpUpdate(playerRef.current.maxHp);
  }, [playerRef, onPlayerHpUpdate]);

  // Shield manipulation
  const addShield = useCallback((amount: number) => {
    if (playerRef.current.buffs) {
      playerRef.current.buffs.currentShield =
        (playerRef.current.buffs.currentShield || 0) + amount;
    }
  }, [playerRef]);

  // Toggle God Mode
  const toggleGodMode = useCallback(() => {
    setCheatState(prev => {
      const newGodMode = !prev.godMode;
      setGodMode(newGodMode); // Update global god mode flag
      return { ...prev, godMode: newGodMode };
    });
  }, []);

  // Toggle Speed Boost
  const toggleSpeedBoost = useCallback(() => {
    setCheatState(prev => {
      const newSpeedBoost = !prev.speedBoost;
      setSpeedBoost(newSpeedBoost); // Update global speed boost flag
      return { ...prev, speedBoost: newSpeedBoost };
    });
  }, []);

  // Toggle Show Correct Answer
  const toggleShowCorrectAnswer = useCallback(() => {
    setCheatState(prev => {
      const newValue = !prev.showCorrectAnswer;
      if (onSetShowCorrectAnswer) {
        onSetShowCorrectAnswer(newValue);
      }
      return { ...prev, showCorrectAnswer: newValue };
    });
  }, [onSetShowCorrectAnswer]);

  // Kill all enemies
  const killAllEnemies = useCallback(() => {
    const manager = dungeonManagerRef.current;
    if (!manager) return;

    // Kill all regular enemies
    for (const enemy of manager.enemies) {
      enemy.alive = false;
    }
    manager.enemies = [];

    // Kill all trashmobs
    for (const trashmob of manager.trashmobs) {
      trashmob.alive = false;
    }
    manager.trashmobs = [];
  }, [dungeonManagerRef]);

  // Kill current enemy (in combat)
  const killCurrentEnemy = useCallback(() => {
    if (onKillCurrentEnemy) {
      onKillCurrentEnemy();
    }
  }, [onKillCurrentEnemy]);

  // Reveal all rooms (disable fog of war)
  const revealAllRooms = useCallback(() => {
    const manager = dungeonManagerRef.current;
    if (!manager) return;

    for (const room of manager.rooms) {
      room.visible = true;
    }
    setCheatState(prev => ({ ...prev, fogOfWarDisabled: true }));
  }, [dungeonManagerRef]);

  // Add XP
  const addXp = useCallback((amount: number) => {
    if (onXpGained) {
      onXpGained(amount);
    }
  }, [onXpGained]);

  // Generate new dungeon
  const newDungeon = useCallback(() => {
    if (onGenerateNewDungeon) {
      onGenerateNewDungeon();
    }
  }, [onGenerateNewDungeon]);

  return {
    showCheatModal,
    cheatState,
    cheatStateRef,
    toggleCheatModal,
    closeCheatModal,
    teleportToRoom,
    healPlayer,
    fullHeal,
    addShield,
    toggleGodMode,
    toggleSpeedBoost,
    toggleShowCorrectAnswer,
    killAllEnemies,
    killCurrentEnemy,
    revealAllRooms,
    addXp,
    newDungeon
  };
}
