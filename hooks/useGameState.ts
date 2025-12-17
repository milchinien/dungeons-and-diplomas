import { useState, useRef, useEffect, useCallback } from 'react';
import type { Player } from '@/lib/enemy';
import type { QuestionDatabase } from '@/lib/questions';
import { DIRECTION, PLAYER_MAX_HP } from '@/lib/constants';
import type { GameStateConfig } from '@/lib/types/gameState';
import { resolveConfig } from '@/lib/types/gameState';
import type { DungeonManager } from '@/lib/game/DungeonManager';
import type { GameEngine } from '@/lib/game/GameEngine';
import type { GameRenderer } from '@/lib/rendering/GameRenderer';
import type { MinimapRenderer } from '@/lib/rendering/MinimapRenderer';
import { useKeyboardInput } from './useKeyboardInput';
import { useTreasureCollection } from './useTreasureCollection';
import { useFootsteps } from './useFootsteps';

interface UseGameStateProps {
  questionDatabase: QuestionDatabase | null;
  availableSubjects: string[];
  userId: number | null;
  onPlayerHpUpdate: (hp: number) => void;
  onXpGained?: (amount: number) => void;
  onTreasureCollected?: (screenX: number, screenY: number, xpAmount: number) => void;
  /** Callback when an item is dropped (from treasures) */
  onItemDropped?: (item: any) => void;
  /** Reference to combat state (injected from useCombat) */
  inCombatRef?: React.MutableRefObject<boolean>;
  /** Callback when combat should start (injected from useCombat) */
  onStartCombat?: (enemy: any) => void;
  /** Callback when player dies outside of combat (from trashmob damage) */
  onPlayerDeath?: () => void;
  /** Callback when player takes damage from trashmob (for visual feedback) */
  onTrashmobDamage?: () => void;
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
  onItemDropped,
  inCombatRef: externalInCombatRef,
  onStartCombat,
  onPlayerDeath,
  onTrashmobDamage,
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
  // Track mouse position for continuous aim angle
  const mousePositionRef = useRef<{ x: number; y: number } | null>(null);
  const aimAngleRef = useRef<number>(0);

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

  // Use extracted keyboard input hook

  // Use footsteps audio hook
  const { updateFootsteps } = useFootsteps();
  const { keysRef } = useKeyboardInput({ eventTarget: config.eventTarget });

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

  // Use extracted treasure collection hook
  const { handleTreasureCollected } = useTreasureCollection({
    userId,
    playerRef,
    canvasRef,
    dungeonManagerRef,
    onXpGained,
    onTreasureCollected,
    onItemDropped
  });

  // Handle contact damage from trashmobs
  const handleContactDamage = useCallback((damage: number) => {
    playerRef.current.hp -= damage;
    if (playerRef.current.hp < 0) playerRef.current.hp = 0;
    onPlayerHpUpdate(playerRef.current.hp);

    // Trigger visual feedback
    if (onTrashmobDamage) {
      onTrashmobDamage();
    }

    // Check if player died from trashmob damage
    if (playerRef.current.hp <= 0 && onPlayerDeath) {
      onPlayerDeath();
    }
  }, [onPlayerHpUpdate, onPlayerDeath, onTrashmobDamage]);

  // Handle melee attack (called on mouse click)
  // Takes mouse coordinates to calculate attack direction toward cursor
  const handleAttack = useCallback((mouseX?: number, mouseY?: number) => {
    if (!dungeonManagerRef.current) return;
    if (inCombatRef.current) return;
    if (gamePausedRef.current) return;

    const engine = gameEngineRef.current;
    const manager = dungeonManagerRef.current;
    const canvas = canvasRef.current;

    let attackAngle: number | undefined;

    // Calculate attack angle toward cursor if mouse position provided
    if (mouseX !== undefined && mouseY !== undefined && canvas) {
      const rect = canvas.getBoundingClientRect();

      // Mouse position relative to canvas
      const canvasMouseX = mouseX - rect.left;
      const canvasMouseY = mouseY - rect.top;

      // Player center position on screen (camera centers on player)
      const playerScreenX = canvas.width / 2;
      const playerScreenY = canvas.height / 2;

      // Calculate angle from player to cursor
      const dx = canvasMouseX - playerScreenX;
      const dy = canvasMouseY - playerScreenY;
      attackAngle = Math.atan2(dy, dx);
    }

    const hits = engine.performAttack(
      playerRef.current,
      manager.trashmobs,
      manager.tileSize,
      attackAngle
    );

    // Remove dead trashmobs
    if (hits.length > 0) {
      manager.trashmobs = manager.trashmobs.filter(t => t.alive);
    }
  }, []);

