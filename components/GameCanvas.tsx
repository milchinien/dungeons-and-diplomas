'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import type { QuestionDatabase } from '@/lib/questions';
import { PLAYER_MAX_HP, DIRECTION, INITIAL_PLAYER_BUFFS } from '@/lib/constants';
import type { Player } from '@/lib/enemy';
import type { Shrine } from '@/lib/constants';
import MainMenu from './MainMenu';
import LoginModal from './LoginModal';
import SkillDashboard from './SkillDashboard';
import CombatModal from './CombatModal';
import { TopLeftPanel } from './hud/TopLeftPanel';
import { BottomCenterBar } from './hud/BottomCenterBar';
import { TopRightPanel } from './hud/TopRightPanel';
import VictoryOverlay from './VictoryOverlay';
import DefeatOverlay from './DefeatOverlay';
import DamageFlash from './DamageFlash';
import FloatingXpBubble from './FloatingXpBubble';
import InventoryModal, { Equipment, Item, EquipmentSlot } from './InventoryModal';
import ItemDropNotification from './ItemDropNotification';
import SkillTreeModal from './SkillTreeModal';
import type { DroppedItem, ItemDefinition } from '@/lib/items';
import { calculateCombinedBonuses, calculateEquipmentBonuses } from '@/lib/items';
import type { UserSkill } from '@/lib/skills/types';
import { useAuth } from '@/hooks/useAuth';
import { useScoring } from '@/hooks/useScoring';
import { useCombat } from '@/hooks/useCombat';
import { useGameState } from '@/hooks/useGameState';
import { useCombo } from '@/hooks/useCombo';
import { useShrine } from '@/hooks/useShrine';
import { useShopPurchase } from '@/hooks/useShopPurchase';
import { spawnShrineEnemies, type ShrineSpawnContext } from '@/lib/game/EntitySpawner';
import ComboDisplay from './ComboDisplay';
import ShrineBuffModal from './ShrineBuffModal';
import ShopConfirmModal from './ShopConfirmModal';
import PauseMenu from './PauseMenu';
import OptionsMenu from './OptionsMenu';
import CheatModal from './CheatModal';
import { useCheatSystem } from '@/hooks/useCheatSystem';
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
  const [showSkillTree, setShowSkillTree] = useState(false);
  const [playerHp, setPlayerHp] = useState(PLAYER_MAX_HP);
  const [playerShield, setPlayerShield] = useState(0);
  const [maxShield, setMaxShield] = useState(0);
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
  const [showMainMenu, setShowMainMenu] = useState(false); // Don't show main menu until after login
  const [showLoginForPlay, setShowLoginForPlay] = useState(false);
  const [loginAction, setLoginAction] = useState<'play' | 'progress' | null>(null);

  // Damage flash trigger (incremented each time player takes trashmob damage)
  const [damageFlashTrigger, setDamageFlashTrigger] = useState(0);

  // Audio settings
  const audioSettings = useAudioSettings();

  // Background music ref
  const bgMusicRef = useRef<HTMLAudioElement | null>(null);

  // Auth (includes XP state)
  const { userId, username, userXp, setUserXp, showLogin, handleLogin, handleLogout } = useAuth();

  // User skills state
  const [userSkills, setUserSkills] = useState<UserSkill[]>([]);
  const [skillPointsAvailable, setSkillPointsAvailable] = useState(0);

  // Scoring
  const { sessionScores, loadSessionElos, updateSessionScores } = useScoring(userId);

  // Gold tracking
  const [currentGold, setCurrentGold] = useState(0);

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

  // No auto-start - user must click "Spielen" in MainMenu

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

  const handleXpGained = async (amount: number) => {
    if (!userId) return;

    // Update local state immediately for responsive UI
    setUserXp(prev => prev + amount);
    setSessionXpGained(prev => prev + amount);

    // Call API to check for level-up and award skill points
    try {
      const response = await fetch('/api/xp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: userId,
          xp_amount: amount,
          reason: 'combat_victory',
        }),
      });

      if (response.ok) {
        const data = await response.json();

        // Update XP from server (should match local state)
        if (data.user?.xp !== undefined) {
          setUserXp(data.user.xp);
        }

        // If player leveled up, update skill points
        if (data.leveledUp && data.skillPointsAvailable !== undefined) {
          setSkillPointsAvailable(data.skillPointsAvailable);
          console.log(`🎉 Level Up! Neues Level: ${data.newLevel}, Verfügbare Skill Points: ${data.skillPointsAvailable}`);
        }
      }
    } catch (error) {
      console.error('Failed to award XP:', error);
    }
  };

  // Handle gold gained from combat/other sources
  const handleGoldGained = useCallback((amount: number) => {
    setCurrentGold(prev => {
      const newGold = prev + amount;
      console.log(`[GameCanvas] Gold gained: +${amount}. New balance: ${newGold}`);
      return newGold;
    });
  }, []);

  // Handle gold changes (from shop purchases or other sources)
  const handleGoldChange = useCallback((newGold: number) => {
    setCurrentGold(newGold);
    // Note: Only log on significant changes to avoid spam
  }, []);

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

  // Calculate combined bonuses from equipment AND skills
  const combinedBonuses = calculateCombinedBonuses(equipment, userSkills);

  // Keep legacy equipmentBonuses for backwards compatibility
  const equipmentBonuses = calculateEquipmentBonuses(equipment);

  // Ref to hold shrine enemy defeated callback (set after gameState is initialized)
  const shrineEnemyDefeatedRef = useRef<((enemyId: number, shrineId: number) => void) | null>(null);

  // Update player maxHp when equipment or skills change
  useEffect(() => {
    const newMaxHp = PLAYER_MAX_HP + combinedBonuses.maxHpBonus;
    const oldMaxHp = playerRef.current.maxHp;
    playerRef.current.maxHp = newMaxHp;

    // If maxHp increased and player was at full health, keep them at full health
    // This ensures that on first load with constitution skill, player starts at full HP
    if (newMaxHp > oldMaxHp && playerRef.current.hp === oldMaxHp) {
      playerRef.current.hp = newMaxHp;
      setPlayerHp(newMaxHp);
    }
    // If current HP exceeds new max, clamp it
    else if (playerRef.current.hp > newMaxHp) {
      playerRef.current.hp = newMaxHp;
      setPlayerHp(newMaxHp);
    }
  }, [combinedBonuses.maxHpBonus]);

  // Apply skill bonuses to player buffs (shield, regen)
  useEffect(() => {
    if (!playerRef.current.buffs) return;

    // Shield from skills
    if (combinedBonuses.shieldMaxBonus > 0) {
      playerRef.current.buffs.hasShield = true;
      playerRef.current.buffs.maxShield = combinedBonuses.shieldMaxBonus;
      // Only set currentShield if it's not already set (first load)
      if (playerRef.current.buffs.currentShield === 0) {
        playerRef.current.buffs.currentShield = combinedBonuses.shieldMaxBonus;
      }
      playerRef.current.buffs.shieldRegenRate = combinedBonuses.shieldRegenBonus;

      // Update React state for UI
      setMaxShield(combinedBonuses.shieldMaxBonus);
      setPlayerShield(Math.floor(playerRef.current.buffs.currentShield));
    }

    // HP regen from skills
    if (combinedBonuses.hpRegenBonus > 0) {
      playerRef.current.buffs.regenRate = combinedBonuses.hpRegenBonus;
    }
  }, [combinedBonuses.shieldMaxBonus, combinedBonuses.shieldRegenBonus, combinedBonuses.hpRegenBonus]);

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

      // Restore maxHp from skill/equipment bonuses BEFORE generating dungeon
      const newMaxHp = PLAYER_MAX_HP + combinedBonuses.maxHpBonus;
      playerRef.current.maxHp = newMaxHp;
      playerRef.current.hp = newMaxHp;
      setPlayerHp(newMaxHp);

      // Reset shield to full if player has shield bonus
      if (playerRef.current.buffs && combinedBonuses.shieldMaxBonus > 0) {
        playerRef.current.buffs.hasShield = true;
        playerRef.current.buffs.maxShield = combinedBonuses.shieldMaxBonus;
        playerRef.current.buffs.currentShield = combinedBonuses.shieldMaxBonus;
        playerRef.current.buffs.shieldRegenRate = combinedBonuses.shieldRegenBonus;
        setMaxShield(combinedBonuses.shieldMaxBonus);
        setPlayerShield(combinedBonuses.shieldMaxBonus);
      }

      gameState.generateNewDungeon();
    },
    onXpGained: handleXpGained,
    onGoldGained: handleGoldGained,
    onItemDropped: handleItemDropped,
    onEnemyDefeated: handleEnemyDefeated,
    onEnemyDefeatedFlawless: combo.incrementCombo,
    onComboBreak: combo.resetCombo,
    onShrineEnemyDefeated: (enemyId, shrineId) => {
      shrineEnemyDefeatedRef.current?.(enemyId, shrineId);
    },
    equipmentBonuses: combinedBonuses, // Pass combined bonuses (equipment + skills)
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
    onPlayerShieldUpdate: (current, max) => {
      setPlayerShield(Math.floor(current));
      setMaxShield(max);
    },
    onXpGained: handleXpGained,
    onTreasureCollected: handleTreasureCollected,
    onItemDropped: handleItemDropped,
    inCombatRef: combat.inCombatRef,
    onStartCombat: combat.startCombat,
    onPlayerDeath: combat.triggerDefeat,
    onTrashmobDamage: handleTrashmobDamage,
    playerRef
  });

  // Expose dungeon data for E2E testing
  // Use a small delay to ensure dungeon generation is complete
  useEffect(() => {
    const timer = setTimeout(() => {
      if (typeof window !== 'undefined' && gameState.dungeonManagerRef.current?.dungeon) {
        (window as any).dungeonTestData = gameState.dungeonManagerRef.current.getDungeonData();
        console.log('[GameCanvas] Exposed dungeon test data');
      }
    }, 100);
    return () => clearTimeout(timer);
  }, [gameState.dungeonManagerRef.current?.dungeon, gameStarted]);

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


  // Shop purchase hook
  const shopPurchase = useShopPurchase({
    playerRef,
    rooms: gameState.dungeonManagerRef.current?.rooms,
    tileSize: gameState.dungeonManagerRef.current?.tileSize ?? 64,
    inCombat: combat.inCombat,
    gamePaused: gameState.gamePausedRef.current,
    onHpChange: (increase) => {
      playerRef.current.hp = Math.min(playerRef.current.hp + increase, playerRef.current.maxHp);
      setPlayerHp(playerRef.current.hp);
    },
    userId,
    onGoldChange: handleGoldChange
  });

  // Load session ELOs and gold when user logs in (XP is handled by useAuth)
  useEffect(() => {
    if (userId) {
      loadSessionElos(userId);
      shopPurchase.loadGold();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]); // Only trigger when userId changes, not when functions change

  // Cheat system hook
  const cheatSystem = useCheatSystem({
    playerRef,
    dungeonManagerRef: gameState.dungeonManagerRef,
    onPlayerHpUpdate: setPlayerHp,
    onXpGained: handleXpGained,
    onGenerateNewDungeon: () => {
      combo.resetCombo();
      combo.resetMaxCombo();
      resetPlayerBuffs(playerRef.current);
      resetRegenTimer();
      resetSessionStats();
      gameState.generateNewDungeon();
    },
    onKillCurrentEnemy: () => {
      if (combat.currentEnemyRef.current) {
        combat.currentEnemyRef.current.hp = 0;
        combat.currentEnemyRef.current.alive = false;
      }
    }
  });

  // Update shrine and shop proximity periodically
  useEffect(() => {
    const interval = setInterval(() => {
      shrineHook.updateProximity();
      shopPurchase.updateProximity();
    }, 100);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty deps - interval runs independently

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

    // If not in game, return to main menu
    if (!gameStarted) {
      setShowMainMenu(true);
    }
  };

  const handleOpenInventory = () => {
    gameState.gamePausedRef.current = true;
    setShowInventory(true);
  };

  const handleCloseInventory = () => {
    gameState.gamePausedRef.current = false;
    setShowInventory(false);
  };

  const handleOpenSkillTree = () => {
    gameState.gamePausedRef.current = true;
    setShowSkillTree(true);
  };

  const handleCloseSkillTree = () => {
    gameState.gamePausedRef.current = false;
    setShowSkillTree(false);
  };

  const handleSkillAllocated = (skills: UserSkill[], availablePoints: number) => {
    setUserSkills(skills);
    setSkillPointsAvailable(availablePoints);
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
    handleRestart();
    gameState.gamePausedRef.current = false;
  };

  const handlePauseMenuMainMenu = () => {
    setShowPauseMenu(false);
    gameState.gamePausedRef.current = false;
    setGameStarted(false);
    setShowMainMenu(true);
    // Don't logout - keep user logged in when returning to main menu
  };

  const handlePauseMenuOptions = () => {
    setShowPauseMenu(false);
    setShowOptionsMenu(true);
  };

  const handlePauseMenuStats = () => {
    setShowPauseMenu(false);
    setShowSkillDashboard(true);
  };

  const handleOptionsBack = () => {
    setShowOptionsMenu(false);
    // If in game, go back to pause menu
    if (gameStarted) {
      setShowPauseMenu(true);
    } else {
      // If not in game, go back to main menu
      setShowMainMenu(true);
    }
  };

  // Main menu handlers
  const handleMainMenuPlay = () => {
    if (userId) {
      // User is logged in, start game directly
      setShowMainMenu(false);
      setGameStarted(true);
    } else {
      // User not logged in, show login modal
      setLoginAction('play');
      setShowLoginForPlay(true);
    }
  };

  const handleMainMenuProgress = () => {
    if (userId) {
      // Show skill dashboard without starting game
      setShowSkillDashboard(true);
    } else {
      // Need to login to see progress
      setLoginAction('progress');
      setShowLoginForPlay(true);
    }
  };

  const handleMainMenuSettings = () => {
    // Hide main menu and show options menu
    setShowMainMenu(false);
    setShowOptionsMenu(true);
  };

  const handleMainMenuProfileSelect = () => {
    // Hide main menu and logout to show login modal
    setShowMainMenu(false);
    handleLogout();
    // showLogin will be set to true in handleLogout
  };

  const handleSecretUnlocked = () => {
    // Navigate to editor page
    console.log('[GameCanvas] Secret unlocked! Navigating to editor...');
    window.location.href = '/editor';
  };

  // Handle game restart - resets combo, buffs, session stats, and generates new dungeon
  const handleRestart = () => {
    combo.resetCombo();
    combo.resetMaxCombo();
    resetPlayerBuffs(playerRef.current);
    resetRegenTimer();
    resetSessionStats();

    // Restore maxHp from skill/equipment bonuses BEFORE generating dungeon
    const newMaxHp = PLAYER_MAX_HP + combinedBonuses.maxHpBonus;
    playerRef.current.maxHp = newMaxHp;
    playerRef.current.hp = newMaxHp;
    setPlayerHp(newMaxHp);

    // Reset shield to full if player has shield bonus
    if (playerRef.current.buffs && combinedBonuses.shieldMaxBonus > 0) {
      playerRef.current.buffs.hasShield = true;
      playerRef.current.buffs.maxShield = combinedBonuses.shieldMaxBonus;
      playerRef.current.buffs.currentShield = combinedBonuses.shieldMaxBonus;
      playerRef.current.buffs.shieldRegenRate = combinedBonuses.shieldRegenBonus;
      setMaxShield(combinedBonuses.shieldMaxBonus);
      setPlayerShield(combinedBonuses.shieldMaxBonus);
    }

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

  // Keyboard handler for inventory (I key), pause menu (ESC), and cheat menu (CTRL+P)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cheat menu toggle with CTRL+P
      if (e.ctrlKey && e.key.toLowerCase() === 'p' && !showLogin) {
        e.preventDefault(); // Prevent browser print dialog
        if (cheatSystem.showCheatModal) {
          cheatSystem.closeCheatModal();
          gameState.gamePausedRef.current = false;
        } else {
          gameState.gamePausedRef.current = true;
          cheatSystem.toggleCheatModal();
        }
        return;
      }

      // Inventory toggle with I key
      if (e.key.toLowerCase() === 'i' && !showLogin && !combat.inCombat && !showPauseMenu && !showOptionsMenu && !cheatSystem.showCheatModal) {
        if (showInventory) {
          handleCloseInventory();
        } else {
          // Close other modals first
          if (showSkillDashboard) handleCloseSkills();
          if (showSkillTree) handleCloseSkillTree();
          handleOpenInventory();
        }
      }

      // Skill Tree toggle with K key
      if (e.key.toLowerCase() === 'k' && !showLogin && !combat.inCombat && !showPauseMenu && !showOptionsMenu) {
        if (showSkillTree) {
          handleCloseSkillTree();
        } else {
          // Close other modals first
          if (showSkillDashboard) handleCloseSkills();
          if (showInventory) handleCloseInventory();
          handleOpenSkillTree();
        }
      }

      // ESC key handling
      if (e.key === 'Escape' && !showLogin && !showLoginForPlay) {
        // Close modals in priority order
        if (cheatSystem.showCheatModal) {
          cheatSystem.closeCheatModal();
          gameState.gamePausedRef.current = false;
        } else if (showOptionsMenu) {
          // Go back to main menu or pause menu from options
          setShowOptionsMenu(false);
          if (gameStarted) {
            setShowPauseMenu(true);
          }
          // If not in game, just close options menu (returns to main menu)
        } else if (showInventory) {
          handleCloseInventory();
        } else if (showSkillTree) {
          handleCloseSkillTree();
        } else if (showSkillDashboard) {
          // Close skill dashboard
          handleCloseSkills();
          // If in game, go back to pause menu
          if (gameStarted) {
            setShowPauseMenu(true);
          }
          // If not in game, handleCloseSkills will return to main menu
        } else if (showPauseMenu) {
          // Close pause menu
          handleClosePauseMenu();
        } else if (!combat.inCombat && !showBuffSelection && gameStarted) {
          // Open pause menu (only when in game, not in combat or buff selection)
          handleOpenPauseMenu();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showInventory, showSkillTree, showLogin, showSkillDashboard, combat.inCombat, showPauseMenu, showBuffSelection, showOptionsMenu, cheatSystem.showCheatModal]);

  const handleLoginWithElo = async (id: number, name: string, xp?: number) => {
    await handleLogin(id, name, xp);
    await loadSessionElos(id);
    await loadUserSkills(id);
    await shopPurchase.loadGold();

    // Close login modal
    setShowLoginForPlay(false);

    // Execute the action that triggered login
    if (loginAction === 'play') {
      setShowMainMenu(false);
      setGameStarted(true);
    } else if (loginAction === 'progress') {
      setShowSkillDashboard(true);
    } else {
      // Initial login - show main menu
      setShowMainMenu(true);
    }

    // Reset login action
    setLoginAction(null);
  };

  // Load user skills from API
  const loadUserSkills = async (id: number) => {
    try {
      const response = await fetch(`/api/skills?userId=${id}`);
      if (response.ok) {
        const data = await response.json();
        setUserSkills(data.skills || []);
        setSkillPointsAvailable(data.skillPoints?.availablePoints || 0);
      }
    } catch (error) {
      console.error('Failed to load user skills:', error);
    }
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

      {/* Main Menu - shown when not in game and not showing login */}
      {showMainMenu && !showLoginForPlay && !showOptionsMenu && (
        <MainMenu
          onPlay={handleMainMenuPlay}
          onProgress={handleMainMenuProgress}
          onSettings={handleMainMenuSettings}
          onProfileSelect={handleMainMenuProfileSelect}
          onSecretUnlocked={handleSecretUnlocked}
          username={username}
        />
      )}

      {/* Login Modal - shown for initial login or when switching profiles */}
      {(showLogin || showLoginForPlay) && <LoginModal onLogin={handleLoginWithElo} />}

      {/* Options Menu - shown from main menu or pause menu */}
      {showOptionsMenu && (
        <OptionsMenu
          settings={audioSettings.settings}
          onMasterVolumeChange={audioSettings.setMasterVolume}
          onMusicVolumeChange={audioSettings.setMusicVolume}
          onSfxVolumeChange={audioSettings.setSfxVolume}
          onBack={handleOptionsBack}
        />
      )}

      {/* Skill Dashboard - shown from main menu or in-game */}
      {showSkillDashboard && userId && (
        <SkillDashboard userId={userId} onClose={handleCloseSkills} />
      )}

      <div style={{ position: 'relative', width: '100vw', height: '100vh', backgroundColor: '#000000' }}>
        {/* Top Left - Character Info with HP */}
        {username && gameStarted && (
          <TopLeftPanel
            username={username}
            level={levelInfo.level}
            currentHp={playerHp}
            maxHp={playerRef.current.maxHp}
            equippedItems={shopPurchase.shopData.equippedItems}
            activePerks={shopPurchase.shopData.activePerks}
          />
        )}

        {/* Bottom Center - XP and ELO Bar */}
        {gameStarted && (
          <BottomCenterBar
            level={levelInfo.level}
            currentXp={levelInfo.currentXp}
            xpForCurrentLevel={levelInfo.xpForCurrentLevel}
            xpForNextLevel={levelInfo.xpForNextLevel}
            scores={sessionScores}
          />
        )}

        {/* Top Right - Gold and Minimap */}
        {gameStarted && (
          <TopRightPanel
            gold={currentGold}
            minimapRef={gameState.minimapRef}
          />
        )}

        {gameStarted && (
          <canvas
            ref={gameState.canvasRef}
            onClick={handleCanvasClick}
            style={{
              display: 'block',
              imageRendering: 'pixelated'
            } as React.CSSProperties}
          />
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
            showCorrectAnswer={cheatSystem.cheatState.showCorrectAnswer}
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

        {/* Skill Tree Modal */}
        {showSkillTree && userId && (
          <SkillTreeModal
            userId={userId}
            userSkills={userSkills}
            skillPoints={{
              totalPoints: 0, // Will be loaded from API
              spentPoints: userSkills.reduce((sum, s) => sum + s.level, 0),
              availablePoints: skillPointsAvailable,
            }}
            onClose={handleCloseSkillTree}
            onSkillAllocated={handleSkillAllocated}
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

        {/* Shop Confirm Modal */}
        {shopPurchase.showPurchaseModal && shopPurchase.purchaseTarget && (
          <ShopConfirmModal
            item={shopPurchase.purchaseTarget.type === 'item'
              ? shopPurchase.currentShopRoom?.shopInventory?.items[shopPurchase.purchaseTarget.index] ?? undefined
              : undefined}
            perk={shopPurchase.purchaseTarget.type === 'perk'
              ? shopPurchase.currentShopRoom?.shopInventory?.perks[shopPurchase.purchaseTarget.index] ?? undefined
              : undefined}
            currentGold={currentGold}
            onConfirm={shopPurchase.handlePurchaseConfirm}
            onCancel={shopPurchase.handlePurchaseCancel}
          />
        )}

        {/* Pause Menu */}
        {showPauseMenu && (
          <PauseMenu
            onResume={handleClosePauseMenu}
            onOptions={handlePauseMenuOptions}
            onStats={handlePauseMenuStats}
            onRestart={handlePauseMenuRestart}
            onMainMenu={handlePauseMenuMainMenu}
          />
        )}

        {/* Cheat Menu */}
        {cheatSystem.showCheatModal && (
          <CheatModal
            cheatState={cheatSystem.cheatState}
            onClose={() => {
              cheatSystem.closeCheatModal();
              gameState.gamePausedRef.current = false;
            }}
            onTeleportToRoom={cheatSystem.teleportToRoom}
            onHealPlayer={cheatSystem.healPlayer}
            onFullHeal={cheatSystem.fullHeal}
            onAddShield={cheatSystem.addShield}
            onToggleGodMode={cheatSystem.toggleGodMode}
            onToggleSpeedBoost={cheatSystem.toggleSpeedBoost}
            onToggleShowCorrectAnswer={cheatSystem.toggleShowCorrectAnswer}
            onKillAllEnemies={cheatSystem.killAllEnemies}
            onKillCurrentEnemy={cheatSystem.killCurrentEnemy}
            onRevealAllRooms={cheatSystem.revealAllRooms}
            onAddXp={cheatSystem.addXp}
            onNewDungeon={cheatSystem.newDungeon}
            inCombat={combat.inCombat}
          />
        )}
      </div>
    </>
  );
}
