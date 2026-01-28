/**
 * Skill Allocation Validator
 *
 * Validates skill allocations before applying them.
 * Checks dependencies, skill points, and max level constraints.
 */

import type { UserSkill, SkillValidationResult, SkillPoints } from './types';
import { getSkillById } from './SkillDefinitions';

/**
 * Validate if a skill can be allocated (level increased by 1)
 *
 * Checks:
 * 1. Skill exists
 * 2. Not at max level
 * 3. User has available skill points
 * 4. Dependencies are satisfied
 *
 * @param skillId The skill to allocate
 * @param userSkills Current user skill allocations
 * @param skillPoints Current user skill points
 * @returns Validation result with error message if invalid
 */
export function validateSkillAllocation(
  skillId: string,
  userSkills: UserSkill[],
  skillPoints: SkillPoints
): SkillValidationResult {
  // Check if skill exists
  const skillDef = getSkillById(skillId);
  if (!skillDef) {
    return {
      valid: false,
      error: `Skill "${skillId}" existiert nicht.`,
    };
  }

  // Check if user has available points
  if (skillPoints.availablePoints <= 0) {
    return {
      valid: false,
      error: 'Keine Skill-Punkte verfügbar.',
    };
  }

  // Get current level of this skill
  const currentSkill = userSkills.find((s) => s.skillId === skillId);
  const currentLevel = currentSkill?.level ?? 0;

  // Check if already at max level
  if (currentLevel >= skillDef.maxLevel) {
    return {
      valid: false,
      error: `${skillDef.name} ist bereits auf Maximum (Level ${skillDef.maxLevel}).`,
    };
  }

  // Check dependencies
  const missingDeps: string[] = [];
  for (const dep of skillDef.dependencies) {
    const depSkill = userSkills.find((s) => s.skillId === dep.skillId);
    const depLevel = depSkill?.level ?? 0;

    if (depLevel < dep.requiredLevel) {
      const depSkillDef = getSkillById(dep.skillId);
      const depName = depSkillDef?.name ?? dep.skillId;
      missingDeps.push(`${depName} (Level ${dep.requiredLevel})`);
    }
  }

  if (missingDeps.length > 0) {
    return {
      valid: false,
      error: `Benötigt: ${missingDeps.join(', ')}`,
      missingDependencies: skillDef.dependencies.map((d) => d.skillId),
    };
  }

  // All checks passed
  return {
    valid: true,
  };
}

/**
 * Check if a skill's dependencies are satisfied
 *
 * @param skillId The skill to check
 * @param userSkills Current user skill allocations
 * @returns True if all dependencies are met
 */
export function areDependenciesSatisfied(
  skillId: string,
  userSkills: UserSkill[]
): boolean {
  const skillDef = getSkillById(skillId);
  if (!skillDef) return false;

  for (const dep of skillDef.dependencies) {
    const depSkill = userSkills.find((s) => s.skillId === dep.skillId);
    const depLevel = depSkill?.level ?? 0;

    if (depLevel < dep.requiredLevel) {
      return false;
    }
  }

  return true;
}

/**
 * Get missing dependencies for a skill
 *
 * @param skillId The skill to check
 * @param userSkills Current user skill allocations
 * @returns Array of missing dependency skill IDs
 */
export function getMissingDependencies(
  skillId: string,
  userSkills: UserSkill[]
): string[] {
  const skillDef = getSkillById(skillId);
  if (!skillDef) return [];

  const missing: string[] = [];

  for (const dep of skillDef.dependencies) {
    const depSkill = userSkills.find((s) => s.skillId === dep.skillId);
    const depLevel = depSkill?.level ?? 0;

    if (depLevel < dep.requiredLevel) {
      missing.push(dep.skillId);
    }
  }

  return missing;
}

/**
 * Check if a skill is at maximum level
 *
 * @param skillId The skill to check
 * @param userSkills Current user skill allocations
 * @returns True if skill is at max level
 */
export function isSkillMaxed(skillId: string, userSkills: UserSkill[]): boolean {
  const skillDef = getSkillById(skillId);
  if (!skillDef) return false;

  const currentSkill = userSkills.find((s) => s.skillId === skillId);
  const currentLevel = currentSkill?.level ?? 0;

  return currentLevel >= skillDef.maxLevel;
}

/**
 * Get the current level of a skill
 *
 * @param skillId The skill ID
 * @param userSkills Current user skill allocations
 * @returns Current level (0 if not allocated)
 */
export function getSkillLevel(skillId: string, userSkills: UserSkill[]): number {
  const skill = userSkills.find((s) => s.skillId === skillId);
  return skill?.level ?? 0;
}
