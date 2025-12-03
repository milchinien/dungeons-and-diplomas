/**
 * Item database - loads items from JSON definitions
 */

import type { ItemDefinition, ItemRarity, EquipmentSlotKey } from './types';
import { RARITY_CONFIG } from './types';

// Pre-defined common items (from JSON files)
const COMMON_ITEMS: ItemDefinition[] = [
  // === HELME (common) ===
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
    id: "equipment_helm_muetze",
    name: "Zerfranste Wollmuetze",
    description: "Eine alte Wollmuetze voller Mottenloecher. Haelt den Kopf warm, aber nicht viel mehr.",
    type: "equipment",
    rarity: "common",
    slot: "helm",
    iconPath: "/Assets/Items/Icons/equipment_helm_topf.svg",
    spritePath: "/Assets/Items/Icons/equipment_helm_topf.svg",
    stackable: false,
    maxStack: 1,
    value: 2,
    effects: [{ type: "max_hp", value: 3 }],
    droppable: true,
    tradeable: true,
    questItem: false
  },
  {
    id: "equipment_helm_strohhut",
    name: "Loechtiger Strohhut",
    description: "Ein Bauernhut, den selbst Voegel nicht mehr als Nest benutzen wuerden. Schuetzt immerhin vor der Sonne.",
    type: "equipment",
    rarity: "common",
    slot: "helm",
    iconPath: "/Assets/Items/Icons/equipment_helm_topf.svg",
    spritePath: "/Assets/Items/Icons/equipment_helm_topf.svg",
    stackable: false,
    maxStack: 1,
    value: 1,
    effects: [{ type: "max_hp", value: 2 }],
    droppable: true,
    tradeable: true,
    questItem: false
  },
  // === BRUSTPLATTEN (common) ===
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
    id: "equipment_brustplatte_sack",
    name: "Kartoffelsack-Weste",
    description: "Ein umgenaehter Kartoffelsack. Kratzt fuerchterlich auf der Haut, aber besser als nichts.",
    type: "equipment",
    rarity: "common",
    slot: "brustplatte",
    iconPath: "/Assets/Items/Icons/equipment_brustplatte_geflickt.svg",
    spritePath: "/Assets/Items/Icons/equipment_brustplatte_geflickt.svg",
    stackable: false,
    maxStack: 1,
    value: 3,
    effects: [{ type: "max_hp", value: 5 }],
    droppable: true,
    tradeable: true,
    questItem: false
  },
  {
    id: "equipment_brustplatte_lumpen",
    name: "Zusammengebundene Lumpen",
    description: "Verschiedene Stofffetzen, die notduerftig zu einer Art Weste zusammengenaeht wurden. Modisch gewagt.",
    type: "equipment",
    rarity: "common",
    slot: "brustplatte",
    iconPath: "/Assets/Items/Icons/equipment_brustplatte_geflickt.svg",
    spritePath: "/Assets/Items/Icons/equipment_brustplatte_geflickt.svg",
    stackable: false,
    maxStack: 1,
    value: 2,
    effects: [{ type: "max_hp", value: 3 }],
    droppable: true,
    tradeable: true,
    questItem: false
  },
  // === SCHWERTER (common) ===
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
    id: "equipment_schwert_kuechenmesser",
    name: "Stumpfes Kuechenmesser",
    description: "Ein grosses Kuechenmesser. Schneidet Brot nicht mehr, aber Goblins sind auch nicht viel haerter.",
    type: "equipment",
    rarity: "common",
    slot: "schwert",
    iconPath: "/Assets/Items/Icons/equipment_schwert_rostig.svg",
    spritePath: "/Assets/Items/Icons/equipment_schwert_rostig.svg",
    stackable: false,
    maxStack: 1,
    value: 2,
    effects: [{ type: "damage_boost", value: 1 }],
    droppable: true,
    tradeable: true,
    questItem: false
  },
  {
    id: "equipment_schwert_spitzer_stock",
    name: "Angespitzter Stock",
    description: "Ein Ast, der mit einem Stein angespitzt wurde. Primitiv aber effektiv - irgendwie.",
    type: "equipment",
    rarity: "common",
    slot: "schwert",
    iconPath: "/Assets/Items/Icons/equipment_schwert_rostig.svg",
    spritePath: "/Assets/Items/Icons/equipment_schwert_rostig.svg",
    stackable: false,
    maxStack: 1,
    value: 1,
    effects: [{ type: "damage_boost", value: 1 }],
    droppable: true,
    tradeable: true,
    questItem: false
  },
  // === SCHILDE (common) ===
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
    id: "equipment_schild_topfdeckel",
    name: "Verbogener Topfdeckel",
    description: "Ein grosser Topfdeckel, dessen Griff als Halterung dient. Klingt laut beim Blocken.",
    type: "equipment",
    rarity: "common",
    slot: "schild",
    iconPath: "/Assets/Items/Icons/equipment_schild_brett.svg",
    spritePath: "/Assets/Items/Icons/equipment_schild_brett.svg",
    stackable: false,
    maxStack: 1,
    value: 3,
    effects: [{ type: "damage_reduction", value: 1 }],
    droppable: true,
    tradeable: true,
    questItem: false
  },
  {
    id: "equipment_schild_fassdeckel",
    name: "Rissiger Fassdeckel",
    description: "Der Deckel eines alten Weinfasses. Riecht noch nach vergorenem Traubensaft.",
    type: "equipment",
    rarity: "common",
    slot: "schild",
    iconPath: "/Assets/Items/Icons/equipment_schild_brett.svg",
    spritePath: "/Assets/Items/Icons/equipment_schild_brett.svg",
    stackable: false,
    maxStack: 1,
    value: 2,
    effects: [{ type: "damage_reduction", value: 1 }],
    droppable: true,
    tradeable: true,
    questItem: false
  },
  // === HOSEN (common) ===
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
    id: "equipment_hose_flicken",
    name: "Mehr Flicken als Hose",
    description: "Eine Hose, bei der man nicht mehr erkennen kann, welcher Teil das Original war. Sehr bunt.",
    type: "equipment",
    rarity: "common",
    slot: "hose",
    iconPath: "/Assets/Items/Icons/equipment_hose_ausgebeult.svg",
    spritePath: "/Assets/Items/Icons/equipment_hose_ausgebeult.svg",
    stackable: false,
    maxStack: 1,
    value: 2,
    effects: [{ type: "max_hp", value: 3 }],
    droppable: true,
    tradeable: true,
    questItem: false
  },
  {
    id: "equipment_hose_kurz",
    name: "Abgeschnittene Arbeitshose",
    description: "Eine Hose, die am Knie abgeschnitten wurde. Wahrscheinlich aus Not, nicht aus Stil.",
    type: "equipment",
    rarity: "common",
    slot: "hose",
    iconPath: "/Assets/Items/Icons/equipment_hose_ausgebeult.svg",
    spritePath: "/Assets/Items/Icons/equipment_hose_ausgebeult.svg",
    stackable: false,
    maxStack: 1,
    value: 1,
    effects: [{ type: "max_hp", value: 2 }],
    droppable: true,
    tradeable: true,
    questItem: false
  },
  // === SCHUHE (common) ===
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
  },
  {
    id: "equipment_schuhe_sandalen",
    name: "Ausgeleierte Sandalen",
    description: "Einfache Holzsandalen mit Lederriemen. Die Riemen reissen bald, das ist sicher.",
    type: "equipment",
    rarity: "common",
    slot: "schuhe",
    iconPath: "/Assets/Items/Icons/equipment_schuhe_abgelaufen.svg",
    spritePath: "/Assets/Items/Icons/equipment_schuhe_abgelaufen.svg",
    stackable: false,
    maxStack: 1,
    value: 1,
    effects: [{ type: "time_boost", value: 0.3 }],
    droppable: true,
    tradeable: true,
    questItem: false
  },
  {
    id: "equipment_schuhe_fusslappen",
    name: "Dicke Fusslappen",
    description: "Stoffstreifen, die um die Fuesse gewickelt werden. Besser als barfuss, aber nicht viel.",
    type: "equipment",
    rarity: "common",
    slot: "schuhe",
    iconPath: "/Assets/Items/Icons/equipment_schuhe_abgelaufen.svg",
    spritePath: "/Assets/Items/Icons/equipment_schuhe_abgelaufen.svg",
    stackable: false,
    maxStack: 1,
    value: 1,
    effects: [{ type: "max_hp", value: 2 }],
    droppable: true,
    tradeable: true,
    questItem: false
  }
];

