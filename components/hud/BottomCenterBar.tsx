'use client';

import { MEDIEVAL_COLORS, MEDIEVAL_STYLES, getXpGradient } from '@/lib/ui/medieval-styles';

export interface SubjectScore {
  subjectKey: string;
  subjectName: string;
  startElo: number;
  currentElo: number;
  questionsAnswered: number;
}

interface BottomCenterBarProps {
  level: number;
  currentXp: number;
  xpForCurrentLevel: number;
  xpForNextLevel: number;
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
 * Single ELO circle indicator (compact version for bottom bar)
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
      glowColor = `0 0 4px ${GAIN_COLOR}, 0 0 6px ${GAIN_COLOR}`;
    } else if (isPerfect) {
      glowColor = `0 0 4px ${MEDIEVAL_COLORS.mastery.perfect}80`;
    }
  } else if (wasAtStart && !isFilled) {
    circleColor = LOSS_COLOR;
    borderColor = LOSS_COLOR;
    glowColor = `0 0 4px ${LOSS_COLOR}, 0 0 6px ${LOSS_COLOR}`;
  }

  return (
    <div
      style={{
        width: '6px',
        height: '6px',
        borderRadius: '50%',
        backgroundColor: circleColor,
        border: `1px solid ${borderColor}`,
        boxShadow: glowColor !== 'none' ? glowColor : `inset 0 1px 1px rgba(0, 0, 0, 0.5)`,
        transition: 'all 0.3s ease'
      }}
    />
  );
}

/**
 * Single subject row (horizontal compact version)
 */
function SubjectCompact({ score }: { score: SubjectScore }) {
  const masteryColor = getMasteryColor(score.currentElo);
  const isPerfect = Math.round(score.currentElo) >= 10;

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        padding: '4px 8px',
        background: `linear-gradient(180deg, ${MEDIEVAL_COLORS.frame.dark}CC, ${MEDIEVAL_COLORS.frame.darker}CC)`,
        border: isPerfect
          ? `1px solid ${MEDIEVAL_COLORS.mastery.perfect}`
          : `1px solid ${MEDIEVAL_COLORS.frame.border}`,
        borderRadius: '2px',
        boxShadow: isPerfect
          ? `inset 0 1px 2px rgba(0, 0, 0, 0.5), 0 0 8px ${MEDIEVAL_COLORS.mastery.perfect}40`
          : `inset 0 1px 2px rgba(0, 0, 0, 0.5)`,
      }}
    >
      {/* Subject Name (short) */}
      <div style={{
        fontSize: '9px',
        fontWeight: 'bold',
        color: masteryColor,
        minWidth: '40px',
        textTransform: 'uppercase',
        letterSpacing: '0.3px',
        textShadow: isPerfect
          ? `0 0 6px ${MEDIEVAL_COLORS.mastery.perfect}80`
          : `0 0 2px ${masteryColor}60`
      }}>
        {score.subjectName.substring(0, 5)}
      </div>

      {/* ELO Circles (1-10) */}
      <div style={{
        display: 'flex',
        gap: '2px',
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

      {/* Questions answered badge (if any) */}
      {score.questionsAnswered > 0 && (
        <div style={{
          fontSize: '8px',
          fontWeight: 'bold',
          color: MEDIEVAL_COLORS.frame.darker,
          background: `linear-gradient(180deg, ${MEDIEVAL_COLORS.mastery.perfect} 0%, #ccac00 100%)`,
          padding: '1px 4px',
          borderRadius: '2px',
          minWidth: '12px',
          textAlign: 'center',
          boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.3)',
        }}>
          {score.questionsAnswered}
        </div>
      )}
    </div>
  );
}

/**
 * Bottom center bar with XP progress and ELO indicators
 * Spans center of bottom screen, fixed to bottom edge
 */
