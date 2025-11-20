import { useState, useRef, useEffect } from 'react';
import type { Player } from '@/lib/Enemy';
import type { QuestionDatabase } from '@/lib/questions';
import { DIRECTION, PLAYER_MAX_HP } from '@/lib/constants';
import type { KeyboardState } from '@/lib/constants';
import { DungeonManager } from '@/lib/game/DungeonManager';
import { GameEngine } from '@/lib/game/GameEngine';
import { GameRenderer } from '@/lib/rendering/GameRenderer';
import { MinimapRenderer } from '@/lib/rendering/MinimapRenderer';

interface UseGameStateProps {
  questionDatabase: QuestionDatabase | null;
  availableSubjects: string[];
  userId: number | null;
  onPlayerHpUpdate: (hp: number) => void;
  onXpGained?: (amount: number) => void;
  onTreasureCollected?: (screenX: number, screenY: number, xpAmount: number) => void;
}

export function useGameState({
  questionDatabase,
  availableSubjects,
  userId,
  onPlayerHpUpdate,
  onXpGained,
  onTreasureCollected
}: UseGameStateProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const minimapRef = useRef<HTMLCanvasElement>(null);
  const [gameInitialized, setGameInitialized] = useState(false);
  const gamePausedRef = useRef(false);
  const isMountedRef = useRef(true);
  const isInitializingRef = useRef(false);
  const gameLoopIdRef = useRef<number | null>(null);
  const lastTimeRef = useRef(0);

  const playerRef = useRef<Player>({
    x: 0,
    y: 0,
    width: 0,
    height: 0,
    direction: DIRECTION.DOWN,
    isMoving: false,
    hp: PLAYER_MAX_HP,
    maxHp: PLAYER_MAX_HP
  });

  const keysRef = useRef<KeyboardState>({
    ArrowUp: false,
    ArrowDown: false,
    ArrowLeft: false,
    ArrowRight: false,
    w: false,
    s: false,
    a: false,
    d: false
  });

  const dungeonManagerRef = useRef<DungeonManager | null>(null);
  const gameEngineRef = useRef<GameEngine>(new GameEngine());
  const gameRendererRef = useRef<GameRenderer>(new GameRenderer());
  const minimapRendererRef = useRef<MinimapRenderer>(new MinimapRenderer());

  const generateNewDungeon = async () => {
    if (!dungeonManagerRef.current) return;
    await dungeonManagerRef.current.generateNewDungeon(availableSubjects, userId);
    playerRef.current.hp = PLAYER_MAX_HP;
    onPlayerHpUpdate(PLAYER_MAX_HP);
  };

  // Combat state will be injected
  const inCombatRef = useRef(false);
  const startCombatRef = useRef<(enemy: any) => void>(() => {});

  const handleTreasureCollected = async (tileX: number, tileY: number) => {
    if (!userId) return;

    const xpAmount = 200;

    try {
      await fetch('/api/xp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: userId,
          xp_amount: xpAmount,
          reason: 'treasure',
          enemy_level: null
        })
      });

      if (onXpGained) {
        onXpGained(xpAmount);
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

        onTreasureCollected(screenX, screenY, xpAmount);
      }

      console.log(`Treasure collected at (${tileX}, ${tileY})! +${xpAmount} XP`);
    } catch (error) {
      console.error('Failed to award treasure XP:', error);
    }
  };

  const update = (dt: number) => {
    if (isNaN(dt)) dt = 0;
    if (!dungeonManagerRef.current) return;

    const engine = gameEngineRef.current;
    const manager = dungeonManagerRef.current;

    engine.updatePlayer(
      dt,
      playerRef.current,
      keysRef.current,
      manager.tileSize,
      manager.dungeon,
      manager.roomMap,
      manager.rooms,
      manager.playerSprite,
      inCombatRef.current,
      manager.treasures,
      handleTreasureCollected
    );

    engine.updateEnemies(
      dt,
      manager.enemies,
      playerRef.current,
      manager.tileSize,
      manager.rooms,
      manager.dungeon,
      manager.roomMap,
      startCombatRef.current,
      inCombatRef.current
    );
  };

  const render = () => {
    const canvas = canvasRef.current;
    const minimap = minimapRef.current;
    if (!canvas || !minimap || !dungeonManagerRef.current) return;

    const manager = dungeonManagerRef.current;

    gameRendererRef.current.render(
      canvas,
      playerRef.current,
      manager.dungeon,
      manager.tileVariants,
      manager.roomMap,
      manager.rooms,
      manager.enemies,
      manager.playerSprite,
      manager.tileSize,
      manager.treasures
    );

    minimapRendererRef.current.render(
      minimap,
      playerRef.current,
      manager.dungeon,
      manager.roomMap,
      manager.rooms,
      manager.tileSize
    );
  };

  const gameLoop = (timestamp: number) => {
    if (!gamePausedRef.current) {
      const dt = (timestamp - lastTimeRef.current) / 1000;
      lastTimeRef.current = timestamp;

      update(dt);
      render();
    }

    gameLoopIdRef.current = requestAnimationFrame(gameLoop);
  };

  useEffect(() => {
    isMountedRef.current = true;

    const initGame = async () => {
      if (!isMountedRef.current || isInitializingRef.current) {
        return;
      }

      if (!questionDatabase) {
        return;
      }

      isInitializingRef.current = true;

      const canvas = canvasRef.current;
      if (!canvas) return;

      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;

      // Load tileset
      await gameRendererRef.current.loadTileset();

      // Initialize dungeon manager
      const dungeonManager = new DungeonManager(playerRef.current);
      await dungeonManager.initialize(availableSubjects);
      dungeonManagerRef.current = dungeonManager;

      if (!isMountedRef.current) {
        return;
      }

      setGameInitialized(true);
      gameLoopIdRef.current = requestAnimationFrame(gameLoop);
    };

    initGame();

    const handleResize = () => {
      if (canvasRef.current) {
        canvasRef.current.width = window.innerWidth;
        canvasRef.current.height = window.innerHeight;
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key in keysRef.current) {
        keysRef.current[e.key as keyof KeyboardState] = true;
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key in keysRef.current) {
        keysRef.current[e.key as keyof KeyboardState] = false;
      }
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      isMountedRef.current = false;
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      if (gameLoopIdRef.current) {
        cancelAnimationFrame(gameLoopIdRef.current);
      }
    };
  }, [questionDatabase, availableSubjects, userId]);

  return {
    canvasRef,
    minimapRef,
    gameInitialized,
    gamePausedRef,
    playerRef,
    inCombatRef,
    startCombatRef,
    generateNewDungeon
  };
}