// Uncommon items - Green items (better than common, worse than rare)
const UNCOMMON_ITEMS: ItemDefinition[] = [
  // === HELME (uncommon) ===
  {
    id: "equipment_helm_lederkappe",
    name: "Gefuetterte Lederkappe",
    description: "Eine einfache Lederkappe mit Wollfutter. Schuetzt den Kopf und haelt warm.",
    type: "equipment",
    rarity: "uncommon",
    slot: "helm",
    iconPath: "/Assets/Items/Icons/equipment_helm_topf.svg",
    stackable: false,
    maxStack: 1,
    value: 12,
    effects: [{ type: "max_hp", value: 8 }],
    droppable: true,
    tradeable: true,
    questItem: false
  },
  {
    id: "equipment_helm_kettenhaube",
    name: "Flickwerk-Kettenhaube",
    description: "Eine Kettenhaube, bei der einige Ringe fehlen. Trotzdem besser als Stoff.",
    type: "equipment",
    rarity: "uncommon",
    slot: "helm",
    iconPath: "/Assets/Items/Icons/equipment_helm_topf.svg",
    stackable: false,
    maxStack: 1,
    value: 15,
    effects: [{ type: "max_hp", value: 7 }, { type: "damage_reduction", value: 1 }],
    droppable: true,
    tradeable: true,
    questItem: false
  },
  {
    id: "equipment_helm_eisenhelm",
    name: "Billiger Eisenhelm",
    description: "Ein einfacher Helm aus duennem Eisen. Verbeult leicht, aber schuetzt den Schaedel.",
    type: "equipment",
    rarity: "uncommon",
    slot: "helm",
    iconPath: "/Assets/Items/Icons/equipment_helm_topf.svg",
    stackable: false,
    maxStack: 1,
    value: 18,
    effects: [{ type: "max_hp", value: 10 }],
    droppable: true,
    tradeable: true,
    questItem: false
  },
  // === BRUSTPLATTEN (uncommon) ===
  {
    id: "equipment_brustplatte_wattiert",
    name: "Wattierte Jacke",
    description: "Eine dicke Stoffjacke mit Wattierung. Federleicht und ueberraschend schützend.",
    type: "equipment",
    rarity: "uncommon",
    slot: "brustplatte",
    iconPath: "/Assets/Items/Icons/equipment_brustplatte_geflickt.svg",
    stackable: false,
    maxStack: 1,
    value: 15,
    effects: [{ type: "max_hp", value: 12 }],
    droppable: true,
    tradeable: true,
    questItem: false
  },
  {
    id: "equipment_brustplatte_kette",
    name: "Kurzes Kettenhemd",
    description: "Ein kurzes Kettenhemd ohne Aermel. Rostet an manchen Stellen, schuetzt aber ordentlich.",
    type: "equipment",
    rarity: "uncommon",
    slot: "brustplatte",
    iconPath: "/Assets/Items/Icons/equipment_brustplatte_geflickt.svg",
    stackable: false,
    maxStack: 1,
    value: 22,
    effects: [{ type: "max_hp", value: 15 }, { type: "damage_reduction", value: 1 }],
    droppable: true,
    tradeable: true,
    questItem: false
  },
  {
    id: "equipment_brustplatte_leder_gehaertet",
    name: "Gehaertete Lederweste",
    description: "Leder, das in Wachs gehaertet wurde. Bietet soliden Schutz ohne zu viel Gewicht.",
    type: "equipment",
    rarity: "uncommon",
    slot: "brustplatte",
    iconPath: "/Assets/Items/Icons/equipment_brustplatte_geflickt.svg",
    stackable: false,
    maxStack: 1,
    value: 18,
    effects: [{ type: "max_hp", value: 14 }],
    droppable: true,
    tradeable: true,
    questItem: false
  },
  // === SCHWERTER (uncommon) ===
  {
    id: "equipment_schwert_jagdmesser",
    name: "Scharfes Jagdmesser",
    description: "Ein handliches Messer fuer die Jagd. Die Klinge ist noch scharf und gepflegt.",
    type: "equipment",
    rarity: "uncommon",
    slot: "schwert",
    iconPath: "/Assets/Items/Icons/equipment_schwert_rostig.svg",
    stackable: false,
    maxStack: 1,
    value: 12,
    effects: [{ type: "damage_boost", value: 2 }],
    droppable: true,
    tradeable: true,
    questItem: false
  },
  {
    id: "equipment_schwert_saebel",
    name: "Alter Kavalleriesaebel",
    description: "Ein leicht gebogener Saebel aus Armeebestaenden. Hat schon bessere Zeiten gesehen.",
    type: "equipment",
    rarity: "uncommon",
    slot: "schwert",
    iconPath: "/Assets/Items/Icons/equipment_schwert_rostig.svg",
    stackable: false,
    maxStack: 1,
    value: 18,
    effects: [{ type: "damage_boost", value: 2 }],
    droppable: true,
    tradeable: true,
    questItem: false
  },
  {
    id: "equipment_schwert_breitschwert",
    name: "Abgenutztes Breitschwert",
    description: "Ein breites, schweres Schwert. Die Schneide ist stumpf, aber das Gewicht tut trotzdem weh.",
    type: "equipment",
    rarity: "uncommon",
    slot: "schwert",
    iconPath: "/Assets/Items/Icons/equipment_schwert_rostig.svg",
    stackable: false,
    maxStack: 1,
    value: 20,
    effects: [{ type: "damage_boost", value: 2 }, { type: "max_hp", value: 3 }],
    droppable: true,
    tradeable: true,
    questItem: false
  },
  // === SCHILDE (uncommon) ===
  {
    id: "equipment_schild_holz_verstaerkt",
    name: "Verstaerkter Holzschild",
    description: "Ein Holzschild mit Metallrand. Haelt mehr aus als pures Holz.",
    type: "equipment",
    rarity: "uncommon",
    slot: "schild",
    iconPath: "/Assets/Items/Icons/equipment_schild_brett.svg",
    stackable: false,
    maxStack: 1,
    value: 14,
    effects: [{ type: "damage_reduction", value: 2 }],
    droppable: true,
    tradeable: true,
    questItem: false
  },
  {
    id: "equipment_schild_tartsche",
    name: "Kleine Tartsche",
    description: "Ein kleiner dreieckiger Schild. Leicht zu handhaben und schnell zu positionieren.",
    type: "equipment",
    rarity: "uncommon",
    slot: "schild",
    iconPath: "/Assets/Items/Icons/equipment_schild_brett.svg",
    stackable: false,
    maxStack: 1,
    value: 16,
    effects: [{ type: "damage_reduction", value: 2 }, { type: "time_boost", value: 0.3 }],
    droppable: true,
    tradeable: true,
    questItem: false
  },
  {
    id: "equipment_schild_buckler",
    name: "Rostiger Buckler",
    description: "Ein kleiner runder Faustschild. Der Rost stoert kaum beim Blocken.",
    type: "equipment",
    rarity: "uncommon",
    slot: "schild",
    iconPath: "/Assets/Items/Icons/equipment_schild_brett.svg",
    stackable: false,
    maxStack: 1,
    value: 12,
    effects: [{ type: "damage_reduction", value: 2 }],
    droppable: true,
    tradeable: true,
    questItem: false
  },
  // === HOSEN (uncommon) ===
  {
    id: "equipment_hose_leder",
    name: "Robuste Lederhose",
    description: "Eine solide Lederhose, die einiges aushält. Knarzt beim Gehen.",
    type: "equipment",
    rarity: "uncommon",
    slot: "hose",
    iconPath: "/Assets/Items/Icons/equipment_hose_ausgebeult.svg",
    stackable: false,
    maxStack: 1,
    value: 14,
    effects: [{ type: "max_hp", value: 8 }],
    droppable: true,
    tradeable: true,
    questItem: false
  },
  {
    id: "equipment_hose_kettenrock",
    name: "Kurzer Kettenrock",
    description: "Ein Kettenpanzer-Rock, der die Oberschenkel schuetzt. Klirrend aber effektiv.",
    type: "equipment",
    rarity: "uncommon",
    slot: "hose",
    iconPath: "/Assets/Items/Icons/equipment_hose_ausgebeult.svg",
    stackable: false,
    maxStack: 1,
    value: 20,
    effects: [{ type: "max_hp", value: 7 }, { type: "damage_reduction", value: 1 }],
    droppable: true,
    tradeable: true,
    questItem: false
  },
  {
    id: "equipment_hose_reiter",
    name: "Ausgediente Reiterhose",
    description: "Eine verstärkte Hose aus Armeebeständen. Die Lederflicken sind noch intakt.",
    type: "equipment",
    rarity: "uncommon",
    slot: "hose",
    iconPath: "/Assets/Items/Icons/equipment_hose_ausgebeult.svg",
    stackable: false,
    maxStack: 1,
    value: 16,
    effects: [{ type: "max_hp", value: 10 }],
    droppable: true,
    tradeable: true,
    questItem: false
  },
  // === SCHUHE (uncommon) ===
  {
    id: "equipment_schuhe_wanderer",
    name: "Stabile Wanderstiefel",
    description: "Gut eingelaufene Stiefel mit dicker Sohle. Perfekt fuer lange Maersche.",
    type: "equipment",
    rarity: "uncommon",
    slot: "schuhe",
    iconPath: "/Assets/Items/Icons/equipment_schuhe_abgelaufen.svg",
    stackable: false,
    maxStack: 1,
    value: 14,
    effects: [{ type: "time_boost", value: 0.8 }],
    droppable: true,
    tradeable: true,
    questItem: false
  },
  {
    id: "equipment_schuhe_beschlagen",
    name: "Beschlagene Lederstiefel",
    description: "Schwere Stiefel mit Metallbeschlaegen. Gut fuer Tritte, weniger gut fuer Schleichen.",
    type: "equipment",
    rarity: "uncommon",
    slot: "schuhe",
    iconPath: "/Assets/Items/Icons/equipment_schuhe_abgelaufen.svg",
    stackable: false,
    maxStack: 1,
    value: 18,
    effects: [{ type: "max_hp", value: 5 }, { type: "damage_boost", value: 1 }],
    droppable: true,
    tradeable: true,
    questItem: false
  },
  {
    id: "equipment_schuhe_jaeger",
    name: "Leichte Jaegerstiefel",
    description: "Weiche, leise Stiefel mit gutem Grip. Ideal fuer unwegsames Gelaende.",
    type: "equipment",
    rarity: "uncommon",
    slot: "schuhe",
    iconPath: "/Assets/Items/Icons/equipment_schuhe_abgelaufen.svg",
    stackable: false,
    maxStack: 1,
    value: 16,
    effects: [{ type: "time_boost", value: 1.0 }],
    droppable: true,
    tradeable: true,
    questItem: false
  }
];

