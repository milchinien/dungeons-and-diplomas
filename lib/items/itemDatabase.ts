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
    iconPath: "/Assets/Items/Icons/helm/common/topf.svg",
    spritePath: "/Assets/Items/Icons/helm/common/topf.svg",
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
    iconPath: "/Assets/Items/Icons/helm/common/muetze.svg",
    spritePath: "/Assets/Items/Icons/helm/common/muetze.svg",
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
    iconPath: "/Assets/Items/Icons/helm/common/strohhut.svg",
    spritePath: "/Assets/Items/Icons/helm/common/strohhut.svg",
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
    iconPath: "/Assets/Items/Icons/brustplatte/common/geflickt.svg",
    spritePath: "/Assets/Items/Icons/brustplatte/common/geflickt.svg",
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
    iconPath: "/Assets/Items/Icons/brustplatte/common/sack.svg",
    spritePath: "/Assets/Items/Icons/brustplatte/common/sack.svg",
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
    iconPath: "/Assets/Items/Icons/brustplatte/common/lumpen.svg",
    spritePath: "/Assets/Items/Icons/brustplatte/common/lumpen.svg",
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
    iconPath: "/Assets/Items/Icons/schwert/common/rostig.svg",
    spritePath: "/Assets/Items/Icons/schwert/common/rostig.svg",
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
    iconPath: "/Assets/Items/Icons/schwert/common/kuechenmesser.svg",
    spritePath: "/Assets/Items/Icons/schwert/common/kuechenmesser.svg",
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
    iconPath: "/Assets/Items/Icons/schwert/common/spitzer_stock.svg",
    spritePath: "/Assets/Items/Icons/schwert/common/spitzer_stock.svg",
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
    iconPath: "/Assets/Items/Icons/schild/common/holzdeckel.svg",
    spritePath: "/Assets/Items/Icons/schild/common/holzdeckel.svg",
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
    iconPath: "/Assets/Items/Icons/schild/common/topfdeckel.svg",
    spritePath: "/Assets/Items/Icons/schild/common/topfdeckel.svg",
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
    iconPath: "/Assets/Items/Icons/schild/common/rostig.svg",
    spritePath: "/Assets/Items/Icons/schild/common/rostig.svg",
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
    iconPath: "/Assets/Items/Icons/hose/common/geflickt.svg",
    spritePath: "/Assets/Items/Icons/hose/common/geflickt.svg",
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
    iconPath: "/Assets/Items/Icons/hose/common/sack.svg",
    spritePath: "/Assets/Items/Icons/hose/common/sack.svg",
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
    iconPath: "/Assets/Items/Icons/hose/common/lumpen.svg",
    spritePath: "/Assets/Items/Icons/hose/common/lumpen.svg",
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
    iconPath: "/Assets/Items/Icons/schuhe/common/sandalen.svg",
    spritePath: "/Assets/Items/Icons/schuhe/common/sandalen.svg",
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
    iconPath: "/Assets/Items/Icons/schuhe/common/stoffschuhe.svg",
    spritePath: "/Assets/Items/Icons/schuhe/common/stoffschuhe.svg",
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
    iconPath: "/Assets/Items/Icons/schuhe/common/holzschuhe.svg",
    spritePath: "/Assets/Items/Icons/schuhe/common/holzschuhe.svg",
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
    iconPath: "/Assets/Items/Icons/helm/uncommon/lederkappe.svg",
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
    iconPath: "/Assets/Items/Icons/helm/uncommon/kettenhaube.svg",
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
    iconPath: "/Assets/Items/Icons/helm/uncommon/eisenhelm.svg",
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
    iconPath: "/Assets/Items/Icons/brustplatte/uncommon/wattiert.svg",
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
    iconPath: "/Assets/Items/Icons/brustplatte/uncommon/kette.svg",
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
    iconPath: "/Assets/Items/Icons/brustplatte/uncommon/leder_gehaertet.svg",
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
    iconPath: "/Assets/Items/Icons/schwert/uncommon/jagdmesser.svg",
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
    iconPath: "/Assets/Items/Icons/schwert/uncommon/saebel.svg",
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
    iconPath: "/Assets/Items/Icons/schwert/uncommon/breitschwert.svg",
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
    iconPath: "/Assets/Items/Icons/schild/uncommon/leder.svg",
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
    iconPath: "/Assets/Items/Icons/schild/uncommon/rund.svg",
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
    iconPath: "/Assets/Items/Icons/schild/uncommon/turm.svg",
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
    iconPath: "/Assets/Items/Icons/hose/uncommon/leder.svg",
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
    iconPath: "/Assets/Items/Icons/hose/uncommon/kette.svg",
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
    iconPath: "/Assets/Items/Icons/hose/uncommon/wattiert.svg",
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
    iconPath: "/Assets/Items/Icons/schuhe/uncommon/leder.svg",
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
    iconPath: "/Assets/Items/Icons/schuhe/uncommon/kette.svg",
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
    iconPath: "/Assets/Items/Icons/schuhe/uncommon/reise.svg",
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
    iconPath: "/Assets/Items/Icons/helm/rare/lehrmeister.svg",
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
    iconPath: "/Assets/Items/Icons/brustplatte/rare/wanderer.svg",
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
    iconPath: "/Assets/Items/Icons/schwert/rare/stahl.svg",
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
    iconPath: "/Assets/Items/Icons/schild/rare/wanderer.svg",
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
    iconPath: "/Assets/Items/Icons/hose/rare/wanderer.svg",
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
    iconPath: "/Assets/Items/Icons/schuhe/rare/wanderer.svg",
    stackable: false,
    maxStack: 1,
    value: 22,
    effects: [{ type: "time_boost", value: 1.5 }],
    droppable: true,
    tradeable: true,
    questItem: false
  }
];

