'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import type { QuestionDatabase } from '@/lib/questions';
import { PLAYER_MAX_HP, DIRECTION, INITIAL_PLAYER_BUFFS } from '@/lib/constants';
import type { Player } from '@/lib/enemy';
import type { Shrine } from '@/lib/constants';
import LoginModal from './LoginModal';
import SkillDashboard from './SkillDashboard';
import CharacterPanel from './CharacterPanel';
import CombatModal from './CombatModal';
import VictoryOverlay from './VictoryOverlay';
import DefeatOverlay from './DefeatOverlay';
import DamageFlash from './DamageFlash';
import FloatingXpBubble from './FloatingXpBubble';
import InventoryModal, { Equipment, Item, EquipmentSlot } from './InventoryModal';
import ItemDropNotification from './ItemDropNotification';
import type { DroppedItem, ItemDefinition } from '@/lib/items';
import { calculateEquipmentBonuses } from '@/lib/items';
import { useAuth } from '@/hooks/useAuth';
import { useScoring } from '@/hooks/useScoring';
import { useCombat } from '@/hooks/useCombat';
import { useGameState } from '@/hooks/useGameState';
import { useCombo } from '@/hooks/useCombo';
import { useShrine } from '@/hooks/useShrine';
import { spawnShrineEnemies, type ShrineSpawnContext } from '@/lib/game/EntitySpawner';
import ComboDisplay from './ComboDisplay';
import ShrineBuffModal from './ShrineBuffModal';
import PauseMenu from './PauseMenu';
import OptionsMenu from './OptionsMenu';
import { getLevelInfo } from '@/lib/scoring/LevelCalculator';
import { api } from '@/lib/api';
import { COLORS } from '@/lib/ui/colors';
import { selectRandomBuffs, applyBuff, resetPlayerBuffs, resetRegenTimer } from '@/lib/buff';
import type { Buff } from '@/lib/constants';
import { useAudioSettings } from '@/hooks/useAudioSettings';
import { getFootstepManager } from '@/lib/audio';

