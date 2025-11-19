import { Item, ItemEffect, Player } from '../types/game';

/**
 * Apply an item's effect to the player
 * @param player - Current player state
 * @param item - Item to use
 * @returns Updated player state
 */
export function applyItemEffect(player: Player, item: Item): Player {
  const updatedPlayer = { ...player };

  switch (item.effect) {
    case ItemEffect.HEAL:
      // Heal 30 HP, but don't exceed max HP
      updatedPlayer.currentHp = Math.min(player.maxHp, player.currentHp + 30);
      break;

    case ItemEffect.MAX_HP:
      // Increase max HP by 20 and heal the same amount
      updatedPlayer.maxHp = player.maxHp + 20;
      updatedPlayer.currentHp = player.currentHp + 20;
      break;

    case ItemEffect.DAMAGE_BOOST:
      // Damage boost is handled in combat logic
      // For now, we just acknowledge the item was used
      // This would require extending the Player interface with a damage stat
      break;

    case ItemEffect.SHIELD:
      // Shield effect would require extending Player interface with a shield stat
      // For now, we just acknowledge the item was used
      break;

    default:
      console.warn(`Unknown item effect: ${item.effect}`);
  }

  return updatedPlayer;
}

/**
 * Check if an item can be used in the current context
 * @param player - Current player state
 * @param item - Item to check
 * @returns Whether the item can be used
 */
export function canUseItem(player: Player, item: Item): boolean {
  switch (item.effect) {
    case ItemEffect.HEAL:
      // Can't use healing potion if already at full HP
      return player.currentHp < player.maxHp;

    case ItemEffect.MAX_HP:
    case ItemEffect.DAMAGE_BOOST:
    case ItemEffect.SHIELD:
      // These can always be used
      return true;

    default:
      return true;
  }
}
