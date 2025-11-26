'use client';

import { CharacterHeader } from './character/CharacterHeader';
import { XpProgressBar } from './character/XpProgressBar';
import { MasteryCircles } from './character/MasteryCircles';
import { ActionButtons } from './character/ActionButtons';
import type { SubjectScore } from './character/MasteryCircles';

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

/**
 * Character panel displaying player info, XP, mastery, and actions
 */
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
      <CharacterHeader username={username} level={level} />

      <XpProgressBar
        currentXp={currentXp}
        xpForCurrentLevel={xpForCurrentLevel}
        xpForNextLevel={xpForNextLevel}
      />

      <MasteryCircles scores={scores} />

      <ActionButtons
        onRestart={onRestart}
        onSkills={onSkills}
        onLogout={onLogout}
      />
    </div>
  );
}
