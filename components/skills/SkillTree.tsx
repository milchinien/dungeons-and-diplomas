'use client';

import type { SkillTreeType, SkillDefinition, UserSkill, SkillPoints } from '@/lib/skills/types';
import { getSkillsByTree } from '@/lib/skills/SkillDefinitions';
import { areDependenciesSatisfied, getSkillLevel } from '@/lib/skills/SkillValidator';
import SkillNode from './SkillNode';
import { SKILL_TREE_NAMES } from '@/lib/constants';

interface SkillTreeProps {
  treeType: SkillTreeType;
  userSkills: UserSkill[];
  skillPoints: SkillPoints;
  onAllocate: (skillId: string) => void;
}

export default function SkillTree({ treeType, userSkills, skillPoints, onAllocate }: SkillTreeProps) {
  const skills = getSkillsByTree(treeType);
  const hasPoints = skillPoints.availablePoints > 0;

  return (
    <div style={{ padding: '20px' }}>
      {/* Tree Title */}
      <h3
        style={{
          textAlign: 'center',
          marginBottom: '24px',
          fontSize: '20px',
          fontWeight: 700,
          color: '#fff',
        }}
      >
        {SKILL_TREE_NAMES[treeType]}
      </h3>

      {/* Skills Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: '20px',
          justifyItems: 'center',
        }}
      >
        {skills.map((skill) => {
          const currentLevel = getSkillLevel(skill.id, userSkills);
          const dependenciesSatisfied = areDependenciesSatisfied(skill.id, userSkills);
          const isLocked = !dependenciesSatisfied;
          const canAllocate = hasPoints && dependenciesSatisfied;

          return (
            <div key={skill.id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <SkillNode
                skill={skill}
                currentLevel={currentLevel}
                canAllocate={canAllocate}
                isLocked={isLocked}
                onClick={() => onAllocate(skill.id)}
              />
              {/* Skill info below node */}
              <div style={{ marginTop: '8px', textAlign: 'center', maxWidth: '140px' }}>
                <div style={{ fontSize: '12px', fontWeight: 600, color: '#fff', marginBottom: '2px' }}>
                  {skill.name}
                </div>
                <div style={{ fontSize: '10px', color: '#aaa', lineHeight: '1.3' }}>
                  {skill.description}
                </div>
                <div style={{ fontSize: '10px', marginTop: '4px' }}>
                  <span style={{ color: '#4ade80' }}>
                    Gesamt: +{skill.effectPerLevel * currentLevel}
                  </span>
                  <span style={{ color: '#888', marginLeft: '6px' }}>
                    (+{skill.effectPerLevel}/Lvl)
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
