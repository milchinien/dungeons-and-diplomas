/**
 * Item database - loads items from JSON definitions
 */

import type { ItemDefinition, ItemRarity, EquipmentSlotKey } from './types';
import { RARITY_CONFIG } from './types';

// Pre-defined common items (from JSON files)
const COMMON_ITEMS: ItemDefinition[] = [
  {
    id: "equipment_helm_topf",
    name: "Verbeulter Topfhelm",
    description: "Ein alter Kochtopf, der notduerftig als Helm umfunktioniert wurde. Die Henkel wurden abgesaegt, aber man sieht noch die Stellen. Riecht leicht nach Eintopf.",
    type: "equipment",
    rarity: "common",
    slot: "helm",
    iconPath: "/Assets/Items/Icons/equipment_helm_topf.svg",
    spritePath: "/Assets/Items/Icons/equipment_helm_topf.svg",
    stackable: false,
    maxStack: 1,
    value: 5,
    effects: [{ type: "max_hp", value: 5 }],
    droppable: true,
    tradeable: true,
    questItem: false
  },
  {
    id: "equipment_brustplatte_geflickt",
    name: "Geflickte Ledertunika",
    description: "Eine abgetragene Ledertunika mit diversen Flicken. Jeder Flicken erzaehlt eine Geschichte - meistens davon, wie der Vorbesitzer getroffen wurde.",
    type: "equipment",
    rarity: "common",
    slot: "brustplatte",
    iconPath: "/Assets/Items/Icons/equipment_brustplatte_geflickt.svg",
    spritePath: "/Assets/Items/Icons/equipment_brustplatte_geflickt.svg",
    stackable: false,
    maxStack: 1,
    value: 8,
    effects: [{ type: "max_hp", value: 10 }],
    droppable: true,
    tradeable: true,
    questItem: false
  },
  {
    id: "equipment_schwert_rostig",
    name: "Rostiges Kurzschwert",
    description: "Ein Kurzschwert, das bessere Tage gesehen hat. Der Rost hat sich bereits in die Klinge gefressen und der Griff ist mit altem Stoff umwickelt.",
    type: "equipment",
    rarity: "common",
    slot: "schwert",
    iconPath: "/Assets/Items/Icons/equipment_schwert_rostig.svg",
    spritePath: "/Assets/Items/Icons/equipment_schwert_rostig.svg",
    stackable: false,
    maxStack: 1,
    value: 6,
    effects: [{ type: "damage_boost", value: 1 }],
    droppable: true,
    tradeable: true,
    questItem: false
  },
  {
    id: "equipment_schild_brett",
    name: "Holzbrett mit Griff",
    description: "Ein Stueck Holz aus einer alten Scheunentuer, an das jemand einen Lederriemen genagelt hat. Es haelt Schlaege ab - zumindest ein paar.",
    type: "equipment",
    rarity: "common",
    slot: "schild",
    iconPath: "/Assets/Items/Icons/equipment_schild_brett.svg",
    spritePath: "/Assets/Items/Icons/equipment_schild_brett.svg",
    stackable: false,
    maxStack: 1,
    value: 4,
    effects: [{ type: "damage_reduction", value: 1 }],
    droppable: true,
    tradeable: true,
    questItem: false
  },
  {
    id: "equipment_hose_ausgebeult",
    name: "Ausgebeulte Stoffhose",
    description: "Eine braune Stoffhose, die an den Knien stark ausgebeult ist. Der Bund muss mit einem Strick zusammengehalten werden. Hat ueberraschend tiefe Taschen.",
    type: "equipment",
    rarity: "common",
    slot: "hose",
    iconPath: "/Assets/Items/Icons/equipment_hose_ausgebeult.svg",
    spritePath: "/Assets/Items/Icons/equipment_hose_ausgebeult.svg",
    stackable: false,
    maxStack: 1,
    value: 3,
    effects: [{ type: "max_hp", value: 5 }],
    droppable: true,
    tradeable: true,
    questItem: false
  },
  {
    id: "equipment_schuhe_abgelaufen",
    name: "Abgelaufene Lederstiefel",
    description: "Ein Paar Stiefel, deren Sohlen schon ziemlich duenn sind. Man spuert jeden spitzen Stein. Halten die Fuesse trocken - solange es nicht regnet.",
    type: "equipment",
    rarity: "common",
    slot: "schuhe",
    iconPath: "/Assets/Items/Icons/equipment_schuhe_abgelaufen.svg",
    spritePath: "/Assets/Items/Icons/equipment_schuhe_abgelaufen.svg",
    stackable: false,
    maxStack: 1,
    value: 3,
    effects: [{ type: "time_boost", value: 0.5 }],
    droppable: true,
    tradeable: true,
    questItem: false
  }
];

