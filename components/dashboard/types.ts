// Types for SkillDashboard components

export interface MasteryLevel {
  label: string;
  color: string;
  icon: string;
  bgColor: string;
}

export function getMasteryLevel(elo: number): MasteryLevel {
  // Perfect mastery: 9.5+ rounds to 10, display as gold
  if (Math.round(elo) >= 10) {
    return {
      label: '👑 Perfect',
      color: '#FFD700',
      icon: '👑',
      bgColor: 'rgba(255, 215, 0, 0.1)'
    };
  } else if (elo >= 8) {
    return {
      label: '⚔️ Master',
      color: '#4CAF50',
      icon: '⚔️',
      bgColor: 'rgba(76, 175, 80, 0.1)'
    };
  } else if (elo >= 5) {
    return {
      label: '🛡️ Advanced',
      color: '#2196F3',
      icon: '🛡️',
      bgColor: 'rgba(33, 150, 243, 0.1)'
    };
  } else {
    return {
      label: '⚠️ Beginner',
      color: '#ff9800',
      icon: '⚠️',
      bgColor: 'rgba(255, 152, 0, 0.1)'
    };
  }
}