// Epic items (purple) - powerful items with unique effects
const EPIC_ITEMS: ItemDefinition[] = [
  // === HELME (epic) ===
  {
    id: "equipment_helm_gelehrter",
    name: "Diadem des Gelehrten",
    description: "Ein silbernes Stirnband mit einem pulsierenden Kristall. Die eingravierten Runen fluestern vergessenes Wissen.",
    type: "equipment",
    rarity: "epic",
    slot: "helm",
    iconPath: "/Assets/Items/Icons/helm/epic/gelehrter.svg",
    stackable: false,
    maxStack: 1,
    value: 75,
    effects: [{ type: "max_hp", value: 15 }, { type: "xp_boost", value: 15 }, { type: "time_boost", value: 1 }],
    droppable: true,
    tradeable: true,
    questItem: false
  },
  {
    id: "equipment_helm_daemonenkrone",
    name: "Daemonenkrone",
    description: "Eine dunkle Krone aus geschwaerztem Metall. Wer sie traegt, spuert die Praesenz uralter Maechte.",
    type: "equipment",
    rarity: "epic",
    slot: "helm",
    iconPath: "/Assets/Items/Icons/helm/epic/daemonenkrone.svg",
    stackable: false,
    maxStack: 1,
    value: 80,
    effects: [{ type: "max_hp", value: 20 }, { type: "damage_boost", value: 2 }],
    droppable: true,
    tradeable: true,
    questItem: false
  },
  {
    id: "equipment_helm_phoenix",
    name: "Phönixfeder-Haube",
    description: "Ein Helm geschmueckt mit einer leuchtenden Phönixfeder. Die Waerme des ewigen Feuers durchstroemt den Traeger.",
    type: "equipment",
    rarity: "epic",
    slot: "helm",
    iconPath: "/Assets/Items/Icons/helm/epic/phoenix.svg",
    stackable: false,
    maxStack: 1,
    value: 85,
    effects: [{ type: "max_hp", value: 18 }, { type: "hint_chance", value: 10 }],
    droppable: true,
    tradeable: true,
    questItem: false
  },
  // === BRUSTPLATTEN (epic) ===
  {
    id: "equipment_brustplatte_drachen",
    name: "Drachenschuppen-Harnisch",
    description: "Eine Ruestung aus echten Drachenschuppen. Jede Schuppe schimmert in einem anderen Farbton.",
    type: "equipment",
    rarity: "epic",
    slot: "brustplatte",
    iconPath: "/Assets/Items/Icons/brustplatte/epic/drachen.svg",
    stackable: false,
    maxStack: 1,
    value: 100,
    effects: [{ type: "max_hp", value: 30 }, { type: "damage_reduction", value: 3 }],
    droppable: true,
    tradeable: true,
    questItem: false
  },
  {
    id: "equipment_brustplatte_magier",
    name: "Robe des Erzmagiers",
    description: "Eine wallende Robe durchwoben mit magischen Faeden. Arkane Symbole leuchten bei Gefahr.",
    type: "equipment",
    rarity: "epic",
    slot: "brustplatte",
    iconPath: "/Assets/Items/Icons/brustplatte/epic/magier.svg",
    stackable: false,
    maxStack: 1,
    value: 95,
    effects: [{ type: "max_hp", value: 20 }, { type: "xp_boost", value: 20 }, { type: "time_boost", value: 1 }],
    droppable: true,
    tradeable: true,
    questItem: false
  },
  {
    id: "equipment_brustplatte_mithril",
    name: "Mithril-Kettenhemd",
    description: "Ein federleichtes Kettenhemd aus dem seltenen Mithril. Es glaenzt wie Mondlicht auf Wasser.",
    type: "equipment",
    rarity: "epic",
    slot: "brustplatte",
    iconPath: "/Assets/Items/Icons/brustplatte/epic/mithril.svg",
    stackable: false,
    maxStack: 1,
    value: 110,
    effects: [{ type: "max_hp", value: 25 }, { type: "damage_reduction", value: 2 }, { type: "time_boost", value: 0.5 }],
    droppable: true,
    tradeable: true,
    questItem: false
  },
  // === SCHWERTER (epic) ===
  {
    id: "equipment_schwert_flammen",
    name: "Flammenklinge",
    description: "Ein Schwert, dessen Klinge in ewigem Feuer brennt. Die Hitze ist spuerbar, verbrennt aber nicht den Traeger.",
    type: "equipment",
    rarity: "epic",
    slot: "schwert",
    iconPath: "/Assets/Items/Icons/schwert/epic/flammen.svg",
    stackable: false,
    maxStack: 1,
    value: 90,
    effects: [{ type: "damage_boost", value: 5 }],
    droppable: true,
    tradeable: true,
    questItem: false
  },
  {
    id: "equipment_schwert_seelen",
    name: "Seelenschneider",
    description: "Ein dunkles Schwert, das die Seelen seiner Opfer zu absorbieren scheint. Ein unheiliges Fluestern umgibt es.",
    type: "equipment",
    rarity: "epic",
    slot: "schwert",
    iconPath: "/Assets/Items/Icons/schwert/epic/seelen.svg",
    stackable: false,
    maxStack: 1,
    value: 95,
    effects: [{ type: "damage_boost", value: 4 }, { type: "max_hp", value: 10 }],
    droppable: true,
    tradeable: true,
    questItem: false
  },
  {
    id: "equipment_schwert_blitz",
    name: "Blitzschlag-Saebel",
    description: "Ein schimmernder Saebel, um den sich elektrische Funken winden. Bei jedem Schwung knistert die Luft.",
    type: "equipment",
    rarity: "epic",
    slot: "schwert",
    iconPath: "/Assets/Items/Icons/schwert/epic/blitz.svg",
    stackable: false,
    maxStack: 1,
    value: 88,
    effects: [{ type: "damage_boost", value: 4 }, { type: "time_boost", value: 1 }],
    droppable: true,
    tradeable: true,
    questItem: false
  },
  // === SCHILDE (epic) ===
  {
    id: "equipment_schild_aegis",
    name: "Aegis des Wissens",
    description: "Ein leuchtender Schild mit dem Symbol einer Eule. Er scheint Wissen aus der Luft zu ziehen.",
    type: "equipment",
    rarity: "epic",
    slot: "schild",
    iconPath: "/Assets/Items/Icons/schild/epic/drachen.svg",
    stackable: false,
    maxStack: 1,
    value: 85,
    effects: [{ type: "damage_reduction", value: 4 }, { type: "hint_chance", value: 15 }],
    droppable: true,
    tradeable: true,
    questItem: false
  },
  {
    id: "equipment_schild_spiegel",
    name: "Spiegelschild",
    description: "Ein polierter Schild, der wie ein perfekter Spiegel glaenzt. Feinde sehen ihre eigene Schwaeche.",
    type: "equipment",
    rarity: "epic",
    slot: "schild",
    iconPath: "/Assets/Items/Icons/schild/epic/spiegel.svg",
    stackable: false,
    maxStack: 1,
    value: 90,
    effects: [{ type: "damage_reduction", value: 5 }, { type: "max_hp", value: 10 }],
    droppable: true,
    tradeable: true,
    questItem: false
  },
  {
    id: "equipment_schild_eis",
    name: "Frostrunen-Schild",
    description: "Ein Schild aus ewigem Eis. Runen der Kaelte sind tief in die Oberflaeche geaetzt.",
    type: "equipment",
    rarity: "epic",
    slot: "schild",
    iconPath: "/Assets/Items/Icons/schild/epic/kristall.svg",
    stackable: false,
    maxStack: 1,
    value: 88,
    effects: [{ type: "damage_reduction", value: 4 }, { type: "time_boost", value: 1.5 }],
    droppable: true,
    tradeable: true,
    questItem: false
  },
  // === HOSEN (epic) ===
  {
    id: "equipment_hose_schatten",
    name: "Schattenweber-Beinkleid",
    description: "Eine Hose gewoben aus verdichteten Schatten. Sie passt sich jedem Traeger perfekt an.",
    type: "equipment",
    rarity: "epic",
    slot: "hose",
    iconPath: "/Assets/Items/Icons/hose/epic/drachen.svg",
    stackable: false,
    maxStack: 1,
    value: 75,
    effects: [{ type: "max_hp", value: 15 }, { type: "time_boost", value: 2 }],
    droppable: true,
    tradeable: true,
    questItem: false
  },
  {
    id: "equipment_hose_titan",
    name: "Titanenschurz",
    description: "Ein gepanzerter Beinschutz aus Titanplatten. Schwer, aber nahezu unzerstoerbar.",
    type: "equipment",
    rarity: "epic",
    slot: "hose",
    iconPath: "/Assets/Items/Icons/hose/epic/magier.svg",
    stackable: false,
    maxStack: 1,
    value: 80,
    effects: [{ type: "max_hp", value: 20 }, { type: "damage_reduction", value: 2 }],
    droppable: true,
    tradeable: true,
    questItem: false
  },
  {
    id: "equipment_hose_meister",
    name: "Meistergelehrten-Hose",
    description: "Eine elegante Hose mit versteckten Taschen voller Notizen. Die Naehte sind mit Wissenssymbolen verziert.",
    type: "equipment",
    rarity: "epic",
    slot: "hose",
    iconPath: "/Assets/Items/Icons/hose/epic/mithril.svg",
    stackable: false,
    maxStack: 1,
    value: 78,
    effects: [{ type: "max_hp", value: 12 }, { type: "xp_boost", value: 15 }],
    droppable: true,
    tradeable: true,
    questItem: false
  },
  // === SCHUHE (epic) ===
  {
    id: "equipment_schuhe_hermes",
    name: "Hermesstiefel",
    description: "Geflügelte Stiefel, die ihren Traeger fast schweben lassen. Zeit scheint langsamer zu vergehen.",
    type: "equipment",
    rarity: "epic",
    slot: "schuhe",
    iconPath: "/Assets/Items/Icons/schuhe/epic/drachen.svg",
    stackable: false,
    maxStack: 1,
    value: 85,
    effects: [{ type: "time_boost", value: 3 }],
    droppable: true,
    tradeable: true,
    questItem: false
  },
  {
    id: "equipment_schuhe_vulkan",
    name: "Vulkanschmiede-Stiefel",
    description: "Stiefel geschmiedet im Herzen eines Vulkans. Lava scheint in den Sohlen zu pulsieren.",
    type: "equipment",
    rarity: "epic",
    slot: "schuhe",
    iconPath: "/Assets/Items/Icons/schuhe/epic/magier.svg",
    stackable: false,
    maxStack: 1,
    value: 82,
    effects: [{ type: "max_hp", value: 10 }, { type: "damage_boost", value: 2 }, { type: "time_boost", value: 1 }],
    droppable: true,
    tradeable: true,
    questItem: false
  },
  {
    id: "equipment_schuhe_gelehrter",
    name: "Wanderschuhe des Gelehrten",
    description: "Bequeme Schuhe, die unzaehlige Bibliotheken besucht haben. Jeder Schritt bringt neue Erkenntnis.",
    type: "equipment",
    rarity: "epic",
    slot: "schuhe",
    iconPath: "/Assets/Items/Icons/schuhe/epic/mithril.svg",
    stackable: false,
    maxStack: 1,
    value: 80,
    effects: [{ type: "xp_boost", value: 20 }, { type: "time_boost", value: 1.5 }],
    droppable: true,
    tradeable: true,
    questItem: false
  }
];