  const update = (dt: number) => {
    if (isNaN(dt)) dt = 0;
    if (!dungeonManagerRef.current) return;

    const engine = gameEngineRef.current;
    const manager = dungeonManagerRef.current;

    // Update attack state (cooldown timer)
    engine.updateAttackState(dt);

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

    // Update trashmobs (AI and contact damage)
    if (!inCombatRef.current) {
      engine.updateTrashmobs({
        dt,
        trashmobs: manager.trashmobs,
        player: playerRef.current,
        tileSize: manager.tileSize,
        rooms: manager.rooms,
        dungeon: manager.dungeon,
        doorStates: manager.doorStates,
        onContactDamage: handleContactDamage
      });

      // Remove dead trashmobs
      manager.trashmobs = manager.trashmobs.filter(t => t.alive);
    }

    // Update footstep sounds
    if (!inCombatRef.current) {
      updateFootsteps(playerRef.current, manager.enemies, manager.tileSize);
    }
  };

  const render = () => {
    const canvas = canvasRef.current;
    const minimap = minimapRef.current;
    if (!canvas || !minimap || !dungeonManagerRef.current) return;

    const manager = dungeonManagerRef.current;

    if (manager.renderMap) {
      const engine = gameEngineRef.current;
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
        manager.darkTheme,
        manager.trashmobs,
        engine.isPlayerAttacking(),
        aimAngleRef.current
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
      let dt = (timestamp - lastTimeRef.current) / 1000;
      lastTimeRef.current = timestamp;

      // Cap dt to prevent entities moving through walls after alt+tab or window blur
      // Max 100ms (0.1s) per frame - if longer, game was paused/tabbed out
      const MAX_DT = 0.1;
      if (dt > MAX_DT) {
        dt = MAX_DT;
      }

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

    config.eventTarget.addEventListener('resize', handleResize);

    return () => {
      isMountedRef.current = false;
      config.eventTarget.removeEventListener('resize', handleResize);
      if (gameLoopIdRef.current) {
        config.scheduler.cancelFrame(gameLoopIdRef.current);
      }
    };
  }, [questionDatabase, availableSubjects, userId]);

  // Mouse move handler for continuous aim tracking
  useEffect(() => {
    const handleMouseMove = (e: Event) => {
      const mouseEvent = e as MouseEvent;
      const canvas = canvasRef.current;
      if (!canvas) return;

      const rect = canvas.getBoundingClientRect();

      // Mouse position relative to canvas
      const canvasMouseX = mouseEvent.clientX - rect.left;
      const canvasMouseY = mouseEvent.clientY - rect.top;

      // Player center position on screen (camera centers on player)
      const playerScreenX = canvas.width / 2;
      const playerScreenY = canvas.height / 2;

      // Calculate angle from player to cursor
      const dx = canvasMouseX - playerScreenX;
      const dy = canvasMouseY - playerScreenY;
      aimAngleRef.current = Math.atan2(dy, dx);

      mousePositionRef.current = { x: mouseEvent.clientX, y: mouseEvent.clientY };
    };

    config.eventTarget.addEventListener('mousemove', handleMouseMove);

    return () => {
      config.eventTarget.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);

  // Mouse click handler for melee attack
  useEffect(() => {
    const handleMouseDown = (e: Event) => {
      // Left mouse button only
      const mouseEvent = e as MouseEvent;
      if (mouseEvent.button === 0) {
        // Use the continuously tracked aim angle
        handleAttack(mouseEvent.clientX, mouseEvent.clientY);
      }
    };

    config.eventTarget.addEventListener('mousedown', handleMouseDown);

    return () => {
      config.eventTarget.removeEventListener('mousedown', handleMouseDown);
    };
  }, [handleAttack]);

  return {
    canvasRef,
    minimapRef,
    gameInitialized,
    gamePausedRef,
    playerRef,
    generateNewDungeon,
    dungeonManagerRef,
    handleAttack
  };
}
