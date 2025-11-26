import { PLAYER_MAX_HP, GOBLIN_MAX_HP } from '@/lib/constants';
import type { TileType, Room } from '@/lib/constants';
import type { Question } from '@/lib/questions';
import type { Enemy, Player } from '@/lib/enemy';
import type { RenderMap, TileTheme } from '@/lib/tiletheme/types';
import DungeonView from './combat/DungeonView';
import CharacterSprite from './combat/CharacterSprite';
import HPBar from './combat/HPBar';
import CombatTimer from './combat/CombatTimer';
import CombatDifficulty from './combat/CombatDifficulty';
import CombatQuestion from './combat/CombatQuestion';
import CombatAnswers from './combat/CombatAnswers';
import CombatFeedback from './combat/CombatFeedback';

interface CombatModalProps {
  combatSubject: string;
  playerHp: number;
  enemyHp: number;
  currentEnemy: Enemy | null;
  combatTimer: number;
  combatQuestion: (Question & { shuffledAnswers: string[]; correctIndex: number; elo: number | null }) | null;
  combatFeedback: string;
  onAnswerQuestion: (index: number) => void;
  // Dungeon data for background rendering
  player?: Player;
  dungeon?: TileType[][];
  roomMap?: number[][];
  rooms?: Room[];
  renderMap?: RenderMap | null;
  doorStates?: Map<string, boolean>;
  darkTheme?: TileTheme | null;
  tileSize?: number;
}

export default function CombatModal({
  combatSubject,
  playerHp,
  enemyHp,
  currentEnemy,
  combatTimer,
  combatQuestion,
  combatFeedback,
  onAnswerQuestion,
  player,
  dungeon,
  roomMap,
  rooms,
  renderMap,
  doorStates,
  darkTheme,
  tileSize
}: CombatModalProps) {
  // Determine animation states based on combat feedback and HP
  const isPlayerDead = playerHp <= 0;
  const isEnemyDead = enemyHp <= 0;

  const isCorrectAnswer = combatFeedback.startsWith('\u2713'); // checkmark
  const isWrongAnswer = combatFeedback.startsWith('\u2717'); // X mark

  // Attack animations continue even during death (for the killing blow)
  const isPlayerAttacking = isCorrectAnswer;
  const isEnemyHurt = isCorrectAnswer && enemyHp > 0;

  const isEnemyAttacking = isWrongAnswer;
  const isPlayerHurt = isWrongAnswer && playerHp > 0;

  // Hide questions during combat animations (including death)
  const isCombatAnimating = isPlayerAttacking || isEnemyHurt || isEnemyAttacking || isPlayerHurt || isPlayerDead || isEnemyDead;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100vw',
      height: '100vh',
      zIndex: 200
    }}>
      {/* Dungeon Background - Full Screen */}
      <DungeonView
        isPlayerAttacking={isPlayerAttacking}
        isEnemyHurt={isEnemyHurt}
        player={player}
        dungeon={dungeon}
        roomMap={roomMap}
        rooms={rooms}
        renderMap={renderMap}
        doorStates={doorStates}
        darkTheme={darkTheme}
        tileSize={tileSize}
      />

      {/* Characters */}
      <CharacterSprite
        isPlayer={true}
        isAttacking={isPlayerAttacking}
        isHurt={isPlayerHurt}
        isDead={isPlayerDead}
      />
      <CharacterSprite
        isPlayer={false}
        isAttacking={isEnemyAttacking}
        isHurt={isEnemyHurt}
        isDead={isEnemyDead}
      />

      {/* HP Bars - Under Characters */}
      <div style={{
        position: 'absolute',
        bottom: '140px',
        left: '35%',
        transform: 'translateX(-50%)',
        zIndex: 15
      }}>
        <HPBar current={playerHp} max={PLAYER_MAX_HP} color="#00ff00" label="SPIELER" />
      </div>

      <div style={{
        position: 'absolute',
        bottom: '140px',
        right: '35%',
        transform: 'translateX(50%)',
        zIndex: 15
      }}>
        <HPBar
          current={enemyHp}
          max={currentEnemy?.maxHp ?? GOBLIN_MAX_HP}
          color="#ff0000"
          label={`LEVEL ${currentEnemy?.level ?? 1} GOBLIN`}
        />
      </div>

      {/* Timer and Difficulty - Top */}
      <div style={{
        position: 'absolute',
        top: '30px',
        left: '50%',
        transform: 'translateX(-50%)',
        display: 'flex',
        gap: '30px',
        alignItems: 'center',
        zIndex: 20
      }}>
        <CombatTimer timer={combatTimer} />
        {combatQuestion && <CombatDifficulty elo={combatQuestion.elo} />}
      </div>

      {/* Question Banner */}
      {combatQuestion && (
        <CombatQuestion
          question={combatQuestion.question}
          isHidden={isCombatAnimating}
        />
      )}

      {/* Answer Banners */}
      {combatQuestion && (
        <CombatAnswers
          answers={combatQuestion.shuffledAnswers}
          onSelectAnswer={onAnswerQuestion}
          isHidden={isCombatAnimating}
        />
      )}

      {/* Combat Feedback */}
      <CombatFeedback feedback={combatFeedback} />
    </div>
  );
}
