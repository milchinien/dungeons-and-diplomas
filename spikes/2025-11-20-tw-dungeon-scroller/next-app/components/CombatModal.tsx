import { PLAYER_MAX_HP, COMBAT_TIME_LIMIT, GOBLIN_MAX_HP } from '@/lib/constants';
import type { Question } from '@/lib/questions';
import type { Enemy } from '@/lib/Enemy';
import DungeonView from './combat/DungeonView';
import CharacterSprite from './combat/CharacterSprite';
import HPBar from './combat/HPBar';

interface CombatModalProps {
  combatSubject: string;
  playerHp: number;
  enemyHp: number;
  currentEnemy: Enemy | null;
  combatTimer: number;
  combatQuestion: (Question & { shuffledAnswers: string[]; correctIndex: number; elo: number | null }) | null;
  combatFeedback: string;
  onAnswerQuestion: (index: number) => void;
}

export default function CombatModal({
  combatSubject,
  playerHp,
  enemyHp,
  currentEnemy,
  combatTimer,
  combatQuestion,
  combatFeedback,
  onAnswerQuestion
}: CombatModalProps) {
  // Determine difficulty color based on enemy level
  let borderColor = '#4CAF50';
  let glowEffect = 'none';

  if (currentEnemy) {
    if (currentEnemy.level >= 8) {
      borderColor = '#FF4444';
      glowEffect = '0 0 30px rgba(255, 68, 68, 0.8), 0 0 60px rgba(255, 68, 68, 0.5)';
    } else if (currentEnemy.level >= 4) {
      borderColor = '#FFC107';
      glowEffect = '0 0 20px rgba(255, 193, 7, 0.5)';
    } else {
      glowEffect = '0 0 15px rgba(76, 175, 80, 0.5)';
    }
  }

  // Determine animation states based on combat feedback and HP
  const isPlayerDead = playerHp <= 0;
  const isEnemyDead = enemyHp <= 0;

  const isCorrectAnswer = combatFeedback.startsWith('✓');
  const isWrongAnswer = combatFeedback.startsWith('✗');

  const isPlayerAttacking = isCorrectAnswer && !isEnemyDead;
  const isEnemyHurt = isCorrectAnswer && enemyHp > 0;

  const isEnemyAttacking = isWrongAnswer && !isPlayerDead;
  const isPlayerHurt = isWrongAnswer && playerHp > 0;

  return (
    <>
      <style jsx>{`
        @keyframes timerBlink {
          0%, 100% {
            opacity: 1;
            color: #FF4444;
          }
          50% {
            opacity: 0.3;
            color: #FF8888;
          }
        }

        .wood-texture {
          background:
            linear-gradient(180deg, rgba(0,0,0,0.1) 0%, transparent 50%, rgba(0,0,0,0.2) 100%),
            repeating-linear-gradient(90deg, #3d2817 0px, #4a3420 2px, #3d2817 4px),
            linear-gradient(90deg, #4a3420, #3d2817, #4a3420);
        }

        .metal-corner {
          position: absolute;
          width: 20px;
          height: 20px;
          background: radial-gradient(circle, #5a5a5a 0%, #2a2a2a 70%);
          border: 2px solid #1a1a1a;
          box-shadow:
            inset 1px 1px 2px rgba(255,255,255,0.3),
            inset -1px -1px 2px rgba(0,0,0,0.5),
            0 2px 4px rgba(0,0,0,0.5);
        }

        .metal-corner::after {
          content: '';
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 6px;
          height: 6px;
          background: #1a1a1a;
          border-radius: 50%;
          box-shadow: inset 0 1px 2px rgba(0,0,0,0.8);
        }
      `}</style>

      {/* Full-screen combat container */}
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        zIndex: 200
      }}>
        {/* Dungeon Background - Full Screen */}
        <DungeonView isPlayerAttacking={isPlayerAttacking} isEnemyHurt={isEnemyHurt} />

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
          left: '120px',
          zIndex: 15
        }}>
          <HPBar current={playerHp} max={PLAYER_MAX_HP} color="#00ff00" label="SPIELER" />
        </div>

        <div style={{
          position: 'absolute',
          bottom: '140px',
          right: '120px',
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
          {/* Timer */}
          <div className="wood-texture" style={{
            padding: '12px 25px',
            borderRadius: '8px',
            border: '4px solid #2a1810',
            boxShadow: '0 4px 8px rgba(0,0,0,0.6), inset 0 2px 4px rgba(255,255,255,0.1)',
            position: 'relative'
          }}>
            <div style={{
              fontSize: '24px',
              color: combatTimer < 5 ? '#FF4444' : '#FFD700',
              fontWeight: 'bold',
              animation: combatTimer < 5 ? 'timerBlink 0.5s ease-in-out infinite' : 'none',
              textShadow: '2px 2px 4px rgba(0, 0, 0, 0.9)',
              fontFamily: 'monospace'
            }}>
              ⏱️ {combatTimer}s
            </div>
            <div className="metal-corner" style={{ top: '-6px', left: '-6px', borderRadius: '50% 0 0 0' }} />
            <div className="metal-corner" style={{ top: '-6px', right: '-6px', borderRadius: '0 50% 0 0' }} />
            <div className="metal-corner" style={{ bottom: '-6px', left: '-6px', borderRadius: '0 0 0 50%' }} />
            <div className="metal-corner" style={{ bottom: '-6px', right: '-6px', borderRadius: '0 0 50% 0' }} />
          </div>

          {/* Difficulty */}
          {combatQuestion && (() => {
            const elo = combatQuestion.elo;
            let difficulty = 'Neu';
            let diffColor = '#888';
            let diffLevel = 5;

            if (elo !== null) {
              diffLevel = 11 - elo;
              if (diffLevel <= 2) {
                difficulty = 'Sehr leicht';
                diffColor = '#4CAF50';
              } else if (diffLevel <= 4) {
                difficulty = 'Leicht';
                diffColor = '#8BC34A';
              } else if (diffLevel <= 6) {
                difficulty = 'Mittel';
                diffColor = '#FFC107';
              } else if (diffLevel <= 8) {
                difficulty = 'Schwer';
                diffColor = '#FF9800';
              } else {
                difficulty = 'Sehr schwer';
                diffColor = '#FF4444';
              }
            }

            return (
              <div className="wood-texture" style={{
                padding: '12px 25px',
                borderRadius: '8px',
                border: '4px solid #2a1810',
                boxShadow: '0 4px 8px rgba(0,0,0,0.6), inset 0 2px 4px rgba(255,255,255,0.1)',
                position: 'relative'
              }}>
                <div style={{
                  fontSize: '18px',
                  color: diffColor,
                  fontWeight: 'bold',
                  textShadow: '2px 2px 4px rgba(0, 0, 0, 0.9)',
                  fontFamily: 'serif'
                }}>
                  {difficulty}
                </div>
                <div className="metal-corner" style={{ top: '-6px', left: '-6px', borderRadius: '50% 0 0 0' }} />
                <div className="metal-corner" style={{ top: '-6px', right: '-6px', borderRadius: '0 50% 0 0' }} />
                <div className="metal-corner" style={{ bottom: '-6px', left: '-6px', borderRadius: '0 0 0 50%' }} />
                <div className="metal-corner" style={{ bottom: '-6px', right: '-6px', borderRadius: '0 0 50% 0' }} />
              </div>
            );
          })()}
        </div>

        {/* Question Banner - Large Wood Banner */}
        {combatQuestion && (
          <div style={{
            position: 'absolute',
            top: '120px',
            left: '50%',
            transform: 'translateX(-50%)',
            width: '90%',
            maxWidth: '900px',
            zIndex: 20
          }}>
            {/* Hanging Chains */}
            <div style={{
              position: 'absolute',
              top: '-30px',
              left: '20%',
              width: '3px',
              height: '30px',
              background: 'linear-gradient(180deg, #4a4a4a 0%, #2a2a2a 100%)',
              boxShadow: '1px 0 2px rgba(0,0,0,0.5)'
            }} />
            <div style={{
              position: 'absolute',
              top: '-30px',
              right: '20%',
              width: '3px',
              height: '30px',
              background: 'linear-gradient(180deg, #4a4a4a 0%, #2a2a2a 100%)',
              boxShadow: '1px 0 2px rgba(0,0,0,0.5)'
            }} />

            {/* Question Wood Banner */}
            <div className="wood-texture" style={{
              padding: '35px 45px',
              borderRadius: '12px',
              border: '6px solid #2a1810',
              boxShadow: '0 8px 16px rgba(0,0,0,0.8), inset 0 3px 6px rgba(255,255,255,0.1)',
              position: 'relative'
            }}>
              <div style={{
                fontSize: '32px',
                fontWeight: 'bold',
                color: '#f5deb3',
                textAlign: 'center',
                textShadow: '3px 3px 6px rgba(0, 0, 0, 0.9)',
                fontFamily: 'serif',
                lineHeight: 1.5,
                letterSpacing: '0.5px'
              }}>
                {combatQuestion.question}
              </div>

              {/* Wood grain accent line */}
              <div style={{
                position: 'absolute',
                bottom: '15px',
                left: '45px',
                right: '45px',
                height: '3px',
                background: 'linear-gradient(90deg, transparent, #2a1810, transparent)',
                opacity: 0.5
              }} />

              {/* Metal corners */}
              <div className="metal-corner" style={{ top: '-8px', left: '-8px' }} />
              <div className="metal-corner" style={{ top: '-8px', right: '-8px' }} />
              <div className="metal-corner" style={{ bottom: '-8px', left: '-8px' }} />
              <div className="metal-corner" style={{ bottom: '-8px', right: '-8px' }} />
            </div>
          </div>
        )}

        {/* Answer Banners - Small Separate Wood Banners */}
        {combatQuestion && (
          <div style={{
            position: 'absolute',
            top: '320px',
            left: '50%',
            transform: 'translateX(-50%)',
            width: '90%',
            maxWidth: '900px',
            display: 'flex',
            flexDirection: 'column',
            gap: '20px',
            zIndex: 20
          }}>
            {combatQuestion.shuffledAnswers.map((answer, index) => (
              <button
                key={index}
                onClick={() => onAnswerQuestion(index)}
                className="wood-texture"
                style={{
                  padding: '20px 30px',
                  borderRadius: '10px',
                  border: '5px solid #2a1810',
                  boxShadow: '0 6px 12px rgba(0,0,0,0.7), inset 0 2px 4px rgba(255,255,255,0.1)',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  position: 'relative',
                  textAlign: 'left',
                  fontSize: '22px',
                  fontWeight: '600',
                  color: '#f5deb3',
                  textShadow: '2px 2px 4px rgba(0, 0, 0, 0.9)',
                  fontFamily: 'serif',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '15px'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-3px)';
                  e.currentTarget.style.boxShadow = '0 8px 16px rgba(0,0,0,0.9), inset 0 2px 4px rgba(255,255,255,0.2)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 6px 12px rgba(0,0,0,0.7), inset 0 2px 4px rgba(255,255,255,0.1)';
                }}
              >
                {/* Letter badge */}
                <div style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  background: 'radial-gradient(circle, #5a5a5a 0%, #2a2a2a 70%)',
                  border: '3px solid #1a1a1a',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '20px',
                  fontWeight: 'bold',
                  color: '#f5deb3',
                  flexShrink: 0,
                  boxShadow: 'inset 1px 1px 2px rgba(255,255,255,0.3), 0 2px 4px rgba(0,0,0,0.5)'
                }}>
                  {String.fromCharCode(65 + index)}
                </div>

                <span>{answer}</span>

                {/* Metal corners */}
                <div className="metal-corner" style={{ top: '-7px', left: '-7px', width: '16px', height: '16px' }} />
                <div className="metal-corner" style={{ top: '-7px', right: '-7px', width: '16px', height: '16px' }} />
                <div className="metal-corner" style={{ bottom: '-7px', left: '-7px', width: '16px', height: '16px' }} />
                <div className="metal-corner" style={{ bottom: '-7px', right: '-7px', width: '16px', height: '16px' }} />
              </button>
            ))}
          </div>
        )}

        {/* Combat Feedback */}
        {combatFeedback && (
          <div style={{
            position: 'absolute',
            bottom: '50px',
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 25
          }}>
            <div className="wood-texture" style={{
              padding: '20px 40px',
              borderRadius: '10px',
              border: '5px solid #2a1810',
              boxShadow: combatFeedback.startsWith('✓')
                ? '0 0 30px rgba(76, 175, 80, 0.8), 0 6px 12px rgba(0,0,0,0.7)'
                : '0 0 30px rgba(255, 68, 68, 0.8), 0 6px 12px rgba(0,0,0,0.7)',
              position: 'relative'
            }}>
              <div style={{
                fontSize: '26px',
                fontWeight: 'bold',
                color: combatFeedback.startsWith('✓') ? '#4CAF50' : '#FF4444',
                textShadow: '2px 2px 4px rgba(0, 0, 0, 0.9)',
                fontFamily: 'serif',
                textAlign: 'center'
              }}>
                {combatFeedback.split('<br>').map((line, i) => (
                  <div key={i} dangerouslySetInnerHTML={{ __html: line }} />
                ))}
              </div>
              <div className="metal-corner" style={{ top: '-7px', left: '-7px', width: '16px', height: '16px' }} />
              <div className="metal-corner" style={{ top: '-7px', right: '-7px', width: '16px', height: '16px' }} />
              <div className="metal-corner" style={{ bottom: '-7px', left: '-7px', width: '16px', height: '16px' }} />
              <div className="metal-corner" style={{ bottom: '-7px', right: '-7px', width: '16px', height: '16px' }} />
            </div>
          </div>
        )}
      </div>
    </>
  );
}
