/**
 * Shop system exports
 */

// Rarity system
export { Rarity, RARITY_CONFIG, rollRarity, getRarityColor, getRarityMultiplier, getRarityGlow } from './Rarity';
export type { RarityConfig } from './Rarity';

// Item system
export { ItemType, ItemEffectType, ITEM_DEFINITIONS, createItem, generateRandomItem, getItemEffectDescription, getItemDefinition } from './Item';
export type { Item, ItemDefinition } from './Item';

// Perk system
export { PerkType, PERK_DEFINITIONS, createPerk, generateRandomPerk, getPerkEffectDescription, getPerkDefinition } from './Perk';
export type { Perk, PerkDefinition } from './Perk';

// Shop inventory
export { generateShopInventory, purchaseItem, purchasePerk, hasAvailableItems, hasAvailablePerks, isShopEmpty, countAvailableItems, countAvailablePerks } from './ShopInventory';
export type { ShopInventory } from './ShopInventory';

// Shop layout
export { getShopLayout, clearLayoutCache, calculateFloatingY, isCounterTile, getAllCounterTiles } from './ShopLayout';
export type { ShopLayout, Position as ShopLayoutPosition } from './ShopLayout';

// Shop interaction
export { getInteractionTarget, getNearbyItem, getNearbyPerk, getShopRooms, getPlayerShopRoom } from './ShopInteraction';
export type { InteractionTarget } from './ShopInteraction';

// Shop purchase
export { createPlayerShopData, calculateBonusStats, applyItemToShopData, applyPerkToShopData, executeItemPurchase, executePerkPurchase } from './ShopPurchase';
export type { PlayerShopData } from './ShopPurchase';

// Shop effects (runtime effects like regeneration, speed)
export { updateShopRegeneration, resetShopRegenTimer, getEffectiveSpeed, getSpeedMultiplier, getEffectiveMaxHp } from './ShopEffects';
