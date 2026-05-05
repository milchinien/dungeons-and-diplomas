/**
 * Gold reward and pricing calculations
 */

/**
 * Calculate gold reward for defeating an enemy.
 * Formula: enemyLevel * 10
 *
 * @param enemyLevel - Enemy level (1-10)
 * @returns Gold amount rewarded
 *
 * Examples:
 * - Level 1 enemy: 10 gold
 * - Level 5 enemy: 50 gold
 * - Level 10 enemy: 100 gold
 */
export function calculateEnemyGoldReward(enemyLevel: number): number {
  return enemyLevel * 10;
}

/**
 * Calculate sell price for an item or perk.
 * Formula: originalCost * 0.5 (50% refund)
 *
 * @param originalCost - Original purchase price
 * @returns Gold amount refunded (50% of original cost)
 *
 * Examples:
 * - Common item (100 gold): 50 gold refund
 * - Legendary item (500 gold): 250 gold refund
 */
export function calculateSellPrice(originalCost: number): number {
  return Math.floor(originalCost * 0.5);
}
