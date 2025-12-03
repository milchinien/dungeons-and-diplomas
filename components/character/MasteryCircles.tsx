'use client';

export interface SubjectScore {
  subjectKey: string;
  subjectName: string;
  startElo: number;
  currentElo: number;
  questionsAnswered: number;
}

interface MasteryCirclesProps {
  scores: SubjectScore[];
}

const GAIN_COLOR = '#00ff00'; // Bright green for improvements
const LOSS_COLOR = '#ff4444'; // Bright red for losses

/**
 * Get mastery level color based on ELO
 */
function getMasteryColor(elo: number): string {
  if (Math.round(elo) >= 10) {
    return '#FFD700'; // Gold for perfect
  } else if (elo >= 8) {
    return '#4CAF50'; // Green for master
  } else if (elo >= 5) {
    return '#2196F3'; // Blue for advanced
  } else {
    return '#ff9800'; // Orange for beginner
  }
}

/**
 * Single ELO circle indicator
 */
function EloCircle({
  index,
  currentElo,
  startElo,
  isPerfect,
  masteryColor
}: {
  index: number;
  currentElo: number;
  startElo: number;
  isPerfect: boolean;
  masteryColor: string;
}) {
  const isFilled = index <= currentElo;
  const wasAtStart = index <= startElo;

  let circleColor = '#333';
  let glowColor = 'none';

  if (isFilled) {
    circleColor = isPerfect ? '#FFD700' : masteryColor;
    if (index > startElo) {
      glowColor = `0 0 8px ${GAIN_COLOR}, 0 0 12px ${GAIN_COLOR}`;
    } else if (isPerfect) {
      glowColor = `0 0 8px rgba(255, 215, 0, 0.8)`;
    }
  } else if (wasAtStart && !isFilled) {
    circleColor = LOSS_COLOR;
    glowColor = `0 0 8px ${LOSS_COLOR}, 0 0 12px ${LOSS_COLOR}`;
  }

  return (
    <div
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
}

/**
 * Single subject row with name, circles, and badge
 */
function SubjectRow({ score }: { score: SubjectScore }) {
  const masteryColor = getMasteryColor(score.currentElo);
  const isPerfect = Math.round(score.currentElo) >= 10;

  return (
    <div
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
        {Array.from({ length: 10 }, (_, i) => (
          <EloCircle
            key={i + 1}
            index={i + 1}
            currentElo={score.currentElo}
            startElo={score.startElo}
            isPerfect={isPerfect}
            masteryColor={masteryColor}
          />
        ))}
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
}

/**
 * Mastery circles section showing ELO progress per subject
 */
export function MasteryCircles({ scores }: MasteryCirclesProps) {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      gap: '8px',
      marginBottom: '12px',
      minHeight: scores.length === 0 ? '80px' : 'auto'
    }}>
      {scores.length === 0 ? (
        <div style={{
          textAlign: 'center',
          color: '#888',
          fontSize: '12px',
          padding: '20px'
        }}>
          Lade Statistiken...
        </div>
      ) : (
        scores.map((score) => (
          <SubjectRow key={score.subjectKey} score={score} />
        ))
      )}
    </div>
  );
}
