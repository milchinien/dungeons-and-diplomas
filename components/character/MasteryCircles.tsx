'use client';

import { MEDIEVAL_COLORS, MEDIEVAL_STYLES } from '@/lib/ui/medieval-styles';

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

const GAIN_COLOR = '#00ff00';
const LOSS_COLOR = '#ff4444';

/**
 * Get mastery level color based on ELO
 */
function getMasteryColor(elo: number): string {
  if (Math.round(elo) >= 10) {
    return MEDIEVAL_COLORS.mastery.perfect;
  } else if (elo >= 8) {
    return MEDIEVAL_COLORS.mastery.master;
  } else if (elo >= 5) {
    return MEDIEVAL_COLORS.mastery.advanced;
  }
  return MEDIEVAL_COLORS.mastery.beginner;
}

/**
 * Single ELO circle indicator with metal style
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

  let circleColor: string = MEDIEVAL_COLORS.frame.dark;
  let glowColor: string = 'none';
  let borderColor: string = MEDIEVAL_COLORS.frame.border;

  if (isFilled) {
    circleColor = isPerfect ? MEDIEVAL_COLORS.mastery.perfect : masteryColor;
    borderColor = circleColor;
    if (index > startElo) {
      glowColor = `0 0 6px ${GAIN_COLOR}, 0 0 10px ${GAIN_COLOR}`;
    } else if (isPerfect) {
      glowColor = `0 0 6px ${MEDIEVAL_COLORS.mastery.perfect}80`;
    }
  } else if (wasAtStart && !isFilled) {
    circleColor = LOSS_COLOR;
    borderColor = LOSS_COLOR;
    glowColor = `0 0 6px ${LOSS_COLOR}, 0 0 10px ${LOSS_COLOR}`;
  }

  return (
    <div
      style={{
        width: '8px',
        height: '8px',
        borderRadius: '50%',
        backgroundColor: circleColor,
        border: `1px solid ${borderColor}`,
        boxShadow: glowColor !== 'none' ? glowColor : `inset 0 1px 2px rgba(0, 0, 0, 0.5)`,
        transition: 'all 0.3s ease'
      }}
    />
  );
}

/**
 * Single subject row with metal frame styling
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
        ...MEDIEVAL_STYLES.barFrameSmall,
        border: isPerfect
          ? `2px solid ${MEDIEVAL_COLORS.mastery.perfect}`
          : `2px solid ${MEDIEVAL_COLORS.frame.border}`,
        boxShadow: isPerfect
          ? `inset 0 1px 3px rgba(0, 0, 0, 0.5), 0 0 12px ${MEDIEVAL_COLORS.mastery.perfect}50`
          : `inset 0 1px 3px rgba(0, 0, 0, 0.5)`,
        position: 'relative',
      }}
    >
      {/* Subject Name */}
      <div style={{
        fontSize: '10px',
        fontWeight: 'bold',
        color: masteryColor,
        minWidth: '50px',
        textTransform: 'uppercase',
        letterSpacing: '0.5px',
        textShadow: isPerfect
          ? `0 0 8px ${MEDIEVAL_COLORS.mastery.perfect}80`
          : `0 0 3px ${masteryColor}60`
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

      {/* Questions answered badge - metal style */}
      {score.questionsAnswered > 0 && (
        <div style={{
          fontSize: '9px',
          fontWeight: 'bold',
          color: MEDIEVAL_COLORS.frame.darker,
          background: `linear-gradient(180deg, ${MEDIEVAL_COLORS.mastery.perfect} 0%, #ccac00 100%)`,
          padding: '2px 5px',
          borderRadius: '2px',
          minWidth: '14px',
          textAlign: 'center',
          boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.3), 0 1px 2px rgba(0,0,0,0.5)',
        }}>
          {score.questionsAnswered}
        </div>
      )}

      {/* Small rivets */}
      <div style={{
        position: 'absolute',
        top: '2px',
        left: '2px',
        ...MEDIEVAL_STYLES.rivet,
        width: '2px',
        height: '2px',
      }} />
      <div style={{
        position: 'absolute',
        top: '2px',
        right: '2px',
        ...MEDIEVAL_STYLES.rivet,
        width: '2px',
        height: '2px',
      }} />
    </div>
  );
}

/**
 * Mastery circles section in medieval metal frame style
 */
export function MasteryCircles({ scores }: MasteryCirclesProps) {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      gap: '6px',
      marginBottom: '12px',
      minHeight: scores.length === 0 ? '80px' : 'auto'
    }}>
      {scores.length === 0 ? (
        <div style={{
          textAlign: 'center',
          color: MEDIEVAL_COLORS.text.muted,
          fontSize: '11px',
          padding: '20px',
          ...MEDIEVAL_STYLES.barFrameSmall,
        }}>
          Loading stats...
        </div>
      ) : (
        scores.map((score) => (
          <SubjectRow key={score.subjectKey} score={score} />
        ))
      )}
    </div>
  );
}
