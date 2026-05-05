/**
 * Equipment Bonus Calculator
 * Calculates total bonuses from all equipped items
 * Extended to combine equipment and skill bonuses
 */

import type { ItemDefinition, ItemEffectType } from './types';
import type { UserSkill, SkillBonuses } from '../skills/types';
import { calculateSkillBonuses } from '../skills/SkillCalculator';

// Equipment state type (matches InventoryModal)
export interface Equipment {
  helm: ItemDefinition | null;
  brustplatte: ItemDefinition | null;
  schwert: ItemDefinition | null;
  schild: ItemDefinition | null;
  hose: ItemDefinition | null;
  schuhe: ItemDefinition | null;
}

// Calculated bonuses from all equipped items
export interface EquipmentBonuses {
  maxHpBonus: number;
  damageBonus: number;
  damageReduction: number;
  timeBonus: number;
  xpBonus: number;
  hintChance: number;
}

/**
 * Combined bonuses from equipment AND skills
 * Extends EquipmentBonuses with skill-only bonuses
 */
export interface CombinedBonuses extends EquipmentBonuses {
  // Skill-only bonuses (not from equipment)
  critChance: number; // 0-100%
  critMultiplier: number; // 1.0 + bonus (e.g., 1.3 for +30%)
  comboBonusDamage: number;
  firstStrikeDamage: number;
  shieldMaxBonus: number;
  shieldRegenBonus: number;
  hpRegenBonus: number;
  treasureQuality: number;
  fogRevealRadius: number;
}

// Default bonuses (no equipment)
export const DEFAULT_BONUSES: EquipmentBonuses = {
  maxHpBonus: 0,
  damageBonus: 0,
  damageReduction: 0,
  timeBonus: 0,
  xpBonus: 0,
  hintChance: 0,
};

/**
 * Calculate total bonuses from all equipped items
 */
export function calculateEquipmentBonuses(equipment: Equipment): EquipmentBonuses {
  const bonuses: EquipmentBonuses = { ...DEFAULT_BONUSES };

  // Get all equipped items
  const equippedItems = Object.values(equipment).filter((item): item is ItemDefinition => item !== null);

  // Sum up all effects from all equipped items
  for (const item of equippedItems) {
    if (!item.effects) continue;

    for (const effect of item.effects) {
      switch (effect.type) {
        case 'max_hp':
          bonuses.maxHpBonus += effect.value;
          break;
        case 'damage_boost':
          bonuses.damageBonus += effect.value;
          break;
        case 'damage_reduction':
          bonuses.damageReduction += effect.value;
          break;
        case 'time_boost':
          bonuses.timeBonus += effect.value;
          break;
        case 'xp_boost':
          bonuses.xpBonus += effect.value;
          break;
        case 'hint_chance':
          bonuses.hintChance += effect.value;
          break;
      }
    }
  }

  return bonuses;
}

/**
 * Get a specific bonus value from equipment
 */
export function getEquipmentBonus(equipment: Equipment, effectType: ItemEffectType): number {
  const bonuses = calculateEquipmentBonuses(equipment);

  switch (effectType) {
    case 'max_hp':
      return bonuses.maxHpBonus;
    case 'damage_boost':
      return bonuses.damageBonus;
    case 'damage_reduction':
      return bonuses.damageReduction;
    case 'time_boost':
      return bonuses.timeBonus;
    case 'xp_boost':
      return bonuses.xpBonus;
    case 'hint_chance':
      return bonuses.hintChance;
    default:
      return 0;
  }
}

/**
 * Calculate combined bonuses from equipment AND skills
 *
 * @param equipment Currently equipped items
 * @param userSkills User's skill allocations
 * @returns Combined bonuses from both sources
 */
export function calculateCombinedBonuses(
  equipment: Equipment,
  userSkills: UserSkill[]
): CombinedBonuses {
  // Get equipment bonuses
  const equipmentBonuses = calculateEquipmentBonuses(equipment);

  // Get skill bonuses
  const skillBonuses: SkillBonuses = calculateSkillBonuses(userSkills);

  // Combine them
  return {
    // Equipment bonuses (additive with skills where applicable)
    maxHpBonus: equipmentBonuses.maxHpBonus + skillBonuses.maxHpBonus,
    damageBonus: equipmentBonuses.damageBonus + skillBonuses.damageBonus,
    damageReduction: equipmentBonuses.damageReduction + skillBonuses.damageReduction,
    timeBonus: equipmentBonuses.timeBonus + skillBonuses.timeBonus,
    xpBonus: equipmentBonuses.xpBonus + skillBonuses.xpBonus,
    hintChance: equipmentBonuses.hintChance + skillBonuses.hintChance,

    // Skill-only bonuses
    critChance: skillBonuses.critChance,
    critMultiplier: skillBonuses.critMultiplier,
    comboBonusDamage: skillBonuses.comboBonusDamage,
    firstStrikeDamage: skillBonuses.firstStrikeDamage,
    shieldMaxBonus: skillBonuses.shieldMaxBonus,
    shieldRegenBonus: skillBonuses.shieldRegenBonus,
    hpRegenBonus: skillBonuses.hpRegenBonus,
    treasureQuality: skillBonuses.treasureQuality,
    fogRevealRadius: skillBonuses.fogRevealRadius,
  };
}

/**
 * Default combined bonuses (no equipment, no skills)
 */
export const DEFAULT_COMBINED_BONUSES: CombinedBonuses = {
  maxHpBonus: 0,
  damageBonus: 0,
  damageReduction: 0,
  timeBonus: 0,
  xpBonus: 0,
  hintChance: 0,
  critChance: 0,
  critMultiplier: 1.0,
  comboBonusDamage: 0,
  firstStrikeDamage: 0,
  shieldMaxBonus: 0,
  shieldRegenBonus: 0,
  hpRegenBonus: 0,
  treasureQuality: 0,
  fogRevealRadius: 0,
};
