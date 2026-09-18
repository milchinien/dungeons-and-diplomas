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
    name: "Dented Pot Helm",
    description: "An old cooking pot hastily repurposed as a helmet. The handles were sawn off, but you can still see where they were. Smells faintly of stew.",
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
    name: "Frayed Wool Cap",
    description: "An old wool cap full of moth holes. Keeps your head warm, but not much else.",
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
    name: "Holey Straw Hat",
    description: "A farmer's hat that not even birds would nest in anymore. At least it keeps the sun off.",
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
    name: "Patched Leather Tunic",
    description: "A worn leather tunic covered in patches. Every patch tells a story - mostly about how the previous owner got hit.",
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
    name: "Potato Sack Vest",
    description: "A resewn potato sack. Itches terribly, but it's better than nothing.",
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
    name: "Bundled Rags",
    description: "Assorted scraps of cloth roughly stitched into a sort of vest. Daring fashion.",
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
    name: "Rusty Shortsword",
    description: "A shortsword that has seen better days. Rust has eaten into the blade, and the grip is wrapped in old cloth.",
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
    name: "Dull Kitchen Knife",
    description: "A big kitchen knife. It no longer cuts bread, but goblins aren't much tougher.",
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
    name: "Sharpened Stick",
    description: "A branch sharpened with a rock. Primitive but effective - sort of.",
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
    name: "Board with a Handle",
    description: "A plank from an old barn door with a leather strap nailed to it. It blocks hits - at least a few.",
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
    name: "Bent Pot Lid",
    description: "A large pot lid whose handle serves as a grip. Very loud when blocking.",
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
    name: "Cracked Barrel Lid",
    description: "The lid of an old wine barrel. Still smells of fermented grape juice.",
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
    name: "Baggy Cloth Trousers",
    description: "Brown cloth trousers, badly baggy at the knees. The waist has to be held up with a rope. Surprisingly deep pockets.",
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
    name: "More Patch Than Pants",
    description: "Trousers where you can no longer tell which part was the original. Very colorful.",
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
    name: "Cut-Off Work Pants",
    description: "Trousers cut off at the knee. Probably out of necessity, not style.",
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
    name: "Worn-Out Leather Boots",
    description: "A pair of boots with soles worn quite thin. You feel every sharp stone. They keep your feet dry - as long as it doesn't rain.",
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
    name: "Stretched-Out Sandals",
    description: "Simple wooden sandals with leather straps. The straps will snap soon, that's for sure.",
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
    name: "Thick Foot Wraps",
    description: "Strips of cloth wrapped around the feet. Better than going barefoot, but not by much.",
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
    name: "Lined Leather Cap",
    description: "A simple leather cap with a wool lining. Protects your head and keeps it warm.",
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
    name: "Patchwork Mail Coif",
    description: "A chainmail coif with a few rings missing. Still better than cloth.",
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
    name: "Cheap Iron Helm",
    description: "A simple helmet of thin iron. Dents easily, but protects your skull.",
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
    name: "Padded Jacket",
    description: "A thick cloth jacket with padding. Light as a feather and surprisingly protective.",
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
    name: "Short Chain Shirt",
    description: "A short, sleeveless chain shirt. Rusty in places, but it protects well.",
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
    name: "Hardened Leather Vest",
    description: "Leather hardened in wax. Solid protection without too much weight.",
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
    name: "Sharp Hunting Knife",
    description: "A handy knife for hunting. The blade is still sharp and well cared for.",
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
    name: "Old Cavalry Saber",
    description: "A slightly curved saber from army stock. It has seen better days.",
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
    name: "Worn Broadsword",
    description: "A wide, heavy sword. The edge is dull, but the weight still hurts.",
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
    name: "Reinforced Wooden Shield",
    description: "A wooden shield with a metal rim. Takes more punishment than plain wood.",
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
    name: "Small Targe",
    description: "A small triangular shield. Easy to handle and quick to position.",
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
    name: "Rusty Buckler",
    description: "A small round fist shield. The rust barely gets in the way of blocking.",
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
    name: "Sturdy Leather Pants",
    description: "Solid leather pants that can take a beating. They creak when you walk.",
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
    name: "Short Mail Skirt",
    description: "A chainmail skirt that protects the thighs. Clinky but effective.",
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
    name: "Retired Riding Breeches",
    description: "Reinforced trousers from army stock. The leather patches are still intact.",
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
    name: "Sturdy Hiking Boots",
    description: "Well-broken-in boots with thick soles. Perfect for long marches.",
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
    name: "Studded Leather Boots",
    description: "Heavy boots with metal studs. Great for kicking, not so great for sneaking.",
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
    name: "Light Hunter's Boots",
    description: "Soft, quiet boots with good grip. Ideal for rough terrain.",
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
    name: "Mentor's Hood",
    description: "A worn hood of dark blue cloth that once belonged to a wise mentor. The fine runes along the seam glow faintly.",
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
    name: "Wanderer's School Uniform",
    description: "A sturdy leather vest with reinforced shoulder pads, as worn by traveling scholars.",
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
    name: "Steel Longsword",
    description: "A well-kept sword of hardened steel. The blade is sharp and the grip sits nicely in the hand.",
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
    name: "Iron-Banded Round Shield",
    description: "A solid wooden shield with iron fittings. Holds up far better than a simple plank.",
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
    name: "Explorer's Trekking Pants",
    description: "Durable pants of waxed linen with plenty of secret pockets.",
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
    name: "Student's Sneaky Soles",
    description: "Soft leather shoes with an anti-squeak charm - a must for anyone who wants to secretly study late at night.",
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
    name: "Scholar's Diadem",
    description: "A silver circlet set with a pulsing crystal. The engraved runes whisper forgotten knowledge.",
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
    name: "Demon Crown",
    description: "A dark crown of blackened metal. Whoever wears it senses the presence of ancient powers.",
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
    name: "Phoenix Feather Helm",
    description: "A helmet adorned with a glowing phoenix feather. The warmth of eternal fire flows through its wearer.",
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
    name: "Dragonscale Cuirass",
    description: "Armor made from real dragon scales. Every scale shimmers in a different hue.",
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
    name: "Archmage's Robe",
    description: "A flowing robe woven with magical threads. Arcane symbols glow in the face of danger.",
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
    name: "Mithril Chain Shirt",
    description: "A feather-light chain shirt made of rare mithril. It gleams like moonlight on water.",
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
    name: "Flameblade",
    description: "A sword whose blade burns with eternal fire. You can feel the heat, but it never burns its wielder.",
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
    name: "Soulcleaver",
    description: "A dark sword that seems to absorb the souls of its victims. An unholy whisper surrounds it.",
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
    name: "Lightning Saber",
    description: "A shimmering saber wreathed in electric sparks. The air crackles with every swing.",
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
    name: "Aegis of Knowledge",
    description: "A glowing shield bearing the symbol of an owl. It seems to draw knowledge from the air.",
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
    name: "Mirror Shield",
    description: "A polished shield that gleams like a perfect mirror. Enemies see their own weakness.",
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
    name: "Frostrune Shield",
    description: "A shield of eternal ice. Runes of cold are etched deep into its surface.",
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
    name: "Shadowweaver Leggings",
    description: "Pants woven from condensed shadows. They fit every wearer perfectly.",
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
    name: "Titan Tassets",
    description: "Armored leg guards made of titan plates. Heavy, but nearly indestructible.",
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
    name: "Master Scholar's Pants",
    description: "Elegant pants with hidden pockets full of notes. The seams are decorated with symbols of knowledge.",
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
    name: "Hermes Boots",
    description: "Winged boots that let their wearer almost float. Time seems to pass more slowly.",
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
    name: "Volcano-Forged Boots",
    description: "Boots forged in the heart of a volcano. Lava seems to pulse in the soles.",
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
    name: "Scholar's Walking Shoes",
    description: "Comfortable shoes that have visited countless libraries. Every step brings new insight.",
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
    name: "Crown of Omniscience",
    description: "An ancient crown that once belonged to a god of wisdom. All the secrets of the universe seem open to its wearer.",
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
    name: "Helm of the Immortals",
    description: "A helmet worn by a legendary warrior who never fell. Legend says he lived a thousand years.",
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
    name: "Starlight Tiara",
    description: "A diadem forged from the light of fallen stars. It lights up even the darkest night.",
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
    name: "Armor of the Gods",
    description: "Armor forged on the anvil of the gods themselves. Even dragons would be jealous.",
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
    name: "Vestments of the High Archmage",
    description: "The robe of the mightiest mage of all time. Arcane energy surrounds it like a storm.",
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
    name: "Adamant Plate Armor",
    description: "Massive armor of indestructible adamant. Its wearer is all but invulnerable.",
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
    name: "Worldcleaver",
    description: "A sword said to cut through reality itself. The blade seems to flicker between dimensions.",
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
    name: "Sword of Sunfire",
    description: "A blade forged in the core of a sun. Its light is so blinding that enemies must look away.",
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
    name: "Blade of Damnation",
    description: "A cursed sword holding the souls of thousands of warriors. Its will is stronger than most who wield it.",
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
    name: "Shield of Infinity",
    description: "A mystical shield that seems to send every attack into an endless loop.",
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
    name: "Aegis of Ancient Wisdom",
    description: "A shield that carries the collected knowledge of all ages. Questions seem to answer themselves.",
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
    name: "Worldwarden's Shield",
    description: "A mighty shield that once saved the world from destruction. Its power remains unbroken.",
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
    name: "Dimensionshifter Leggings",
    description: "Pants that seem to exist in several dimensions at once. The pockets are infinitely deep.",
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
    name: "Divine Greaves",
    description: "Leg armor crafted in the heavenly forges. It grants the strength of the gods.",
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
    name: "Pants of Eternal Insight",
    description: "An unremarkable pair of pants, yet whoever wears them understands the deepest truths of the universe.",
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
    name: "Boots of the Time Walker",
    description: "Boots that let their wearer slow down time. A single heartbeat can last an eternity.",
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
    name: "Worldstrider Boots",
    description: "Boots that know every road in the world. No terrain is too rough, no journey too long.",
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
    name: "Shoes of Transcendence",
    description: "Mystical shoes that carry their wearer beyond the limits of the possible.",
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
