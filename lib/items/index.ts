/**
 * Item system exports
 */

export * from './types';
export { getRandomCommonItem, getRandomRareItem, getRandomItemByRarity, getItemById, getAllSlots } from './itemDatabase';
export { generateEnemyLoot, generateTreasureLoot, generateBossLoot, isBoss } from './LootGenerator';
export { calculateEquipmentBonuses, getEquipmentBonus, DEFAULT_BONUSES } from './EquipmentBonusCalculator';
export type { Equipment, EquipmentBonuses } from './EquipmentBonusCalculator';
