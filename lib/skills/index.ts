/**
 * Skill System - Main Export
 */

// Types
export type {
  SkillTreeType,
  SkillEffectType,
  SkillDependency,
  SkillDefinition,
  UserSkill,
  SkillPoints,
  SkillBonuses,
  SkillAllocationResult,
  SkillValidationResult,
} from './types';

export { DEFAULT_SKILL_BONUSES } from './types';

// Definitions
export {
  ATTACK_SKILLS,
  DEFENSE_SKILLS,
  UTILITY_SKILLS,
  KNOWLEDGE_SKILLS,
  ALL_SKILLS,
  SKILLS_BY_TREE,
  TOTAL_SKILLS,
  getSkillById,
  getSkillsByTree,
} from './SkillDefinitions';

// Calculator
export {
  calculateSkillBonuses,
  calculateSkillPointsFromLevel,
  getSkillBonus,
} from './SkillCalculator';

// Validator
export {
  validateSkillAllocation,
  areDependenciesSatisfied,
  getMissingDependencies,
  isSkillMaxed,
  getSkillLevel,
} from './SkillValidator';
