'use client';

import { useEffect, useState, useRef } from 'react';
import type { QuestionDatabase } from '@/lib/questions';
import { PLAYER_MAX_HP, DIRECTION } from '@/lib/constants';
import type { Player } from '@/lib/enemy';
import LoginModal from './LoginModal';
import SkillDashboard from './SkillDashboard';
import CharacterPanel from './CharacterPanel';
import CombatModal from './CombatModal';
import VictoryOverlay from './VictoryOverlay';
import DefeatOverlay from './DefeatOverlay';
import FloatingXpBubble from './FloatingXpBubble';
import InventoryModal, { Equipment, Item, EquipmentSlot } from './InventoryModal';
import ItemDropNotification from './ItemDropNotification';
import type { DroppedItem, ItemDefinition } from '@/lib/items';
import { useAuth } from '@/hooks/useAuth';
import { useScoring } from '@/hooks/useScoring';
import { useCombat } from '@/hooks/useCombat';
import { useGameState } from '@/hooks/useGameState';
import { getLevelInfo } from '@/lib/scoring/LevelCalculator';
import { api } from '@/lib/api';
import { COLORS } from '@/lib/ui/colors';

export default function GameCanvas() {
  const [questionDatabase, setQuestionDatabase] = useState<QuestionDatabase | null>(null);
  const [availableSubjects, setAvailableSubjects] = useState<string[]>([]);
  const [showSkillDashboard, setShowSkillDashboard] = useState(false);
  const [showInventory, setShowInventory] = useState(false);
  const [playerHp, setPlayerHp] = useState(PLAYER_MAX_HP);
  const [treasureBubbles, setTreasureBubbles] = useState<Array<{ id: number; x: number; y: number; xp: number }>>([]);

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

  // Background music ref
  const bgMusicRef = useRef<HTMLAudioElement | null>(null);

  // Auth (includes XP state)
  const { userId, username, userXp, setUserXp, showLogin, handleLogin, handleLogout } = useAuth();

  // Scoring
  const { sessionScores, loadSessionElos, updateSessionScores } = useScoring(userId);

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
      audio.volume = 0.07; // Leise Hintergrundmusik
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

  const handleXpGained = (amount: number) => {
    setUserXp(prev => prev + amount);
  };

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
    maxHp: PLAYER_MAX_HP
  });

  // Combat - initialized first so we have inCombatRef and startCombat
  const combat = useCombat({
    questionDatabase,
    userId,
    playerRef,
    onUpdateSessionScores: updateSessionScores,
    onPlayerHpUpdate: setPlayerHp,
    onGameRestart: () => gameState.generateNewDungeon(),
    onXpGained: handleXpGained,
    onItemDropped: handleItemDropped,
    tileSize: 64
  });

  // Game state - receives combat refs via props
  const gameState = useGameState({
    questionDatabase,
    availableSubjects,
    userId,
    onPlayerHpUpdate: setPlayerHp,
    onXpGained: handleXpGained,
    onTreasureCollected: handleTreasureCollected,
    inCombatRef: combat.inCombatRef,
    onStartCombat: combat.startCombat,
    playerRef
  });

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

  // Keyboard handler for inventory (I key)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === 'i' && !showLogin && !combat.inCombat) {
        if (showInventory) {
          handleCloseInventory();
        } else {
          // Close other modals first
          if (showSkillDashboard) handleCloseSkills();
          handleOpenInventory();
        }
      }
      // ESC to close inventory
      if (e.key === 'Escape' && showInventory) {
        handleCloseInventory();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showInventory, showLogin, showSkillDashboard, combat.inCombat]);

  const handleLoginWithElo = async (id: number, name: string, xp?: number) => {
    await handleLogin(id, name, xp);
    await loadSessionElos(id);
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

      {!questionDatabase && !showLogin && (
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
        {username && (
          <CharacterPanel
            username={username}
            scores={sessionScores}
            level={levelInfo.level}
            currentXp={levelInfo.currentXp}
            xpForCurrentLevel={levelInfo.xpForCurrentLevel}
            xpForNextLevel={levelInfo.xpForNextLevel}
            onLogout={handleLogout}
            onRestart={gameState.generateNewDungeon}
            onSkills={handleOpenSkills}
          />
        )}

        <canvas
          ref={gameState.canvasRef}
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
          <DefeatOverlay onRestart={combat.handleDefeatRestart} />
        )}

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
      </div>
    </>
  );
}
