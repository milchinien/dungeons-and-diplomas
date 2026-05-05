/**
 * Skill System Types
 *
 * Type definitions for the passive skill tree system.
 * Skills provide permanent bonuses to combat, defense, and utility stats.
 */

/**
 * Skill tree categories
 */
export type SkillTreeType = 'attack' | 'defense' | 'utility' | 'knowledge';

/**
 * Skill effect types that determine what stat is modified
 */
export type SkillEffectType =
  // Attack effects
  | 'damage_bonus'
  | 'crit_chance'
  | 'crit_damage'
  | 'combo_damage'
  | 'first_strike'
  | 'execute_damage'      // Extra damage to low HP enemies
  | 'double_strike'       // Chance to hit twice
  // Defense effects
  | 'max_hp'
  | 'damage_reduction'
  | 'shield_max'
  | 'shield_regen'
  | 'hp_regen'
  | 'thorns'              // Reflect damage
  | 'low_hp_damage'       // Bonus damage when low HP
  // Utility effects
  | 'time_bonus'
  | 'xp_bonus'
  | 'hint_chance'
  | 'treasure_quality'
  | 'fog_reveal'
  | 'luck_bonus'          // General luck modifier
  | 'move_speed'          // Movement speed in dungeon
  // Knowledge effects
  | 'mastery_bonus'       // Bonus for mastered subjects
  | 'elimination_chance'  // Chance to eliminate wrong answer
  | 'streak_bonus'        // Bonus per answer streak
  | 'retry_chance'        // Chance to retry wrong answer
  | 'insight_chance';     // Show partial answer on timeout

/**
 * Skill dependency requirement
 */
export interface SkillDependency {
  /** The skill ID that must be unlocked first */
  skillId: string;
  /** Minimum level required in the dependency skill */
  requiredLevel: number;
}

/**
 * Skill definition (static skill data)
 */
export interface SkillDefinition {
  /** Unique skill identifier (e.g., 'atk_damage') */
  id: string;
  /** Which skill tree this belongs to */
  tree: SkillTreeType;
  /** Display name (German) */
  name: string;
  /** Description text (German) */
  description: string;
  /** Icon identifier (emoji or image path) */
  icon: string;
  /** Maximum skill level */
  maxLevel: number;
  /** What type of effect this skill provides */
  effectType: SkillEffectType;
  /** Effect value added per skill level */
  effectPerLevel: number;
  /** Skills that must be unlocked before this one */
  dependencies: SkillDependency[];
}

/**
 * User's skill allocation (from database)
 */
export interface UserSkill {
  /** The skill ID */
  skillId: string;
  /** Current level allocated (0 to maxLevel) */
  level: number;
}

/**
 * User's skill points (from database)
 */
export interface SkillPoints {
  /** Total skill points ever awarded */
  totalPoints: number;
  /** Points currently spent on skills */
  spentPoints: number;
  /** Points available to spend */
  availablePoints: number;
}

/**
 * Calculated bonuses from all allocated skills
 *
 * These values are computed from UserSkill[] and applied to player stats.
 * All bonuses are additive with equipment bonuses.
 */
export interface SkillBonuses {
  // Attack bonuses
  /** Extra damage on correct answers */
  damageBonus: number;
  /** Critical hit chance (0-100%) */
  critChance: number;
  /** Critical hit damage multiplier (e.g., 1.3 = 130% damage) */
  critMultiplier: number;
  /** Extra damage from combo counter */
  comboBonusDamage: number;
  /** Extra damage on first hit in combat */
  firstStrikeDamage: number;
  /** Extra damage when enemy HP below 30% */
  executeDamage: number;
  /** Chance to deal damage twice (0-100%) */
  doubleStrikeChance: number;

  // Defense bonuses
  /** Extra maximum HP */
  maxHpBonus: number;
  /** Damage reduction on wrong answers */
  damageReduction: number;
  /** Extra maximum shield points */
  shieldMaxBonus: number;
  /** Shield regeneration rate bonus (per second) */
  shieldRegenBonus: number;
  /** HP regeneration rate bonus */
  hpRegenBonus: number;
  /** Damage reflected back to enemies (percentage) */
  thornsDamage: number;
  /** Bonus damage when player HP below 30% */
  lowHpDamageBonus: number;

  // Utility bonuses
  /** Extra time per question (seconds) */
  timeBonus: number;
  /** XP bonus percentage (e.g., 50 = +50%) */
  xpBonus: number;
  /** Hint chance percentage (0-100%) */
  hintChance: number;
  /** Treasure quality percentage bonus */
  treasureQuality: number;
  /** Fog of war reveal radius extension (tiles) */
  fogRevealRadius: number;
  /** Luck modifier for random events (0-100) */
  luckBonus: number;
  /** Movement speed bonus percentage */
  moveSpeedBonus: number;

  // Knowledge bonuses
  /** Bonus damage for mastered subjects (percentage) */
  masteryBonus: number;
  /** Chance to eliminate one wrong answer (0-100%) */
  eliminationChance: number;
  /** Bonus damage per consecutive correct answer */
  streakBonus: number;
  /** Chance to retry a wrong answer (0-100%) */
  retryChance: number;
  /** Chance to show partial answer on timeout (0-100%) */
  insightChance: number;
}

/**
 * Default skill bonuses (no skills allocated)
 */
export const DEFAULT_SKILL_BONUSES: SkillBonuses = {
  // Attack
  damageBonus: 0,
  critChance: 0,
  critMultiplier: 1.0, // No bonus (100% damage)
  comboBonusDamage: 0,
  firstStrikeDamage: 0,
  executeDamage: 0,
  doubleStrikeChance: 0,
  // Defense
  maxHpBonus: 0,
  damageReduction: 0,
  shieldMaxBonus: 0,
  shieldRegenBonus: 0,
  hpRegenBonus: 0,
  thornsDamage: 0,
  lowHpDamageBonus: 0,
  // Utility
  timeBonus: 0,
  xpBonus: 0,
  hintChance: 0,
  treasureQuality: 0,
  fogRevealRadius: 0,
  luckBonus: 0,
  moveSpeedBonus: 0,
  // Knowledge
  masteryBonus: 0,
  eliminationChance: 0,
  streakBonus: 0,
  retryChance: 0,
  insightChance: 0,
};

/**
 * Skill allocation result (from API)
 */
export interface SkillAllocationResult {
  /** Whether allocation succeeded */
  success: boolean;
  /** New skill level after allocation */
  newLevel?: number;
  /** Remaining available points */
  availablePoints?: number;
  /** Updated skill bonuses */
  bonuses?: SkillBonuses;
  /** Error message if failed */
  error?: string;
}

/**
 * Validation result for skill allocation
 */
export interface SkillValidationResult {
  /** Whether the allocation is valid */
  valid: boolean;
  /** Error message if invalid */
  error?: string;
  /** Missing dependency skill IDs */
  missingDependencies?: string[];
}
