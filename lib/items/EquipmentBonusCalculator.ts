/**
 * Equipment Bonus Calculator
 * Calculates total bonuses from all equipped items
 */

import type { ItemDefinition, ItemEffectType } from './types';

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