// Legendary items (orange) - the most powerful items in the game
const LEGENDARY_ITEMS: ItemDefinition[] = [
  // === HELME (legendary) ===
  {
    id: "equipment_helm_allwissend",
    name: "Krone der Allwissenheit",
    description: "Eine uralte Krone, die einst einem Gott der Weisheit gehoerte. Alle Geheimnisse des Universums scheinen dem Traeger offen.",
    type: "equipment",
    rarity: "legendary",
    slot: "helm",
    iconPath: "/Assets/Items/Icons/helm/legendary/allwissend.svg",
    stackable: false,
    maxStack: 1,
    value: 250,
    effects: [{ type: "max_hp", value: 25 }, { type: "xp_boost", value: 30 }, { type: "hint_chance", value: 25 }, { type: "time_boost", value: 2 }],
    droppable: true,
    tradeable: true,
    questItem: false
  },
  {
    id: "equipment_helm_unsterblich",
    name: "Helm der Unsterblichen",
    description: "Ein Helm getragen von einem legendaeren Krieger, der nie fiel. Die Legende besagt, er lebte tausend Jahre.",
    type: "equipment",
    rarity: "legendary",
    slot: "helm",
    iconPath: "/Assets/Items/Icons/helm/legendary/unsterblich.svg",
    stackable: false,
    maxStack: 1,
    value: 280,
    effects: [{ type: "max_hp", value: 40 }, { type: "damage_reduction", value: 3 }],
    droppable: true,
    tradeable: true,
    questItem: false
  },
  {
    id: "equipment_helm_sternenlicht",
    name: "Sternenlicht-Tiara",
    description: "Ein Diadem geschmiedet aus dem Licht gefallener Sterne. Es erleuchtet selbst die dunkelste Nacht.",
    type: "equipment",
    rarity: "legendary",
    slot: "helm",
    iconPath: "/Assets/Items/Icons/helm/legendary/sternenlicht.svg",
    stackable: false,
    maxStack: 1,
    value: 260,
    effects: [{ type: "max_hp", value: 20 }, { type: "hint_chance", value: 30 }, { type: "xp_boost", value: 20 }],
    droppable: true,
    tradeable: true,
    questItem: false
  },
  // === BRUSTPLATTEN (legendary) ===
  {
    id: "equipment_brustplatte_goetter",
    name: "Goetterruestung",
    description: "Eine Ruestung geschmiedet auf dem Amboss der Goetter selbst. Selbst Drachen waeren neidisch.",
    type: "equipment",
    rarity: "legendary",
    slot: "brustplatte",
    iconPath: "/Assets/Items/Icons/brustplatte/legendary/goetter.svg",
    stackable: false,
    maxStack: 1,
    value: 300,
    effects: [{ type: "max_hp", value: 50 }, { type: "damage_reduction", value: 5 }],
    droppable: true,
    tradeable: true,
    questItem: false
  },
  {
    id: "equipment_brustplatte_erzmagier",
    name: "Gewand des Obersten Erzmagiers",
    description: "Die Robe des maechtigsten Magiers aller Zeiten. Arkane Energie umgibt sie wie ein Sturm.",
    type: "equipment",
    rarity: "legendary",
    slot: "brustplatte",
    iconPath: "/Assets/Items/Icons/brustplatte/legendary/erzmagier.svg",
    stackable: false,
    maxStack: 1,
    value: 290,
    effects: [{ type: "max_hp", value: 30 }, { type: "xp_boost", value: 35 }, { type: "time_boost", value: 2 }, { type: "hint_chance", value: 15 }],
    droppable: true,
    tradeable: true,
    questItem: false
  },
  {
    id: "equipment_brustplatte_adamant",
    name: "Adamant-Plattenruestung",
    description: "Eine massive Ruestung aus unzerstoerbarem Adamant. Der Traeger ist nahezu unverwundbar.",
    type: "equipment",
    rarity: "legendary",
    slot: "brustplatte",
    iconPath: "/Assets/Items/Icons/brustplatte/legendary/adamant.svg",
    stackable: false,
    maxStack: 1,
    value: 320,
    effects: [{ type: "max_hp", value: 45 }, { type: "damage_reduction", value: 6 }, { type: "damage_boost", value: 2 }],
    droppable: true,
    tradeable: true,
    questItem: false
  },
  // === SCHWERTER (legendary) ===
  {
    id: "equipment_schwert_weltenschneider",
    name: "Weltenschneider",
    description: "Ein Schwert, das angeblich die Realitaet selbst durchschneiden kann. Die Klinge scheint zwischen den Dimensionen zu flimmern.",
    type: "equipment",
    rarity: "legendary",
    slot: "schwert",
    iconPath: "/Assets/Items/Icons/schwert/legendary/weltenschneider.svg",
    stackable: false,
    maxStack: 1,
    value: 350,
    effects: [{ type: "damage_boost", value: 8 }, { type: "time_boost", value: 1 }],
    droppable: true,
    tradeable: true,
    questItem: false
  },
  {
    id: "equipment_schwert_sonnenfeuer",
    name: "Schwert des Sonnenfeuers",
    description: "Eine Klinge geschmiedet im Kern einer Sonne. Ihr Licht ist so blendend, dass Feinde abwenden muessen.",
    type: "equipment",
    rarity: "legendary",
    slot: "schwert",
    iconPath: "/Assets/Items/Icons/schwert/legendary/sonnenfeuer.svg",
    stackable: false,
    maxStack: 1,
    value: 330,
    effects: [{ type: "damage_boost", value: 7 }, { type: "max_hp", value: 15 }, { type: "hint_chance", value: 10 }],
    droppable: true,
    tradeable: true,
    questItem: false
  },
  {
    id: "equipment_schwert_verdammnis",
    name: "Klinge der Verdammnis",
    description: "Ein verfluchtes Schwert, das die Seelen tausender Krieger enthaelt. Sein Wille ist staerker als die meisten Traeger.",
    type: "equipment",
    rarity: "legendary",
    slot: "schwert",
    iconPath: "/Assets/Items/Icons/schwert/legendary/verdammnis.svg",
    stackable: false,
    maxStack: 1,
    value: 340,
    effects: [{ type: "damage_boost", value: 10 }],
    droppable: true,
    tradeable: true,
    questItem: false
  },
  // === SCHILDE (legendary) ===
  {
    id: "equipment_schild_unendlichkeit",
    name: "Schild der Unendlichkeit",
    description: "Ein mystischer Schild, der alle Angriffe in eine Endlosschleife zu schicken scheint.",
    type: "equipment",
    rarity: "legendary",
    slot: "schild",
    iconPath: "/Assets/Items/Icons/schild/legendary/aegis.svg",
    stackable: false,
    maxStack: 1,
    value: 280,
    effects: [{ type: "damage_reduction", value: 7 }, { type: "max_hp", value: 15 }],
    droppable: true,
    tradeable: true,
    questItem: false
  },
  {
    id: "equipment_schild_weisheit",
    name: "Aegis der Uralten Weisheit",
    description: "Ein Schild, der das gesammelte Wissen aller Zeitalter in sich traegt. Fragen beantworten sich wie von selbst.",
    type: "equipment",
    rarity: "legendary",
    slot: "schild",
    iconPath: "/Assets/Items/Icons/schild/legendary/ewiger.svg",
    stackable: false,
    maxStack: 1,
    value: 290,
    effects: [{ type: "damage_reduction", value: 5 }, { type: "hint_chance", value: 35 }, { type: "xp_boost", value: 15 }],
    droppable: true,
    tradeable: true,
    questItem: false
  },
  {
    id: "equipment_schild_titan",
    name: "Schild des Weltenwächters",
    description: "Ein gewaltiger Schild, der einst die Welt vor dem Untergang schuetzte. Seine Macht ist ungebrochen.",
    type: "equipment",
    rarity: "legendary",
    slot: "schild",
    iconPath: "/Assets/Items/Icons/schild/legendary/weltenbrecher.svg",
    stackable: false,
    maxStack: 1,
    value: 300,
    effects: [{ type: "damage_reduction", value: 8 }, { type: "max_hp", value: 25 }],
    droppable: true,
    tradeable: true,
    questItem: false
  },
  // === HOSEN (legendary) ===
  {
    id: "equipment_hose_dimension",
    name: "Dimensionswandler-Beinkleid",
    description: "Eine Hose, die in mehreren Dimensionen gleichzeitig zu existieren scheint. Die Taschen sind unendlich tief.",
    type: "equipment",
    rarity: "legendary",
    slot: "hose",
    iconPath: "/Assets/Items/Icons/hose/legendary/goetter.svg",
    stackable: false,
    maxStack: 1,
    value: 270,
    effects: [{ type: "max_hp", value: 25 }, { type: "time_boost", value: 3 }, { type: "xp_boost", value: 15 }],
    droppable: true,
    tradeable: true,
    questItem: false
  },
  {
    id: "equipment_hose_goettlich",
    name: "Goettliche Beinplatten",
    description: "Beinruestung, die in den himmlischen Schmieden gefertigt wurde. Sie verleiht die Staerke der Goetter.",
    type: "equipment",
    rarity: "legendary",
    slot: "hose",
    iconPath: "/Assets/Items/Icons/hose/legendary/erzmagier.svg",
    stackable: false,
    maxStack: 1,
    value: 280,
    effects: [{ type: "max_hp", value: 35 }, { type: "damage_reduction", value: 4 }],
    droppable: true,
    tradeable: true,
    questItem: false
  },
  {
    id: "equipment_hose_erkenntnis",
    name: "Hose der Ewigen Erkenntnis",
    description: "Eine unscheinbare Hose, doch wer sie traegt, versteht die tiefsten Wahrheiten des Universums.",
    type: "equipment",
    rarity: "legendary",
    slot: "hose",
    iconPath: "/Assets/Items/Icons/hose/legendary/adamant.svg",
    stackable: false,
    maxStack: 1,
    value: 265,
    effects: [{ type: "max_hp", value: 20 }, { type: "xp_boost", value: 40 }, { type: "hint_chance", value: 20 }],
    droppable: true,
    tradeable: true,
    questItem: false
  },
  // === SCHUHE (legendary) ===
  {
    id: "equipment_schuhe_zeitwanderer",
    name: "Stiefel des Zeitwanderers",
    description: "Stiefel, die dem Traeger erlauben, die Zeit zu verlangsamen. Ein Herzschlag kann eine Ewigkeit dauern.",
    type: "equipment",
    rarity: "legendary",
    slot: "schuhe",
    iconPath: "/Assets/Items/Icons/schuhe/legendary/goetter.svg",
    stackable: false,
    maxStack: 1,
    value: 300,
    effects: [{ type: "time_boost", value: 5 }, { type: "max_hp", value: 15 }],
    droppable: true,
    tradeable: true,
    questItem: false
  },
  {
    id: "equipment_schuhe_weltlaeufer",
    name: "Weltlaeufer-Stiefel",
    description: "Stiefel, die jeden Weg der Welt kennen. Kein Terrain ist zu schwierig, keine Reise zu lang.",
    type: "equipment",
    rarity: "legendary",
    slot: "schuhe",
    iconPath: "/Assets/Items/Icons/schuhe/legendary/erzmagier.svg",
    stackable: false,
    maxStack: 1,
    value: 285,
    effects: [{ type: "max_hp", value: 20 }, { type: "time_boost", value: 3 }, { type: "xp_boost", value: 25 }],
    droppable: true,
    tradeable: true,
    questItem: false
  },
  {
    id: "equipment_schuhe_transzendenz",
    name: "Schuhe der Transzendenz",
    description: "Mystische Schuhe, die ihren Traeger ueber die Grenzen des Moeglichen hinaus tragen.",
    type: "equipment",
    rarity: "legendary",
    slot: "schuhe",
    iconPath: "/Assets/Items/Icons/schuhe/legendary/adamant.svg",
    stackable: false,
    maxStack: 1,
    value: 295,
    effects: [{ type: "time_boost", value: 4 }, { type: "hint_chance", value: 20 }, { type: "damage_boost", value: 3 }],
    droppable: true,
    tradeable: true,
    questItem: false
  }
];

// All items combined
const ALL_ITEMS: ItemDefinition[] = [...COMMON_ITEMS, ...UNCOMMON_ITEMS, ...RARE_ITEMS, ...EPIC_ITEMS, ...LEGENDARY_ITEMS];

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
