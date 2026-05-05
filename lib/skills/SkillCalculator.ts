/**
 * Skill Bonus Calculator
 *
 * Calculates total bonuses from allocated skills.
 * Converts UserSkill[] into SkillBonuses for use in combat/player stats.
 */

import type { UserSkill, SkillBonuses } from './types';
import { getSkillById } from './SkillDefinitions';
import { DEFAULT_SKILL_BONUSES } from './types';

/**
 * Calculate total skill bonuses from user's allocated skills
 *
 * @param userSkills Array of user skill allocations
 * @returns Calculated skill bonuses ready to apply to player
 */
export function calculateSkillBonuses(userSkills: UserSkill[]): SkillBonuses {
  // Start with default (zero) bonuses
  const bonuses: SkillBonuses = { ...DEFAULT_SKILL_BONUSES };

  // Process each allocated skill
  for (const userSkill of userSkills) {
    const skillDef = getSkillById(userSkill.skillId);
    if (!skillDef || userSkill.level <= 0) {
      continue; // Skip invalid or unallocated skills
    }

    // Calculate bonus value: effectPerLevel * allocated level
    const bonusValue = skillDef.effectPerLevel * userSkill.level;

    // Apply bonus to appropriate stat based on effect type
    switch (skillDef.effectType) {
      // Attack bonuses
      case 'damage_bonus':
        bonuses.damageBonus += bonusValue;
        break;
      case 'crit_chance':
        bonuses.critChance += bonusValue;
        break;
      case 'crit_damage':
        // Crit damage is a multiplier (e.g., 0.1 * 3 = 0.3 = +30%)
        bonuses.critMultiplier += bonusValue;
        break;
      case 'combo_damage':
        bonuses.comboBonusDamage += bonusValue;
        break;
      case 'first_strike':
        bonuses.firstStrikeDamage += bonusValue;
        break;
      case 'execute_damage':
        bonuses.executeDamage += bonusValue;
        break;
      case 'double_strike':
        bonuses.doubleStrikeChance += bonusValue;
        break;

      // Defense bonuses
      case 'max_hp':
        bonuses.maxHpBonus += bonusValue;
        break;
      case 'damage_reduction':
        bonuses.damageReduction += bonusValue;
        break;
      case 'shield_max':
        bonuses.shieldMaxBonus += bonusValue;
        break;
      case 'shield_regen':
        bonuses.shieldRegenBonus += bonusValue;
        break;
      case 'hp_regen':
        bonuses.hpRegenBonus += bonusValue;
        break;
      case 'thorns':
        bonuses.thornsDamage += bonusValue;
        break;
      case 'low_hp_damage':
        bonuses.lowHpDamageBonus += bonusValue;
        break;

      // Utility bonuses
      case 'time_bonus':
        bonuses.timeBonus += bonusValue;
        break;
      case 'xp_bonus':
        bonuses.xpBonus += bonusValue;
        break;
      case 'hint_chance':
        bonuses.hintChance += bonusValue;
        break;
      case 'treasure_quality':
        bonuses.treasureQuality += bonusValue;
        break;
      case 'fog_reveal':
        bonuses.fogRevealRadius += bonusValue;
        break;
      case 'luck_bonus':
        bonuses.luckBonus += bonusValue;
        break;
      case 'move_speed':
        bonuses.moveSpeedBonus += bonusValue;
        break;

      // Knowledge bonuses
      case 'mastery_bonus':
        bonuses.masteryBonus += bonusValue;
        break;
      case 'elimination_chance':
        bonuses.eliminationChance += bonusValue;
        break;
      case 'streak_bonus':
        bonuses.streakBonus += bonusValue;
        break;
      case 'retry_chance':
        bonuses.retryChance += bonusValue;
        break;
      case 'insight_chance':
        bonuses.insightChance += bonusValue;
        break;
    }
  }

  return bonuses;
}

/**
 * Calculate skill points that should be available based on XP
 *
 * Formula:
 * - 1 skill point per level (starting at level 2)
 * - Bonus point every 5 levels (5, 10, 15, 20...)
 *
 * @param level Player level (calculated from XP)
 * @returns Total skill points that should be awarded
 */
export function calculateSkillPointsFromLevel(level: number): number {
  if (level < 2) {
    return 0; // No skill points until level 2
  }

  const basePoints = level - 1; // 1 point per level after level 1
  const bonusPoints = Math.floor((level - 1) / 5); // Bonus every 5 levels

  return basePoints + bonusPoints;
}

/**
 * Get a specific bonus value from SkillBonuses
 *
 * @param bonuses Skill bonuses object
 * @param effectType Effect type to retrieve
 * @returns The bonus value for that effect
 */
export function getSkillBonus(bonuses: SkillBonuses, effectType: string): number {
  switch (effectType) {
    // Attack
    case 'damage_bonus':
      return bonuses.damageBonus;
    case 'crit_chance':
      return bonuses.critChance;
    case 'crit_damage':
      return bonuses.critMultiplier;
    case 'combo_damage':
      return bonuses.comboBonusDamage;
    case 'first_strike':
      return bonuses.firstStrikeDamage;
    case 'execute_damage':
      return bonuses.executeDamage;
    case 'double_strike':
      return bonuses.doubleStrikeChance;
    // Defense
    case 'max_hp':
      return bonuses.maxHpBonus;
    case 'damage_reduction':
      return bonuses.damageReduction;
    case 'shield_max':
      return bonuses.shieldMaxBonus;
    case 'shield_regen':
      return bonuses.shieldRegenBonus;
    case 'hp_regen':
      return bonuses.hpRegenBonus;
    case 'thorns':
      return bonuses.thornsDamage;
    case 'low_hp_damage':
      return bonuses.lowHpDamageBonus;
    // Utility
    case 'time_bonus':
      return bonuses.timeBonus;
    case 'xp_bonus':
      return bonuses.xpBonus;
    case 'hint_chance':
      return bonuses.hintChance;
    case 'treasure_quality':
      return bonuses.treasureQuality;
    case 'fog_reveal':
      return bonuses.fogRevealRadius;
    case 'luck_bonus':
      return bonuses.luckBonus;
    case 'move_speed':
      return bonuses.moveSpeedBonus;
    // Knowledge
    case 'mastery_bonus':
      return bonuses.masteryBonus;
    case 'elimination_chance':
      return bonuses.eliminationChance;
    case 'streak_bonus':
      return bonuses.streakBonus;
    case 'retry_chance':
      return bonuses.retryChance;
    case 'insight_chance':
      return bonuses.insightChance;
    default:
      return 0;
  }
}
