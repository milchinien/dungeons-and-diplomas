'use client';

import { useEffect, useState } from 'react';
import type { QuestionDatabase } from '@/lib/questions';
import { PLAYER_MAX_HP } from '@/lib/constants';
import LoginModal from './LoginModal';
import SkillDashboard from './SkillDashboard';
import CharacterPanel from './CharacterPanel';
import CombatModal from './CombatModal';
import VictoryOverlay from './VictoryOverlay';
import DefeatOverlay from './DefeatOverlay';
import FloatingXpBubble from './FloatingXpBubble';
import { useAuth } from '@/hooks/useAuth';
import { useScoring } from '@/hooks/useScoring';
import { useCombat } from '@/hooks/useCombat';
import { useGameState } from '@/hooks/useGameState';
import { getLevelInfo } from '@/lib/scoring/LevelCalculator';

export default function GameCanvas() {
  const [questionDatabase, setQuestionDatabase] = useState<QuestionDatabase | null>(null);
  const [availableSubjects, setAvailableSubjects] = useState<string[]>([]);
  const [showSkillDashboard, setShowSkillDashboard] = useState(false);
  const [playerHp, setPlayerHp] = useState(PLAYER_MAX_HP);
  const [playerXp, setPlayerXp] = useState(0);
  const [treasureBubbles, setTreasureBubbles] = useState<Array<{ id: number; x: number; y: number; xp: number }>>([]);

  // Auth
  const { userId, username, showLogin, handleLogin, handleLogout } = useAuth();

  // Scoring
  const { sessionScores, loadSessionElos, updateSessionScores } = useScoring(userId);

  // Load questions and subjects
  useEffect(() => {
    const loadData = async () => {
      try {
        const [questionsResponse, subjectsResponse] = await Promise.all([
          fetch('/api/questions'),
          fetch('/api/subjects')
        ]);

        if (!questionsResponse.ok || !subjectsResponse.ok) {
          throw new Error('Failed to load game data');
        }

        const questions = await questionsResponse.json();
        const subjects = await subjectsResponse.json();

        setQuestionDatabase(questions);
        setAvailableSubjects(subjects);
      } catch (error) {
        console.error('Error loading game data:', error);
      }
    };

    loadData();
  }, []);

  // Load session ELOs and user XP when user logs in
  useEffect(() => {
    if (userId) {
      loadSessionElos(userId);
      loadUserXp(userId);
    }
  }, [userId]);

  const loadUserXp = async (id: number) => {
    try {
      const response = await fetch(`/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: username })
      });

      if (response.ok) {
        const userData = await response.json();
        setPlayerXp(userData.xp || 0);
      }
    } catch (error) {
      console.error('Failed to load user XP:', error);
    }
  };

  const handleXpGained = (amount: number) => {
    setPlayerXp(prev => prev + amount);
  };

  const handleTreasureCollected = (screenX: number, screenY: number, xpAmount: number) => {
    const bubbleId = Date.now() + Math.random();
    setTreasureBubbles(prev => [...prev, { id: bubbleId, x: screenX, y: screenY, xp: xpAmount }]);
  };

  const removeTreasureBubble = (id: number) => {
    setTreasureBubbles(prev => prev.filter(b => b.id !== id));
  };

  // Game state
  const gameState = useGameState({
    questionDatabase,
    availableSubjects,
    userId,
    onPlayerHpUpdate: setPlayerHp,
    onXpGained: handleXpGained,
    onTreasureCollected: handleTreasureCollected
  });

  // Combat
  const combat = useCombat({
    questionDatabase,
    userId,
    playerRef: gameState.playerRef,
    onUpdateSessionScores: updateSessionScores,
    onPlayerHpUpdate: setPlayerHp,
    onGameRestart: gameState.generateNewDungeon,
    onXpGained: handleXpGained
  });

  // Wire combat into game state
  useEffect(() => {
    gameState.inCombatRef.current = combat.inCombatRef.current;
    gameState.startCombatRef.current = combat.startCombat;
  }, [combat.inCombatRef.current, combat.startCombat]);

  const handleOpenSkills = () => {
    gameState.gamePausedRef.current = true;
    setShowSkillDashboard(true);
  };

  const handleCloseSkills = () => {
    gameState.gamePausedRef.current = false;
    setShowSkillDashboard(false);
  };

  const handleLoginWithElo = async (id: number, name: string) => {
    await handleLogin(id, name);
    await loadSessionElos(id);
    await loadUserXp(id);
  };

  // Calculate level info from current XP
  const levelInfo = getLevelInfo(playerXp);

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
            border: '3px solid #4CAF50',
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
          />
        )}

        {showSkillDashboard && userId && (
          <SkillDashboard userId={userId} onClose={handleCloseSkills} />
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
      </div>
    </>
  );
}