// Rare items (generated with better stats) - Blue items for bosses
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
const ALL_ITEMS: ItemDefinition[] = [...COMMON_ITEMS, ...UNCOMMON_ITEMS, ...RARE_ITEMS];

/**
 * Get a random common item (for treasure chests)
 */
export function getRandomCommonItem(): ItemDefinition {
  const index = Math.floor(Math.random() * COMMON_ITEMS.length);
  return { ...COMMON_ITEMS[index] };
}

/**
 * Get a random uncommon item (green)
 */
export function getRandomUncommonItem(): ItemDefinition {
  const index = Math.floor(Math.random() * UNCOMMON_ITEMS.length);
  return { ...UNCOMMON_ITEMS[index] };
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

/**
 * Generate an item for a specific slot and rarity
 */
export function generateItem(slot: EquipmentSlotKey, rarity: ItemRarity): ItemDefinition {
  // Filter items by slot and rarity
  const matchingItems = ALL_ITEMS.filter(item => item.slot === slot && item.rarity === rarity);

  // If no matching items found, fall back to any item of that rarity
  if (matchingItems.length === 0) {
    const fallbackItems = ALL_ITEMS.filter(item => item.rarity === rarity);
    if (fallbackItems.length === 0) {
      // Last resort: return a random common item
      return { ...COMMON_ITEMS[Math.floor(Math.random() * COMMON_ITEMS.length)] };
    }
    return { ...fallbackItems[Math.floor(Math.random() * fallbackItems.length)] };
  }

  // Return a random matching item
  return { ...matchingItems[Math.floor(Math.random() * matchingItems.length)] };
}