// Rare items (generated with better stats) - Green items for bosses
const RARE_ITEMS: ItemDefinition[] = [
  {
    id: "equipment_helm_lehrmeister",
    name: "Lehrmeister-Kapuze",
    description: "Eine abgetragene Kapuze aus dunkelblauem Stoff, die einst einem weisen Lehrmeister gehoerte. Die feinen Runen entlang der Naht gluehen schwach.",
    type: "equipment",
    rarity: "rare",
    slot: "helm",
    iconPath: "/Assets/Items/Icons/equipment_helm_topf.svg",
    stackable: false,
    maxStack: 1,
    value: 25,
    effects: [{ type: "max_hp", value: 10 }, { type: "xp_boost", value: 10 }],
    droppable: true,
    tradeable: true,
    questItem: false
  },
  {
    id: "equipment_brustplatte_wanderer",
    name: "Schuluniform des Wanderers",
    description: "Eine robuste Lederweste mit verstaerkten Schulterpolstern, wie sie von reisenden Gelehrten getragen wird.",
    type: "equipment",
    rarity: "rare",
    slot: "brustplatte",
    iconPath: "/Assets/Items/Icons/equipment_brustplatte_geflickt.svg",
    stackable: false,
    maxStack: 1,
    value: 40,
    effects: [{ type: "max_hp", value: 20 }],
    droppable: true,
    tradeable: true,
    questItem: false
  },
  {
    id: "equipment_schwert_stahl",
    name: "Staehernes Langschwert",
    description: "Ein gut gepflegtes Schwert aus gehaertetem Stahl. Die Klinge ist scharf und der Griff liegt gut in der Hand.",
    type: "equipment",
    rarity: "rare",
    slot: "schwert",
    iconPath: "/Assets/Items/Icons/equipment_schwert_rostig.svg",
    stackable: false,
    maxStack: 1,
    value: 35,
    effects: [{ type: "damage_boost", value: 3 }],
    droppable: true,
    tradeable: true,
    questItem: false
  },
  {
    id: "equipment_schild_eisen",
    name: "Eisenbeschlagener Rundschild",
    description: "Ein solider Schild aus Holz mit Eisenbeschlaegen. Haelt deutlich mehr aus als ein einfaches Brett.",
    type: "equipment",
    rarity: "rare",
    slot: "schild",
    iconPath: "/Assets/Items/Icons/equipment_schild_brett.svg",
    stackable: false,
    maxStack: 1,
    value: 30,
    effects: [{ type: "damage_reduction", value: 3 }, { type: "max_hp", value: 5 }],
    droppable: true,
    tradeable: true,
    questItem: false
  },
  {
    id: "equipment_hose_forscher",
    name: "Wanderhosen des Forschers",
    description: "Strapazierfahige Hosen aus gewachstem Leinen mit zahlreichen Geheimtaschen.",
    type: "equipment",
    rarity: "rare",
    slot: "hose",
    iconPath: "/Assets/Items/Icons/equipment_hose_ausgebeult.svg",
    stackable: false,
    maxStack: 1,
    value: 28,
    effects: [{ type: "max_hp", value: 10 }, { type: "xp_boost", value: 5 }],
    droppable: true,
    tradeable: true,
    questItem: false
  },
  {
    id: "equipment_schuhe_schleich",
    name: "Schleichsohlen des Schuelers",
    description: "Weiche Lederschuhe mit einem Quietsch-Verhinderungs-Zauber - ein Muss fuer jeden, der nachts heimlich weiterlernen moechte.",
    type: "equipment",
    rarity: "rare",
    slot: "schuhe",
    iconPath: "/Assets/Items/Icons/equipment_schuhe_abgelaufen.svg",
    stackable: false,
    maxStack: 1,
    value: 22,
    effects: [{ type: "time_boost", value: 1.5 }],
    droppable: true,
    tradeable: true,
    questItem: false
  }
];

// All items combined
const ALL_ITEMS: ItemDefinition[] = [...COMMON_ITEMS, ...RARE_ITEMS];

/**
 * Get a random common item (for treasure chests)
 */
export function getRandomCommonItem(): ItemDefinition {
  const index = Math.floor(Math.random() * COMMON_ITEMS.length);
  return { ...COMMON_ITEMS[index] };
}

/**
 * Get a random rare item (for bosses)
 */
export function getRandomRareItem(): ItemDefinition {
  const index = Math.floor(Math.random() * RARE_ITEMS.length);
  return { ...RARE_ITEMS[index] };
}

/**
 * Get a random item of a specific rarity
 */
export function getRandomItemByRarity(rarity: ItemRarity): ItemDefinition | null {
  const items = ALL_ITEMS.filter(item => item.rarity === rarity);
  if (items.length === 0) return null;
  const index = Math.floor(Math.random() * items.length);
  return { ...items[index] };
}

/**
 * Get item by ID
 */
export function getItemById(id: string): ItemDefinition | null {
  const item = ALL_ITEMS.find(i => i.id === id);
  return item ? { ...item } : null;
}

/**
 * Get all available equipment slots
 */
export function getAllSlots(): EquipmentSlotKey[] {
  return ['helm', 'brustplatte', 'schwert', 'schild', 'hose', 'schuhe'];
}
