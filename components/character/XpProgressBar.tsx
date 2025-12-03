'use client';

interface XpProgressBarProps {
  currentXp: number;
  xpForCurrentLevel: number;
  xpForNextLevel: number;
}

/**
 * XP progress bar showing current level progress
 */
export function XpProgressBar({ currentXp, xpForCurrentLevel, xpForNextLevel }: XpProgressBarProps) {
  const xpIntoLevel = currentXp - xpForCurrentLevel;
  const xpNeededForNextLevel = xpForNextLevel - xpForCurrentLevel;
  const progressPercent = (xpIntoLevel / xpNeededForNextLevel) * 100;

  return (
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
  );
}