export default function GameCanvas() {
  const [questionDatabase, setQuestionDatabase] = useState<QuestionDatabase | null>(null);
  const [availableSubjects, setAvailableSubjects] = useState<string[]>([]);
  const [showSkillDashboard, setShowSkillDashboard] = useState(false);
  const [showInventory, setShowInventory] = useState(false);
  const [playerHp, setPlayerHp] = useState(PLAYER_MAX_HP);
  const [treasureBubbles, setTreasureBubbles] = useState<Array<{ id: number; x: number; y: number; xp: number }>>([]);

  // Session stats for highscore tracking
  const [sessionEnemiesDefeated, setSessionEnemiesDefeated] = useState(0);
  const [sessionXpGained, setSessionXpGained] = useState(0);
  const sessionStartTimeRef = useRef<number>(Date.now());

  // Inventory system
  const [equipment, setEquipment] = useState<Equipment>({
    helm: null,
    brustplatte: null,
    schwert: null,
    schild: null,
    hose: null,
    schuhe: null,
  });
  const [inventory, setInventory] = useState<Item[]>([]);

  // Item drop notifications
  const [itemDropNotification, setItemDropNotification] = useState<{ item: ItemDefinition; id: string } | null>(null);

  // Shrine buff selection
  const [showBuffSelection, setShowBuffSelection] = useState(false);
  const [buffChoices, setBuffChoices] = useState<Buff[]>([]);
  const [showPauseMenu, setShowPauseMenu] = useState(false);
  const [showOptionsMenu, setShowOptionsMenu] = useState(false);

  // Game state
  const [gameStarted, setGameStarted] = useState(false);

  // Damage flash trigger (incremented each time player takes trashmob damage)
  const [damageFlashTrigger, setDamageFlashTrigger] = useState(0);

  // Audio settings
  const audioSettings = useAudioSettings();

  // Background music ref
  const bgMusicRef = useRef<HTMLAudioElement | null>(null);

  // Auth (includes XP state)
  const { userId, username, userXp, setUserXp, showLogin, handleLogin, handleLogout } = useAuth();

  // Scoring
  const { sessionScores, loadSessionElos, updateSessionScores } = useScoring(userId);

  // Track combat state for combo timer slowdown (synced via useEffect below)
  const [isInCombatForCombo, setIsInCombatForCombo] = useState(false);

  // Combo system - tracks consecutive enemy defeats
  // Timer slows down by 50% during combat
  const combo = useCombo({ inCombat: isInCombatForCombo });

  // Load questions and subjects
  useEffect(() => {
    const loadData = async () => {
      try {
        const [questions, subjects] = await Promise.all([
          api.questions.getAllQuestions(),
          api.questions.getSubjects()
        ]);

        setQuestionDatabase(questions);
        setAvailableSubjects(subjects);
      } catch (error) {
        console.error('Error loading game data:', error);
      }
    };

    loadData();
  }, []);

  // Load session ELOs when user logs in (XP is handled by useAuth)
  useEffect(() => {
    if (userId) {
      loadSessionElos(userId);
    }
  }, [userId]);

  // Start game automatically when user is logged in
  useEffect(() => {
    if (userId && !showLogin && !gameStarted) {
      setGameStarted(true);
    }
  }, [userId, showLogin, gameStarted]);

  // Background music state
  const musicTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const musicStopTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const musicStartedRef = useRef(false);
  const musicDurationRef = useRef(0);

  // Music clip configuration: each clip is ~98 seconds (1:38)
  const CLIP_DURATION = 98; // seconds
  const PAUSE_MIN = 90000; // 90 seconds
  const PAUSE_MAX = 120000; // 120 seconds

  // Play a random segment of the music
  const playRandomClip = () => {
    if (!bgMusicRef.current || musicDurationRef.current === 0) return;

    const totalDuration = musicDurationRef.current;
    const numClips = Math.floor(totalDuration / CLIP_DURATION);
    const clipIndex = Math.floor(Math.random() * numClips);
    const startTime = clipIndex * CLIP_DURATION;

    console.log(`Playing clip ${clipIndex + 1}/${numClips} (${Math.round(startTime)}s - ${Math.round(startTime + CLIP_DURATION)}s)`);

    bgMusicRef.current.currentTime = startTime;
    bgMusicRef.current.play().catch(err => {
      console.error('Music play failed:', err);
    });

    // Stop after CLIP_DURATION and schedule next clip
    musicStopTimeoutRef.current = setTimeout(() => {
      if (bgMusicRef.current) {
        bgMusicRef.current.pause();
        scheduleNextClip();
      }
    }, CLIP_DURATION * 1000);
  };

  // Schedule the next clip after a random pause
  const scheduleNextClip = () => {
    const pauseTime = PAUSE_MIN + Math.random() * (PAUSE_MAX - PAUSE_MIN);
    console.log(`Next clip in ${Math.round(pauseTime / 1000)}s`);
    musicTimeoutRef.current = setTimeout(playRandomClip, pauseTime);
  };

  // Initialize background music (but don't play yet - needs user interaction)
  useEffect(() => {
    if (userId && !bgMusicRef.current) {
      const audio = new Audio('/Assets/Sound/Into%20the%20Abyss.mp3');
      audio.loop = false;
      // Initial volume will be set by audio settings effect
      audio.volume = 0.07 * audioSettings.effectiveMusicVolume;
      bgMusicRef.current = audio;

      // Get duration when metadata is loaded
      audio.addEventListener('loadedmetadata', () => {
        musicDurationRef.current = audio.duration;
        console.log(`Music loaded: ${Math.round(audio.duration)}s total, ${Math.floor(audio.duration / CLIP_DURATION)} clips`);
      });
    }

    // Cleanup on unmount or logout
    return () => {
      if (musicTimeoutRef.current) clearTimeout(musicTimeoutRef.current);
      if (musicStopTimeoutRef.current) clearTimeout(musicStopTimeoutRef.current);
      if (bgMusicRef.current) {
        bgMusicRef.current.pause();
        bgMusicRef.current = null;
      }
      musicStartedRef.current = false;
      musicDurationRef.current = 0;
    };
  }, [userId]);

  // Start music on first user interaction (keyboard/mouse)
  useEffect(() => {
    const startMusic = () => {
      if (bgMusicRef.current && !musicStartedRef.current) {
        musicStartedRef.current = true;
        // Small initial delay then play first clip
        const initialDelay = 2000 + Math.random() * 5000; // 2-7 seconds
        console.log(`Music system starting in ${Math.round(initialDelay / 1000)}s`);
        musicTimeoutRef.current = setTimeout(playRandomClip, initialDelay);
      }
    };

    if (userId) {
      window.addEventListener('keydown', startMusic, { once: true });
      window.addEventListener('click', startMusic, { once: true });
    }

    return () => {
      window.removeEventListener('keydown', startMusic);
      window.removeEventListener('click', startMusic);
    };
  }, [userId]);

  // Update audio volumes when settings change
  useEffect(() => {
    // Update music volume (base volume 0.07 * effective volume)
    if (bgMusicRef.current) {
      bgMusicRef.current.volume = 0.07 * audioSettings.effectiveMusicVolume;
    }

    // Update SFX volume (footsteps)
    const footstepManager = getFootstepManager();
    footstepManager.setVolumeMultiplier(audioSettings.effectiveSfxVolume);
  }, [audioSettings.effectiveMusicVolume, audioSettings.effectiveSfxVolume]);

  const handleXpGained = (amount: number) => {
    setUserXp(prev => prev + amount);
    setSessionXpGained(prev => prev + amount);
  };

  // Track enemy defeats for session stats
  const handleEnemyDefeated = useCallback(() => {
    setSessionEnemiesDefeated(prev => prev + 1);
  }, []);

  // Reset session stats when starting a new game
  const resetSessionStats = useCallback(() => {
    setSessionEnemiesDefeated(0);
    setSessionXpGained(0);
    sessionStartTimeRef.current = Date.now();
  }, []);

  const handleTreasureCollected = (screenX: number, screenY: number, xpAmount: number) => {
    const bubbleId = Date.now() + Math.random();
    setTreasureBubbles(prev => [...prev, { id: bubbleId, x: screenX, y: screenY, xp: xpAmount }]);
  };

  const removeTreasureBubble = (id: number) => {
    setTreasureBubbles(prev => prev.filter(b => b.id !== id));
  };

  // Ref to store pending item drops (before gameState is ready)
  const pendingItemDropRef = useRef<DroppedItem | null>(null);

  // Handle item drop from enemy
  const handleItemDropped = (droppedItem: DroppedItem) => {
    // Store for later if dungeonManager not ready
    pendingItemDropRef.current = droppedItem;

    // Use the complete item definition (Item is just an alias for ItemDefinition)
    const inventoryItem: Item = droppedItem.item;

    // Add directly to inventory
    setInventory(prev => [...prev, inventoryItem]);

    // Show notification
    setItemDropNotification({ item: droppedItem.item, id: droppedItem.id });

    // Auto-hide notification after 3 seconds
    setTimeout(() => {
      setItemDropNotification(prev => prev?.id === droppedItem.id ? null : prev);
    }, 3000);
  };

  // Handle equipping an item from inventory
  const handleEquipItem = (item: Item) => {
    const slot = item.slot;

    // If something is already equipped, move it to inventory
    const currentlyEquipped = equipment[slot];

    setEquipment(prev => ({
      ...prev,
      [slot]: item,
    }));

    // Remove from inventory and add old item if exists
    setInventory(prev => {
      const filtered = prev.filter(i => i.id !== item.id);
      if (currentlyEquipped) {
        return [...filtered, currentlyEquipped];
      }
      return filtered;
    });
  };

  // Handle unequipping an item
  const handleUnequipItem = (slot: EquipmentSlot) => {
    const item = equipment[slot];
    if (!item) return;

    // Move to inventory
    setInventory(prev => [...prev, item]);

    // Clear the slot
    setEquipment(prev => ({
      ...prev,
      [slot]: null,
    }));
  };

  // Shared player reference (owned by GameCanvas, used by both hooks)
  const playerRef = useRef<Player>({
    x: 0,
    y: 0,
    width: 0,
    height: 0,
    direction: DIRECTION.DOWN,
    isMoving: false,
    hp: PLAYER_MAX_HP,
    maxHp: PLAYER_MAX_HP,
    buffs: { ...INITIAL_PLAYER_BUFFS }
  });

  // Calculate equipment bonuses whenever equipment changes
  const equipmentBonuses = calculateEquipmentBonuses(equipment);

  // Ref to hold shrine enemy defeated callback (set after gameState is initialized)
  const shrineEnemyDefeatedRef = useRef<((enemyId: number, shrineId: number) => void) | null>(null);

  // Update player maxHp when equipment changes
  useEffect(() => {
    const newMaxHp = PLAYER_MAX_HP + equipmentBonuses.maxHpBonus;
    playerRef.current.maxHp = newMaxHp;
    // If current HP exceeds new max, clamp it
    if (playerRef.current.hp > newMaxHp) {
      playerRef.current.hp = newMaxHp;
      setPlayerHp(newMaxHp);
    }
  }, [equipmentBonuses.maxHpBonus]);

  // Combat - initialized first so we have inCombatRef and startCombat
  // Note: onShrineEnemyDefeated uses ref pattern because the handler needs gameState
  const combat = useCombat({
    questionDatabase,
    userId,
    playerRef,
    onUpdateSessionScores: updateSessionScores,
    onPlayerHpUpdate: setPlayerHp,
    onGameRestart: () => {
      combo.resetCombo();
      combo.resetMaxCombo();
      resetPlayerBuffs(playerRef.current);
      resetRegenTimer();
      resetSessionStats();
      gameState.generateNewDungeon();
    },
    onXpGained: handleXpGained,
    onItemDropped: handleItemDropped,
    onEnemyDefeated: handleEnemyDefeated,
    onEnemyDefeatedFlawless: combo.incrementCombo,
    onComboBreak: combo.resetCombo,
    onShrineEnemyDefeated: (enemyId, shrineId) => {
      shrineEnemyDefeatedRef.current?.(enemyId, shrineId);
    },
    equipmentBonuses,
    comboBonus: combo.damageBonus,
    tileSize: 64
  });

  // Sync combat state to combo hook for timer slowdown
  useEffect(() => {
    setIsInCombatForCombo(combat.inCombat);
  }, [combat.inCombat]);

  // Handler for trashmob damage visual feedback
  const handleTrashmobDamage = () => {
    setDamageFlashTrigger(prev => prev + 1);
  };

  // Game state - receives combat refs via props
  const gameState = useGameState({
    questionDatabase,
    availableSubjects,
    userId,
    gameStarted,
    onPlayerHpUpdate: setPlayerHp,
    onXpGained: handleXpGained,
    onTreasureCollected: handleTreasureCollected,
    onItemDropped: handleItemDropped,
    inCombatRef: combat.inCombatRef,
    onStartCombat: combat.startCombat,
    onPlayerDeath: combat.triggerDefeat,
    onTrashmobDamage: handleTrashmobDamage,
    playerRef
  });
// Handle shrine enemy defeated - tracks progress toward shrine completion
  const handleShrineEnemyDefeated = useCallback((enemyId: number, shrineId: number) => {
    const manager = gameState.dungeonManagerRef.current;
    if (!manager) return;

    // Find the shrine
    const shrine = manager.shrines.find(s => s.id === shrineId);
    if (!shrine) {
      console.error('[GameCanvas] Shrine not found:', shrineId);
      return;
    }

    // Track defeated enemy
    if (!shrine.defeatedEnemies.includes(enemyId)) {
      shrine.defeatedEnemies.push(enemyId);
      console.log(`[GameCanvas] Shrine ${shrineId} enemy defeated: ${enemyId}. Progress: ${shrine.defeatedEnemies.length}/${shrine.spawnedEnemies.length}`);
    }

    // Check if all shrine enemies are defeated
    if (shrine.defeatedEnemies.length >= shrine.spawnedEnemies.length) {
      console.log(`[GameCanvas] Shrine ${shrineId} combat complete! All enemies defeated.`);
      shrine.isActive = false;
      shrine.isActivated = true;

      // Show buff selection menu
      const buffs = selectRandomBuffs(2);
      setBuffChoices(buffs);
      setShowBuffSelection(true);
      gameState.gamePausedRef.current = true;
    }
  }, [gameState.dungeonManagerRef, gameState.gamePausedRef]);

  // Handle shrine activation - spawn enemies
  const handleShrineActivated = useCallback(async (shrine: Shrine) => {
    console.log('[GameCanvas] Shrine activated! ID:', shrine.id, 'Room:', shrine.roomId);

    const manager = gameState.dungeonManagerRef.current;
    if (!manager) {
      console.error('[GameCanvas] DungeonManager not available');
      return;
    }

    // Calculate rooms explored
    const roomsExplored = manager.rooms.filter(r => r.visible).length;
    const totalRooms = manager.rooms.length;

    // Calculate player's average ELO across subjects
    let playerAverageElo = 5; // Default
    if (sessionScores && sessionScores.length > 0) {
      const eloValues = sessionScores.map(s => s.currentElo).filter(e => e > 0);
      if (eloValues.length > 0) {
        playerAverageElo = eloValues.reduce((a, b) => a + b, 0) / eloValues.length;
      }
    }

    // Get player tile position
    const playerTileX = Math.floor((playerRef.current.x + manager.tileSize / 2) / manager.tileSize);
    const playerTileY = Math.floor((playerRef.current.y + manager.tileSize / 2) / manager.tileSize);

    // Create spawn context
    const spawnContext: ShrineSpawnContext = {
      dungeon: manager.dungeon,
      rooms: manager.rooms,
      roomMap: manager.roomMap,
      dungeonWidth: manager.dungeon[0]?.length || 0,
      dungeonHeight: manager.dungeon.length,
      tileSize: manager.tileSize,
      shrine,
      playerX: playerTileX,
      playerY: playerTileY,
      availableSubjects,
      playerAverageElo,
      roomsExplored,
      totalRooms
    };

    // Spawn enemies
    try {
      const shrineEnemies = await spawnShrineEnemies(spawnContext);

      // Track spawned enemy IDs in shrine
      shrine.spawnedEnemies = shrineEnemies.map(e => e.id);
      shrine.defeatedEnemies = [];

      // Add to dungeon manager's enemies
      manager.enemies.push(...shrineEnemies);

      console.log(`[GameCanvas] Spawned ${shrineEnemies.length} shrine enemies:`, shrine.spawnedEnemies);
    } catch (error) {
      console.error('[GameCanvas] Failed to spawn shrine enemies:', error);
      shrine.isActive = false;
    }
  }, [gameState.dungeonManagerRef, availableSubjects, sessionScores, playerRef]);

  // Update the shrine enemy defeated ref after handler is ready
  useEffect(() => {
    shrineEnemyDefeatedRef.current = handleShrineEnemyDefeated;
  }, [handleShrineEnemyDefeated]);

  // Shrine interaction
  const shrineHook = useShrine({
    playerRef,
    dungeonManagerRef: gameState.dungeonManagerRef,
    inCombatRef: combat.inCombatRef,
    gamePausedRef: gameState.gamePausedRef,
    onShrineActivated: handleShrineActivated
  });

  // Update shrine proximity periodically
  useEffect(() => {
    const interval = setInterval(() => {
      shrineHook.updateProximity();
    }, 100);
    return () => clearInterval(interval);
  }, [shrineHook.updateProximity]);

  // Handle canvas click for shrine interaction
  const handleCanvasClick = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = gameState.canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const canvasX = e.clientX - rect.left;
    const canvasY = e.clientY - rect.top;
    shrineHook.handleCanvasClick(canvasX, canvasY, canvas.width, canvas.height);
  }, [shrineHook.handleCanvasClick, gameState.canvasRef]);

  const handleOpenSkills = () => {
    gameState.gamePausedRef.current = true;
    setShowSkillDashboard(true);
  };

  const handleCloseSkills = () => {
    gameState.gamePausedRef.current = false;
    setShowSkillDashboard(false);
  };

  const handleOpenInventory = () => {
    gameState.gamePausedRef.current = true;
    setShowInventory(true);
  };

  const handleCloseInventory = () => {
    gameState.gamePausedRef.current = false;
    setShowInventory(false);
  };

  // Pause menu handlers
  const handleOpenPauseMenu = () => {
    gameState.gamePausedRef.current = true;
    setShowPauseMenu(true);
  };

  const handleClosePauseMenu = () => {
    gameState.gamePausedRef.current = false;
    setShowPauseMenu(false);
  };

  const handlePauseMenuRestart = () => {
    setShowPauseMenu(false);
    combo.resetCombo();
    combo.resetMaxCombo();
    resetPlayerBuffs(playerRef.current);
    resetRegenTimer();
    resetSessionStats();
    gameState.generateNewDungeon();
    gameState.gamePausedRef.current = false;
  };

  const handlePauseMenuMainMenu = () => {
    setShowPauseMenu(false);
    gameState.gamePausedRef.current = false;
    setGameStarted(false);
    handleLogout();
  };

  const handlePauseMenuOptions = () => {
    setShowPauseMenu(false);
    setShowOptionsMenu(true);
  };

  const handleOptionsBack = () => {
    setShowOptionsMenu(false);
    setShowPauseMenu(true);
  };

  // Handle game restart - resets combo, buffs, session stats, and generates new dungeon
  const handleRestart = () => {
    combo.resetCombo();
    combo.resetMaxCombo();
    resetPlayerBuffs(playerRef.current);
    resetRegenTimer();
    resetSessionStats();
    gameState.generateNewDungeon();
  };

  // Handle buff selection from shrine
  const handleBuffSelected = useCallback((buff: Buff) => {
    console.log('[GameCanvas] Buff selected:', buff.name);
    applyBuff(playerRef.current, buff);
    setShowBuffSelection(false);
    setBuffChoices([]);
    gameState.gamePausedRef.current = false;

    // Update HP display if HP was boosted
    if (buff.type === 'hp_boost') {
      setPlayerHp(playerRef.current.hp);
    }
  }, [playerRef, gameState.gamePausedRef]);

  // Keyboard handler for inventory (I key) and pause menu (ESC)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Inventory toggle with I key
      if (e.key.toLowerCase() === 'i' && !showLogin && !combat.inCombat && !showPauseMenu && !showOptionsMenu) {
        if (showInventory) {
          handleCloseInventory();
        } else {
          // Close other modals first
          if (showSkillDashboard) handleCloseSkills();
          handleOpenInventory();
        }
      }

      // ESC key handling
      if (e.key === 'Escape' && !showLogin) {
        // Close modals in priority order
        if (showOptionsMenu) {
          // Go back to pause menu from options
          handleOptionsBack();
        } else if (showInventory) {
          handleCloseInventory();
        } else if (showSkillDashboard) {
          handleCloseSkills();
        } else if (showPauseMenu) {
          // Close pause menu
          handleClosePauseMenu();
        } else if (!combat.inCombat && !showBuffSelection) {
          // Open pause menu (only when not in combat or buff selection)
          handleOpenPauseMenu();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showInventory, showLogin, showSkillDashboard, combat.inCombat, showPauseMenu, showBuffSelection, showOptionsMenu]);

  const handleLoginWithElo = async (id: number, name: string, xp?: number) => {
    await handleLogin(id, name, xp);
    await loadSessionElos(id);
    // Game starts automatically via useEffect when userId is set
  };

  // Calculate level info from current XP
  const levelInfo = getLevelInfo(userXp);

  return (
    <>
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Rajdhani:wght@300;400;500;600;700&display=swap');

        body {
          margin: 0;
          padding: 0;
          overflow: hidden;
          background-color: #000000;
          font-family: 'Rajdhani', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', sans-serif;
        }

        * {
          font-family: 'Rajdhani', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', sans-serif;
        }
      `}</style>

      {showLogin && <LoginModal onLogin={handleLoginWithElo} />}

      {!questionDatabase && !showLogin && gameStarted && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          backgroundColor: '#000000',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          color: 'white',
          fontSize: '24px',
          zIndex: 9999
        }}>
          Loading questions...
        </div>
      )}

      <div style={{ position: 'relative', width: '100vw', height: '100vh', backgroundColor: '#000000' }}>
        {username && gameStarted && (
          <CharacterPanel
            username={username}
            scores={sessionScores}
            level={levelInfo.level}
            currentXp={levelInfo.currentXp}
            xpForCurrentLevel={levelInfo.xpForCurrentLevel}
            xpForNextLevel={levelInfo.xpForNextLevel}
            currentHp={playerHp}
            maxHp={playerRef.current.maxHp}
            onLogout={handleLogout}
            onRestart={handleRestart}
            onSkills={handleOpenSkills}
          />
        )}

        {gameStarted && (
          <>
            <canvas
              ref={gameState.canvasRef}
              onClick={handleCanvasClick}
              style={{
                display: 'block',
                imageRendering: 'pixelated'
              } as React.CSSProperties}
            />

            <canvas
              ref={gameState.minimapRef}
              width={200}
              height={200}
              style={{
                position: 'absolute',
                top: '10px',
                right: '10px',
                border: `3px solid ${COLORS.success}`,
                borderRadius: '4px',
                backgroundColor: 'rgba(0, 0, 0, 0.7)',
                zIndex: 100,
                imageRendering: 'pixelated'
              } as React.CSSProperties}
            />
          </>
        )}

        {/* Shrine Interaction Hint */}
        {gameStarted && shrineHook.proximityState.isInRange && shrineHook.proximityState.nearestShrine && !combat.inCombat && (
          <div style={{
            position: 'fixed',
            bottom: '100px',
            left: '50%',
            transform: 'translateX(-50%)',
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            border: '2px solid #ffd700',
            borderRadius: '8px',
            padding: '12px 24px',
            color: '#ffd700',
            fontSize: '18px',
            fontWeight: 'bold',
            zIndex: 200,
            textShadow: '0 0 10px rgba(255, 215, 0, 0.5)'
          }}>
            [E] Schrein aktivieren
          </div>
        )}
        {combat.inCombat && (
          <CombatModal
            combatSubject={combat.combatSubject}
            playerHp={playerHp}
            enemyHp={combat.enemyHp}
            currentEnemy={combat.currentEnemyRef.current}
            combatTimer={combat.combatTimer}
            combatQuestion={combat.combatQuestion}
            combatFeedback={combat.combatFeedback}
            onAnswerQuestion={combat.answerQuestion}
            hintedAnswerIndex={combat.hintedAnswerIndex}
            player={playerRef.current}
            dungeon={gameState.dungeonManagerRef.current?.dungeon}
            roomMap={gameState.dungeonManagerRef.current?.roomMap}
            rooms={gameState.dungeonManagerRef.current?.rooms}
            renderMap={gameState.dungeonManagerRef.current?.renderMap}
            doorStates={gameState.dungeonManagerRef.current?.doorStates}
            darkTheme={gameState.dungeonManagerRef.current?.darkTheme}
            tileSize={gameState.dungeonManagerRef.current?.tileSize}
          />
        )}

        {showSkillDashboard && userId && (
          <SkillDashboard userId={userId} onClose={handleCloseSkills} />
        )}

        {/* Inventory Modal */}
        {showInventory && (
          <InventoryModal
            onClose={handleCloseInventory}
            equipment={equipment}
            inventory={inventory}
            onEquip={handleEquipItem}
            onUnequip={handleUnequipItem}
          />
        )}

        {/* Victory Overlay */}
        {combat.showVictory && (
          <VictoryOverlay
            xpGained={combat.victoryXp}
            onComplete={combat.handleVictoryComplete}
          />
        )}

        {/* Defeat Overlay */}
        {combat.showDefeat && (
          <DefeatOverlay
            onRestart={combat.handleDefeatRestart}
            userId={userId}
            stats={{
              enemiesDefeated: sessionEnemiesDefeated,
              roomsExplored: gameState.dungeonManagerRef.current?.rooms.filter(r => r.visible).length ?? 0,
              xpGained: sessionXpGained,
              maxCombo: combo.maxCombo,
              playTimeSeconds: Math.floor((Date.now() - sessionStartTimeRef.current) / 1000)
            }}
          />
        )}

        {/* Damage Flash (trashmob damage) */}
        <DamageFlash trigger={damageFlashTrigger} />

        {/* Treasure XP Bubbles */}
        {treasureBubbles.map(bubble => (
          <FloatingXpBubble
            key={bubble.id}
            xp={bubble.xp}
            x={bubble.x}
            y={bubble.y}
            onComplete={() => removeTreasureBubble(bubble.id)}
          />
        ))}

        {/* Item Drop Notification */}
        {itemDropNotification && (
          <ItemDropNotification
            key={itemDropNotification.id}
            item={itemDropNotification.item}
            onComplete={() => setItemDropNotification(null)}
          />
        )}

        {/* Combo Display - shows when 3+ enemies defeated flawlessly in a row */}
        <ComboDisplay
          count={combo.count}
          tier={combo.tier}
          isActive={combo.isActive}
          damageBonus={combo.damageBonus}
          timeRemaining={combo.timeRemaining}
          timerDuration={combo.timerDuration}
        />

        {/* Shrine Buff Selection Modal */}
        {showBuffSelection && buffChoices.length > 0 && (
          <ShrineBuffModal
            buffs={buffChoices}
            onSelectBuff={handleBuffSelected}
          />
        )}

        {/* Pause Menu */}
        {showPauseMenu && (
          <PauseMenu
            onResume={handleClosePauseMenu}
            onOptions={handlePauseMenuOptions}
            onRestart={handlePauseMenuRestart}
            onMainMenu={handlePauseMenuMainMenu}
          />
        )}

        {/* Options Menu */}
        {showOptionsMenu && (
          <OptionsMenu
            settings={audioSettings.settings}
            onMasterVolumeChange={audioSettings.setMasterVolume}
            onMusicVolumeChange={audioSettings.setMusicVolume}
            onSfxVolumeChange={audioSettings.setSfxVolume}
            onBack={handleOptionsBack}
          />
        )}
      </div>
    </>
  );
}
