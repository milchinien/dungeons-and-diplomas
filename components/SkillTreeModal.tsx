'use client';

import { useState } from 'react';
import type { UserSkill, SkillPoints, SkillTreeType } from '@/lib/skills/types';
import SkillTree from './skills/SkillTree';
import { COLORS } from '@/lib/ui/colors';

interface SkillTreeModalProps {
  userId: number;
  userSkills: UserSkill[];
  skillPoints: SkillPoints;
  onClose: () => void;
  onSkillAllocated: (skills: UserSkill[], availablePoints: number) => void;
}

export default function SkillTreeModal({
  userId,
  userSkills,
  skillPoints,
  onClose,
  onSkillAllocated,
}: SkillTreeModalProps) {
  const [activeTab, setActiveTab] = useState<SkillTreeType>('attack');
  const [localSkills, setLocalSkills] = useState<UserSkill[]>(userSkills);
  const [localPoints, setLocalPoints] = useState<SkillPoints>(skillPoints);
  const [isAllocating, setIsAllocating] = useState(false);

  const handleAllocate = async (skillId: string) => {
    if (isAllocating || localPoints.availablePoints <= 0) return;

    setIsAllocating(true);
    try {
      const response = await fetch('/api/skills/allocate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, skillId }),
      });

      if (response.ok) {
        const data = await response.json();

        // Update local state
        const updatedSkills = localSkills.map((s) =>
          s.skillId === skillId ? { ...s, level: data.newLevel } : s
        );

        // Add new skill if not exists
        if (!updatedSkills.find((s) => s.skillId === skillId)) {
          updatedSkills.push({ skillId, level: 1 });
        }

        const updatedPoints = {
          ...localPoints,
          availablePoints: data.availablePoints,
          spentPoints: localPoints.spentPoints + 1,
        };

        setLocalSkills(updatedSkills);
        setLocalPoints(updatedPoints);
        onSkillAllocated(updatedSkills, data.availablePoints);
      } else {
        const error = await response.json();
        alert(error.error || 'Skill konnte nicht zugewiesen werden');
      }
    } catch (error) {
      console.error('Failed to allocate skill:', error);
      alert('Fehler beim Zuweisen des Skills');
    } finally {
      setIsAllocating(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.85)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: '#1a1a1a',
          border: '3px solid #555',
          borderRadius: '12px',
          width: '90%',
          maxWidth: '800px',
          maxHeight: '85vh',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: '20px',
            borderBottom: '2px solid #333',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <h2 style={{ fontSize: '24px', fontWeight: 700, color: '#fff', margin: 0 }}>Skill Baum</h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ fontSize: '14px', color: '#fbbf24', fontWeight: 600 }}>
              Verfügbare Punkte: {localPoints.availablePoints}
            </div>
            <button
              onClick={onClose}
              style={{
                background: 'none',
                border: 'none',
                color: '#fff',
                fontSize: '24px',
                cursor: 'pointer',
                padding: 0,
                width: '32px',
                height: '32px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              ×
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', borderBottom: '2px solid #333' }}>
          {(['attack', 'defense', 'utility', 'knowledge'] as SkillTreeType[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                flex: 1,
                padding: '12px 8px',
                background: activeTab === tab ? '#2a2a2a' : '#1a1a1a',
                border: 'none',
                borderBottom: activeTab === tab ? '3px solid #4ade80' : 'none',
                color: activeTab === tab ? '#fff' : '#888',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
            >
              {tab === 'attack' && '⚔️ Angriff'}
              {tab === 'defense' && '🛡️ Verteidigung'}
              {tab === 'utility' && '⚡ Nutzen'}
              {tab === 'knowledge' && '📖 Wissen'}
            </button>
          ))}
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>
          <SkillTree
            treeType={activeTab}
            userSkills={localSkills}
            skillPoints={localPoints}
            onAllocate={handleAllocate}
          />
        </div>

        {/* Footer */}
        <div
          style={{
            padding: '16px 20px',
            borderTop: '2px solid #333',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontSize: '12px',
            color: '#888',
          }}
        >
          <div>Ausgegeben: {localPoints.spentPoints} / {localPoints.totalPoints}</div>
          <div>Taste: K zum Schließen</div>
        </div>
      </div>
    </div>
  );
}
