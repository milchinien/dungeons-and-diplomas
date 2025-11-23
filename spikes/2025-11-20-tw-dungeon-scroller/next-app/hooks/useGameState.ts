import { useState, useRef, useEffect } from 'react';
import type { Player } from '@/lib/enemy';
import type { QuestionDatabase } from '@/lib/questions';
import { DIRECTION, PLAYER_MAX_HP } from '@/lib/constants';
import type { KeyboardState } from '@/lib/constants';
import type { GameStateConfig } from '@/lib/types/gameState';
import { resolveConfig } from '@/lib/types/gameState';
import type { DungeonManager } from '@/lib/game/DungeonManager';
import type { GameEngine } from '@/lib/game/GameEngine';
import type { GameRenderer } from '@/lib/rendering/GameRenderer';
import type { MinimapRenderer } from '@/lib/rendering/MinimapRenderer';

interface UseGameStateProps {
  questionDatabase: QuestionDatabase | null;
  availableSubjects: string[];
  userId: number | null;
  onPlayerHpUpdate: (hp: number) => void;
  onXpGained?: (amount: number) => void;
  onTreasureCollected?: (screenX: number, screenY: number, xpAmount: number) => void;
  /** Reference to combat state (injected from useCombat) */
  inCombatRef?: React.MutableRefObject<boolean>;
  /** Callback when combat should start (injected from useCombat) */
  onStartCombat?: (enemy: any) => void;
  /** Shared player reference (owned by parent component) */
  playerRef?: React.MutableRefObject<Player>;
  /** Optional configuration for dependency injection (testing) */
  config?: GameStateConfig;
}

export function useGameState({
  questionDatabase,
  availableSubjects,
  userId,
  onPlayerHpUpdate,
  onXpGained,
  onTreasureCollected,
  inCombatRef: externalInCombatRef,
  onStartCombat,
  playerRef: externalPlayerRef,
  config: userConfig
}: UseGameStateProps) {
  // Resolve configuration with defaults
  const config = resolveConfig(userConfig);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const minimapRef = useRef<HTMLCanvasElement>(null);
  const [gameInitialized, setGameInitialized] = useState(false);
  const gamePausedRef = useRef(false);
  const isMountedRef = useRef(true);
  const isInitializingRef = useRef(false);
  const gameLoopIdRef = useRef<number | null>(null);
  const lastTimeRef = useRef(0);

  // Player reference - use external if provided, otherwise create local fallback
  const fallbackPlayerRef = useRef<Player>({
    x: 0,
    y: 0,
    width: 0,
    height: 0,
    direction: DIRECTION.DOWN,
    isMoving: false,
    hp: PLAYER_MAX_HP,
    maxHp: PLAYER_MAX_HP
  });
  const playerRef = externalPlayerRef || fallbackPlayerRef;

  const keysRef = useRef<KeyboardState>({
    ArrowUp: false,
    ArrowDown: false,
    ArrowLeft: false,
    ArrowRight: false,
    w: false,
    s: false,
    a: false,
    d: false,
    ' ': false
  });

  // Use factories from config for dependency injection
  const dungeonManagerRef = useRef<DungeonManager | null>(null);
  const gameEngineRef = useRef<GameEngine>(config.gameEngineFactory());
  const gameRendererRef = useRef<GameRenderer>(config.gameRendererFactory());
  const minimapRendererRef = useRef<MinimapRenderer>(config.minimapRendererFactory());

  const generateNewDungeon = async () => {
    if (!dungeonManagerRef.current) return;
    await dungeonManagerRef.current.generateNewDungeon(availableSubjects, userId);
    playerRef.current.hp = PLAYER_MAX_HP;
    onPlayerHpUpdate(PLAYER_MAX_HP);
  };

  // Combat state - use external refs/callbacks if provided, otherwise create local fallbacks
  const fallbackInCombatRef = useRef(false);
  const inCombatRef = externalInCombatRef || fallbackInCombatRef;
  const startCombatCallback = onStartCombat || (() => {});

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

    engine.updatePlayer({
      dt,
      player: playerRef.current,
      keys: keysRef.current,
      tileSize: manager.tileSize,
      dungeon: manager.dungeon,
      roomMap: manager.roomMap,
      rooms: manager.rooms,
      playerSprite: manager.playerSprite,
      inCombat: inCombatRef.current,
      doorStates: manager.doorStates,
      enemies: manager.enemies,
      treasures: manager.treasures,
      onTreasureCollected: handleTreasureCollected
    });

    engine.updateEnemies({
      dt,
      enemies: manager.enemies,
      player: playerRef.current,
      tileSize: manager.tileSize,
      rooms: manager.rooms,
      dungeon: manager.dungeon,
      roomMap: manager.roomMap,
      startCombat: startCombatCallback,
      inCombat: inCombatRef.current,
      doorStates: manager.doorStates
    });
  };

  const render = () => {
    const canvas = canvasRef.current;
    const minimap = minimapRef.current;
    if (!canvas || !minimap || !dungeonManagerRef.current) return;

    const manager = dungeonManagerRef.current;

    if (manager.renderMap) {
      gameRendererRef.current.render(
        canvas,
        playerRef.current,
        manager.dungeon,
        manager.roomMap,
        manager.rooms,
        manager.enemies,
        manager.playerSprite,
        manager.tileSize,
        manager.renderMap,
        manager.doorStates,
        manager.darkTheme
      );
    }

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

    gameLoopIdRef.current = config.scheduler.requestFrame(gameLoop);
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

      canvas.width = config.windowDimensions.getWidth();
      canvas.height = config.windowDimensions.getHeight();

      // Initialize dungeon manager using factory from config
      const dungeonManager = config.dungeonManagerFactory(playerRef.current);
      await dungeonManager.initialize(availableSubjects);
      dungeonManagerRef.current = dungeonManager;

      if (!isMountedRef.current) {
        return;
      }

      setGameInitialized(true);
      gameLoopIdRef.current = config.scheduler.requestFrame(gameLoop);
    };

    initGame();

    const handleResize = () => {
      if (canvasRef.current) {
        canvasRef.current.width = config.windowDimensions.getWidth();
        canvasRef.current.height = config.windowDimensions.getHeight();
      }
    };

    const handleKeyDown = (e: Event) => {
      const key = (e as KeyboardEvent).key;
      if (key in keysRef.current) {
        keysRef.current[key as keyof KeyboardState] = true;
      }
    };

    const handleKeyUp = (e: Event) => {
      const key = (e as KeyboardEvent).key;
      if (key in keysRef.current) {
        keysRef.current[key as keyof KeyboardState] = false;
      }
    };

    config.eventTarget.addEventListener('resize', handleResize);
    config.eventTarget.addEventListener('keydown', handleKeyDown);
    config.eventTarget.addEventListener('keyup', handleKeyUp);

    return () => {
      isMountedRef.current = false;
      config.eventTarget.removeEventListener('resize', handleResize);
      config.eventTarget.removeEventListener('keydown', handleKeyDown);
      config.eventTarget.removeEventListener('keyup', handleKeyUp);
      if (gameLoopIdRef.current) {
        config.scheduler.cancelFrame(gameLoopIdRef.current);
      }
    };
  }, [questionDatabase, availableSubjects, userId]);

  return {
    canvasRef,
    minimapRef,
    gameInitialized,
    gamePausedRef,
    playerRef,
    generateNewDungeon,
    dungeonManagerRef
  };
}