export function BottomCenterBar({
  level,
  currentXp,
  xpForCurrentLevel,
  xpForNextLevel,
  scores
}: BottomCenterBarProps) {
  const xpIntoLevel = currentXp - xpForCurrentLevel;
  const xpNeededForNextLevel = xpForNextLevel - xpForCurrentLevel;
  const progressPercent = Math.max(0, Math.min(100, (xpIntoLevel / xpNeededForNextLevel) * 100));
  const gradient = getXpGradient();

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '0',
        left: '50%',
        transform: 'translateX(-50%)',
        width: '60%',
        maxWidth: '800px',
        minWidth: '500px',
        zIndex: 100,
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        paddingBottom: '12px',
      }}
    >
      {/* ELO Subjects Row (all 3 side by side) */}
      {scores.length > 0 && (
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            gap: '8px',
            flexWrap: 'wrap',
          }}
        >
          {scores.map((score) => (
            <SubjectCompact key={score.subjectKey} score={score} />
          ))}
        </div>
      )}

      {/* XP Bar Container */}
      <div
        style={{
          width: '100%',
          background: `linear-gradient(180deg, ${MEDIEVAL_COLORS.frame.dark}E6, ${MEDIEVAL_COLORS.frame.darker}E6)`,
          border: `2px solid ${MEDIEVAL_COLORS.frame.border}`,
          borderRadius: '4px',
          boxShadow: `
            inset 0 2px 4px rgba(0, 0, 0, 0.8),
            0 2px 8px rgba(0, 0, 0, 0.6)
          `,
          padding: '6px 12px',
        }}
      >
        {/* Level and XP Label */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '4px',
          }}
        >
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}>
            <span
              style={{
                fontSize: '14px',
                fontWeight: 'bold',
                color: MEDIEVAL_COLORS.text.xp,
                textShadow: '0 0 6px rgba(255, 215, 0, 0.6), 2px 2px 3px rgba(0, 0, 0, 0.9)',
                letterSpacing: '1px',
                textTransform: 'uppercase',
              }}
            >
              Level {level}
            </span>
            <span
              style={{
                fontSize: '11px',
                color: MEDIEVAL_COLORS.text.secondary,
                opacity: 0.8,
              }}
            >
              XP: {xpIntoLevel} / {xpNeededForNextLevel}
            </span>
          </div>
          <span
            style={{
              fontSize: '12px',
              fontWeight: 'bold',
              color: MEDIEVAL_COLORS.text.xp,
              textShadow: '0 0 4px rgba(255, 215, 0, 0.6)',
            }}
          >
            {progressPercent.toFixed(0)}%
          </span>
        </div>

        {/* XP Progress Bar */}
        <div
          style={{
            width: '100%',
            height: '16px',
            background: `linear-gradient(180deg, ${MEDIEVAL_COLORS.frame.dark}, ${MEDIEVAL_COLORS.frame.darker})`,
            border: `1px solid ${MEDIEVAL_COLORS.frame.border}`,
            borderRadius: '2px',
            position: 'relative',
            overflow: 'hidden',
            boxShadow: 'inset 0 1px 3px rgba(0, 0, 0, 0.6)',
          }}
        >
          {/* Inner shadow */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: '2px',
              background: 'linear-gradient(180deg, rgba(0,0,0,0.6) 0%, transparent 100%)',
              pointerEvents: 'none',
              zIndex: 2,
            }}
          />

          {/* Fill bar */}
          <div
            style={{
              height: '100%',
              background: gradient,
              position: 'absolute',
              top: 0,
              left: 0,
              width: `${progressPercent}%`,
              transition: 'width 0.5s ease-out',
              boxShadow: `inset 0 1px 2px rgba(255, 255, 255, 0.3), 0 0 8px ${MEDIEVAL_COLORS.xp.full}80`
            }}
          />

          {/* Shine effect */}
          <div
            style={{
              position: 'absolute',
              top: '2px',
              left: 0,
              height: '40%',
              width: `${progressPercent}%`,
              background: 'linear-gradient(180deg, rgba(255,255,255,0.4) 0%, transparent 100%)',
              pointerEvents: 'none',
            }}
          />
        </div>
      </div>
    </div>
  );
}
