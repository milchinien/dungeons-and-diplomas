'use client';

interface SubjectScore {
  subjectKey: string;
  subjectName: string;
  startElo: number;
  currentElo: number;
  questionsAnswered: number;
}

interface CharacterPanelProps {
  username: string;
  scores: SubjectScore[];
  level: number;
  currentXp: number;
  xpForCurrentLevel: number;
  xpForNextLevel: number;
  onLogout: () => void;
  onRestart: () => void;
  onSkills: () => void;
}

export default function CharacterPanel({
  username,
  scores,
  level,
  currentXp,
  xpForCurrentLevel,
  xpForNextLevel,
  onLogout,
  onRestart,
  onSkills
}: CharacterPanelProps) {
  // Helper function to get mastery level color based on ELO
  const getMasteryColor = (elo: number): string => {
    if (Math.round(elo) >= 10) {
      return '#FFD700'; // Gold for perfect
    } else if (elo >= 8) {
      return '#4CAF50'; // Green for master
    } else if (elo >= 5) {
      return '#2196F3'; // Blue for advanced
    } else {
      return '#ff9800'; // Orange for beginner
    }
  };

  const gainColor = '#00ff00'; // Bright green for improvements
  const lossColor = '#ff4444'; // Bright red for losses

  // Calculate XP progress
  const xpIntoLevel = currentXp - xpForCurrentLevel;
  const xpNeededForNextLevel = xpForNextLevel - xpForCurrentLevel;
  const progressPercent = (xpIntoLevel / xpNeededForNextLevel) * 100;

  return (
    <div style={{
      position: 'absolute',
      top: '10px',
      left: '10px',
      zIndex: 100,
      backgroundColor: 'rgba(0, 0, 0, 0.85)',
      border: '2px solid #4CAF50',
      borderRadius: '12px',
      padding: '15px',
      minWidth: '280px',
      boxShadow: '0 4px 16px rgba(0, 0, 0, 0.7)'
    }}>
      {/* Header - Username */}
      <div style={{
        fontSize: '20px',
        fontWeight: 'bold',
        color: '#4CAF50',
        marginBottom: '8px',
        paddingBottom: '8px',
        borderBottom: '1px solid rgba(76, 175, 80, 0.3)',
        textAlign: 'center',
        textShadow: '0 0 10px rgba(76, 175, 80, 0.5)'
      }}>
        {username}
      </div>

      {/* Level Display */}
      <div style={{
        fontSize: '16px',
        fontWeight: 'bold',
        color: '#FFD700',
        marginBottom: '6px',
        textAlign: 'center',
        textShadow: '0 0 8px rgba(255, 215, 0, 0.6)'
      }}>
        Level {level}
      </div>

      {/* XP Progress Bar */}
      <div style={{
        marginBottom: '12px',
        paddingBottom: '12px',
        borderBottom: '1px solid rgba(76, 175, 80, 0.2)'
      }}>
        {/* XP Numbers */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          fontSize: '10px',
          color: '#aaa',
          marginBottom: '4px'
        }}>
          <span>{xpIntoLevel} XP</span>
          <span>{xpNeededForNextLevel} XP</span>
        </div>

        {/* Progress Bar Background */}
        <div style={{
          width: '100%',
          height: '12px',
          backgroundColor: 'rgba(255, 255, 255, 0.1)',
          borderRadius: '6px',
          overflow: 'hidden',
          border: '1px solid rgba(255, 215, 0, 0.3)',
          position: 'relative'
        }}>
          {/* Progress Bar Fill */}
          <div style={{
            width: `${progressPercent}%`,
            height: '100%',
            backgroundColor: '#FFD700',
            boxShadow: '0 0 10px rgba(255, 215, 0, 0.8)',
            transition: 'width 0.5s ease',
            borderRadius: '6px'
          }} />
        </div>
      </div>

      {/* Scores Section */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        marginBottom: '12px',
        minHeight: scores.length === 0 ? '80px' : 'auto'
      }}>
        {scores.length === 0 ? (
          // Show placeholder if no scores loaded yet
          <div style={{
            textAlign: 'center',
            color: '#888',
            fontSize: '12px',
            padding: '20px'
          }}>
            Lade Statistiken...
          </div>
        ) : (
          scores.map((score) => {
          const masteryColor = getMasteryColor(score.currentElo);
          const isPerfect = Math.round(score.currentElo) >= 10;
          return (
            <div
              key={score.subjectKey}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '6px 8px',
                backgroundColor: isPerfect
                  ? 'rgba(255, 215, 0, 0.15)'
                  : 'rgba(255, 255, 255, 0.05)',
                borderRadius: '6px',
                border: `1px solid ${masteryColor}30`,
                boxShadow: isPerfect
                  ? '0 0 15px rgba(255, 215, 0, 0.5)'
                  : 'none'
              }}
            >
              {/* Subject Name */}
              <div style={{
                fontSize: '11px',
                fontWeight: 'bold',
                color: masteryColor,
                minWidth: '55px',
                textShadow: isPerfect
                  ? '0 0 10px rgba(255, 215, 0, 0.8)'
                  : `0 0 4px ${masteryColor}80`
              }}>
                {score.subjectName}
              </div>

              {/* ELO Circles (1-10) */}
              <div style={{
                display: 'flex',
                gap: '2px',
                flex: 1
              }}>
                {Array.from({ length: 10 }, (_, i) => {
                  const index = i + 1;
                  const isFilled = index <= score.currentElo;
                  const wasAtStart = index <= score.startElo;

                  // Determine circle state
                  let circleColor = '#333';
                  let glowColor = 'none';

                  if (isFilled) {
                    // Use mastery color for filled circles
                    circleColor = isPerfect ? '#FFD700' : masteryColor;

                    // Check if this is a gained point - stronger glow
                    if (index > score.startElo) {
                      glowColor = `0 0 8px ${gainColor}, 0 0 12px ${gainColor}`;
                    } else if (isPerfect) {
                      glowColor = `0 0 8px rgba(255, 215, 0, 0.8)`;
                    }
                  } else if (wasAtStart && !isFilled) {
                    // Lost point - stronger glow
                    circleColor = lossColor;
                    glowColor = `0 0 8px ${lossColor}, 0 0 12px ${lossColor}`;
                  }

                  return (
                    <div
                      key={index}
                      style={{
                        width: '9px',
                        height: '9px',
                        borderRadius: '50%',
                        backgroundColor: circleColor,
                        border: isFilled ? 'none' : '1px solid #555',
                        boxShadow: glowColor,
                        transition: 'all 0.3s ease'
                      }}
                    />
                  );
                })}
              </div>

              {/* Questions answered badge */}
              {score.questionsAnswered > 0 && (
                <div style={{
                  fontSize: '10px',
                  fontWeight: 'bold',
                  color: '#000',
                  backgroundColor: '#FFD700',
                  padding: '2px 6px',
                  borderRadius: '3px',
                  minWidth: '16px',
                  textAlign: 'center'
                }}>
                  {score.questionsAnswered}
                </div>
              )}
            </div>
          );
        })
        )}
      </div>

      {/* Buttons - Compact */}
      <div style={{
        display: 'flex',
        gap: '4px',
        paddingTop: '8px',
        borderTop: '1px solid rgba(76, 175, 80, 0.2)'
      }}>
        <button
          onClick={onRestart}
          title="Restart"
          style={{
            flex: 1,
            padding: '5px 8px',
            fontSize: '11px',
            fontWeight: '600',
            backgroundColor: 'rgba(76, 175, 80, 0.3)',
            color: '#4CAF50',
            border: '1px solid rgba(76, 175, 80, 0.5)',
            borderRadius: '4px',
            cursor: 'pointer',
            transition: 'all 0.2s'
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(76, 175, 80, 0.5)';
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(76, 175, 80, 0.3)';
          }}
        >
          🔄
        </button>

        <button
          onClick={onSkills}
          title="Skills"
          style={{
            flex: 1,
            padding: '5px 8px',
            fontSize: '11px',
            fontWeight: '600',
            backgroundColor: 'rgba(33, 150, 243, 0.3)',
            color: '#2196F3',
            border: '1px solid rgba(33, 150, 243, 0.5)',
            borderRadius: '4px',
            cursor: 'pointer',
            transition: 'all 0.2s'
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(33, 150, 243, 0.5)';
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(33, 150, 243, 0.3)';
          }}
        >
          📊
        </button>

        <button
          onClick={onLogout}
          title="Logout"
          style={{
            flex: 1,
            padding: '5px 8px',
            fontSize: '11px',
            fontWeight: '600',
            backgroundColor: 'rgba(244, 67, 54, 0.3)',
            color: '#f44336',
            border: '1px solid rgba(244, 67, 54, 0.5)',
            borderRadius: '4px',
            cursor: 'pointer',
            transition: 'all 0.2s'
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(244, 67, 54, 0.5)';
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(244, 67, 54, 0.3)';
          }}
        >
          🚪
        </button>
      </div>
    </div>
  );
}
