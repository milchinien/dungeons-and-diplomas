'use client';

import type { SkillDefinition, UserSkill } from '@/lib/skills/types';
import { COLORS } from '@/lib/ui/colors';

interface SkillNodeProps {
  skill: SkillDefinition;
  currentLevel: number;
  canAllocate: boolean;
  isLocked: boolean;
  onClick: () => void;
}

export default function SkillNode({ skill, currentLevel, canAllocate, isLocked, onClick }: SkillNodeProps) {
  const isMaxed = currentLevel >= skill.maxLevel;
  const isAllocated = currentLevel > 0;

  // Determine node state color
  let borderColor = '#555';
  let bgColor = 'rgba(40, 40, 40, 0.9)';
  let iconOpacity = 0.3;

  if (isMaxed) {
    borderColor = '#fbbf24'; // Gold
    bgColor = 'rgba(251, 191, 36, 0.15)';
    iconOpacity = 1;
  } else if (isAllocated) {
    borderColor = '#4ade80'; // Green
    bgColor = 'rgba(74, 222, 128, 0.1)';
    iconOpacity = 0.8;
  } else if (canAllocate) {
    borderColor = '#fff';
    bgColor = 'rgba(255, 255, 255, 0.05)';
    iconOpacity = 0.5;
  } else if (isLocked) {
    borderColor = '#444';
    bgColor = 'rgba(30, 30, 30, 0.9)';
    iconOpacity = 0.2;
  }

  return (
    <div
      onClick={!isLocked && canAllocate && !isMaxed ? onClick : undefined}
      style={{
        position: 'relative',
        width: '80px',
        height: '80px',
        border: `3px solid ${borderColor}`,
        borderRadius: '12px',
        backgroundColor: bgColor,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: !isLocked && canAllocate && !isMaxed ? 'pointer' : 'default',
        transition: 'all 0.2s',
        boxShadow: canAllocate && !isMaxed ? `0 0 15px ${borderColor}40` : 'none',
      }}
      onMouseEnter={(e) => {
        if (!isLocked && canAllocate && !isMaxed) {
          e.currentTarget.style.transform = 'scale(1.05)';
          e.currentTarget.style.boxShadow = `0 0 20px ${borderColor}60`;
        }
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'scale(1)';
        e.currentTarget.style.boxShadow = canAllocate && !isMaxed ? `0 0 15px ${borderColor}40` : 'none';
      }}
    >
      {/* Icon */}
      <div style={{ fontSize: '32px', opacity: iconOpacity }}>{skill.icon}</div>

      {/* Level indicator */}
      <div
        style={{
          marginTop: '4px',
          fontSize: '11px',
          color: isMaxed ? '#fbbf24' : '#fff',
          fontWeight: 600,
        }}
      >
        {currentLevel}/{skill.maxLevel}
      </div>

      {/* Lock icon if locked */}
      {isLocked && (
        <div
          style={{
            position: 'absolute',
            top: '4px',
            right: '4px',
            fontSize: '14px',
            color: '#888',
          }}
        >
          🔒
        </div>
      )}

      {/* Skill name tooltip on hover */}
      <div
        style={{
          position: 'absolute',
          bottom: '-25px',
          left: '50%',
          transform: 'translateX(-50%)',
          backgroundColor: 'rgba(0, 0, 0, 0.9)',
          padding: '4px 8px',
          borderRadius: '4px',
          fontSize: '10px',
          color: '#fff',
          whiteSpace: 'nowrap',
          opacity: 0,
          pointerEvents: 'none',
          transition: 'opacity 0.2s',
        }}
        className="skill-tooltip"
      >
        {skill.name}
      </div>

      <style jsx>{`
        div:hover .skill-tooltip {
          opacity: 1;
        }
      `}</style>
    </div>
  );
}
