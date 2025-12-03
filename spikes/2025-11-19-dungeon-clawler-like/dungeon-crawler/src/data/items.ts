import { Item, ItemEffect } from '../types/game';

export const shopItems: Item[] = [
  {
    id: 'heal-potion',
    name: 'Heiltrank',
    description: 'Stellt 30 HP wieder her',
    price: 20,
    effect: ItemEffect.HEAL,
  },
  {
    id: 'max-hp-potion',
    name: 'Lebenskraft-Trank',
    description: 'Erhöht maximale HP um 20',
    price: 50,
    effect: ItemEffect.MAX_HP,
  },
  {
    id: 'damage-boost',
    name: 'Schadensverstärker',
    description: 'Erhöht Schaden um 10',
    price: 40,
    effect: ItemEffect.DAMAGE_BOOST,
  },
  {
    id: 'shield',
    name: 'Schild',
    description: 'Blockiert einmal Schaden',
    price: 30,
    effect: ItemEffect.SHIELD,
  },
];
