/**
 * Skill Tree Definitions
 *
 * All 15 skills across 3 trees (Attack, Defense, Utility)
 * Skills are passive bonuses that permanently enhance player stats.
 */

import type { SkillDefinition } from './types';

/**
 * Attack Tree Skills (5 skills)
 *
 * Focus: Damage output and critical strikes
 */
export const ATTACK_SKILLS: SkillDefinition[] = [
  {
    id: 'atk_damage',
    tree: 'attack',
    name: 'Schadenssteigerung',
    description: 'Erhöht den Schaden bei richtigen Antworten.',
    icon: '⚔️',
    maxLevel: 5,
    effectType: 'damage_bonus',
    effectPerLevel: 2,
    dependencies: [],
  },
  {
    id: 'atk_crit_chance',
    tree: 'attack',
    name: 'Kritische Treffer',
    description: 'Chance auf kritische Treffer mit doppeltem Schaden.',
    icon: '💥',
    maxLevel: 3,
    effectType: 'crit_chance',
    effectPerLevel: 5, // 5% per level
    dependencies: [],
  },
  {
    id: 'atk_crit_damage',
    tree: 'attack',
    name: 'Kritischer Schaden',
    description: 'Erhöht den Schaden kritischer Treffer.',
    icon: '💢',
    maxLevel: 3,
    effectType: 'crit_damage',
    effectPerLevel: 0.1, // +10% per level (multiplier)
    dependencies: [
      { skillId: 'atk_crit_chance', requiredLevel: 1 },
    ],
  },
  {
    id: 'atk_combo',
    tree: 'attack',
    name: 'Kombo-Meister',
    description: 'Erhöht den Bonus-Schaden durch Kombos.',
    icon: '🔥',
    maxLevel: 4,
    effectType: 'combo_damage',
    effectPerLevel: 1,
    dependencies: [
      { skillId: 'atk_damage', requiredLevel: 2 },
    ],
  },
  {
    id: 'atk_first_strike',
    tree: 'attack',
    name: 'Erstschlag',
    description: 'Fügt bei der ersten Frage im Kampf Extra-Schaden zu.',
    icon: '⚡',
    maxLevel: 1,
    effectType: 'first_strike',
    effectPerLevel: 5,
    dependencies: [],
  },
  {
    id: 'atk_execute',
    tree: 'attack',
    name: 'Hinrichtung',
    description: 'Verursacht Extra-Schaden gegen Gegner mit weniger als 30% HP.',
    icon: '💀',
    maxLevel: 3,
    effectType: 'execute_damage',
    effectPerLevel: 5, // +5 damage per level when enemy low HP
    dependencies: [
      { skillId: 'atk_damage', requiredLevel: 3 },
    ],
  },
  {
    id: 'atk_double_strike',
    tree: 'attack',
    name: 'Doppelschlag',
    description: 'Chance, bei richtiger Antwort doppelten Schaden zu verursachen.',
    icon: '⚔️⚔️',
    maxLevel: 3,
    effectType: 'double_strike',
    effectPerLevel: 8, // 8% chance per level
    dependencies: [
      { skillId: 'atk_crit_chance', requiredLevel: 2 },
    ],
  },
];

/**
 * Defense Tree Skills (5 skills)
 *
 * Focus: HP, damage reduction, and shields
 */
export const DEFENSE_SKILLS: SkillDefinition[] = [
  {
    id: 'def_max_hp',
    tree: 'defense',
    name: 'Konstitution',
    description: 'Erhöht die maximalen Lebenspunkte.',
    icon: '❤️',
    maxLevel: 5,
    effectType: 'max_hp',
    effectPerLevel: 20,
    dependencies: [],
  },
  {
    id: 'def_reduction',
    tree: 'defense',
    name: 'Panzerung',
    description: 'Reduziert erlittenen Schaden bei falschen Antworten.',
    icon: '🛡️',
    maxLevel: 5,
    effectType: 'damage_reduction',
    effectPerLevel: 2,
    dependencies: [],
  },
  {
    id: 'def_shield',
    tree: 'defense',
    name: 'Schildmeister',
    description: 'Erhöht die maximale Schildstärke.',
    icon: '🔰',
    maxLevel: 3,
    effectType: 'shield_max',
    effectPerLevel: 10,
    dependencies: [],
  },
  {
    id: 'def_shield_regen',
    tree: 'defense',
    name: 'Schildregeneration',
    description: 'Regeneriert Schild schneller im Kampf.',
    icon: '✨',
    maxLevel: 3,
    effectType: 'shield_regen',
    effectPerLevel: 1, // +1 shield per second
    dependencies: [
      { skillId: 'def_shield', requiredLevel: 1 },
    ],
  },
  {
    id: 'def_hp_regen',
    tree: 'defense',
    name: 'Heilfaktor',
    description: 'Regeneriert Lebenspunkte während des Kampfes.',
    icon: '💚',
    maxLevel: 2,
    effectType: 'hp_regen',
    effectPerLevel: 1, // +1 HP per regen tick
    dependencies: [
      { skillId: 'def_max_hp', requiredLevel: 3 },
    ],
  },
  {
    id: 'def_thorns',
    tree: 'defense',
    name: 'Dornen',
    description: 'Reflektiert einen Teil des erlittenen Schadens zurück zum Gegner.',
    icon: '🌵',
    maxLevel: 3,
    effectType: 'thorns',
    effectPerLevel: 10, // 10% damage reflected per level
    dependencies: [
      { skillId: 'def_reduction', requiredLevel: 2 },
    ],
  },
  {
    id: 'def_last_stand',
    tree: 'defense',
    name: 'Letztes Gefecht',
    description: 'Erhöht den Schaden wenn die eigenen HP unter 30% fallen.',
    icon: '🔥',
    maxLevel: 3,
    effectType: 'low_hp_damage',
    effectPerLevel: 15, // +15% damage per level when low HP
    dependencies: [
      { skillId: 'def_max_hp', requiredLevel: 2 },
    ],
  },
];

/**
 * Utility Tree Skills (5 skills)
 *
 * Focus: Time, XP, hints, and special effects
 */
export const UTILITY_SKILLS: SkillDefinition[] = [
  {
    id: 'util_time',
    tree: 'utility',
    name: 'Zeitmeister',
    description: 'Gibt mehr Zeit zum Beantworten von Fragen.',
    icon: '⏱️',
    maxLevel: 5,
    effectType: 'time_bonus',
    effectPerLevel: 2, // +2 seconds per level
    dependencies: [],
  },
  {
    id: 'util_xp',
    tree: 'utility',
    name: 'Gelehrter',
    description: 'Erhöht die erhaltenen Erfahrungspunkte.',
    icon: '📚',
    maxLevel: 5,
    effectType: 'xp_bonus',
    effectPerLevel: 10, // +10% per level
    dependencies: [],
  },
  {
    id: 'util_hint',
    tree: 'utility',
    name: 'Weisheit',
    description: 'Erhöht die Chance auf Hinweise bei schweren Fragen.',
    icon: '💡',
    maxLevel: 4,
    effectType: 'hint_chance',
    effectPerLevel: 8, // +8% per level
    dependencies: [],
  },
  {
    id: 'util_treasure',
    tree: 'utility',
    name: 'Schatzsucher',
    description: 'Verbessert die Qualität gefundener Schätze.',
    icon: '💰',
    maxLevel: 3,
    effectType: 'treasure_quality',
    effectPerLevel: 15, // +15% per level
    dependencies: [
      { skillId: 'util_xp', requiredLevel: 2 },
    ],
  },
  {
    id: 'util_vision',
    tree: 'utility',
    name: 'Weitblick',
    description: 'Enthüllt angrenzende Räume im Nebel des Krieges.',
    icon: '👁️',
    maxLevel: 2,
    effectType: 'fog_reveal',
    effectPerLevel: 1, // +1 tile reveal radius
    dependencies: [
      { skillId: 'util_hint', requiredLevel: 2 },
    ],
  },
  {
    id: 'util_lucky',
    tree: 'utility',
    name: 'Glückspilz',
    description: 'Erhöht das Glück bei zufälligen Ereignissen und Belohnungen.',
    icon: '🍀',
    maxLevel: 5,
    effectType: 'luck_bonus',
    effectPerLevel: 5, // +5% luck per level
    dependencies: [],
  },
  {
    id: 'util_speed',
    tree: 'utility',
    name: 'Schnellläufer',
    description: 'Erhöht die Bewegungsgeschwindigkeit im Dungeon.',
    icon: '👟',
    maxLevel: 3,
    effectType: 'move_speed',
    effectPerLevel: 10, // +10% move speed per level
    dependencies: [
      { skillId: 'util_treasure', requiredLevel: 1 },
    ],
  },
];

/**
 * Knowledge Tree Skills (5 skills)
 *
 * Focus: Quiz-based advantages and learning bonuses
 */
export const KNOWLEDGE_SKILLS: SkillDefinition[] = [
  {
    id: 'know_mastery',
    tree: 'knowledge',
    name: 'Fachkenntnis',
    description: 'Erhöht den Schaden bei Fragen aus beherrschten Fachgebieten.',
    icon: '🎓',
    maxLevel: 5,
    effectType: 'mastery_bonus',
    effectPerLevel: 10, // +10% damage per level for mastered subjects
    dependencies: [],
  },
  {
    id: 'know_elimination',
    tree: 'knowledge',
    name: 'Eliminierung',
    description: 'Chance, eine falsche Antwort vor der Auswahl zu entfernen.',
    icon: '❌',
    maxLevel: 4,
    effectType: 'elimination_chance',
    effectPerLevel: 10, // 10% chance per level
    dependencies: [],
  },
  {
    id: 'know_streak',
    tree: 'knowledge',
    name: 'Antwort-Serie',
    description: 'Bonus-Schaden für jede richtige Antwort in Folge.',
    icon: '🔗',
    maxLevel: 5,
    effectType: 'streak_bonus',
    effectPerLevel: 1, // +1 damage per streak per level
    dependencies: [
      { skillId: 'know_mastery', requiredLevel: 2 },
    ],
  },
  {
    id: 'know_retry',
    tree: 'knowledge',
    name: 'Zweiter Versuch',
    description: 'Chance, bei falscher Antwort erneut antworten zu dürfen.',
    icon: '🔄',
    maxLevel: 3,
    effectType: 'retry_chance',
    effectPerLevel: 8, // 8% chance per level
    dependencies: [
      { skillId: 'know_elimination', requiredLevel: 2 },
    ],
  },
  {
    id: 'know_insight',
    tree: 'knowledge',
    name: 'Einsicht',
    description: 'Bei Timeout wird eine teilweise Antwort angezeigt (reduzierter Schaden).',
    icon: '🔮',
    maxLevel: 2,
    effectType: 'insight_chance',
    effectPerLevel: 25, // 25% chance per level
    dependencies: [
      { skillId: 'know_streak', requiredLevel: 3 },
      { skillId: 'know_retry', requiredLevel: 1 },
    ],
  },
];

/**
 * All skills combined (26 total)
 */
export const ALL_SKILLS: SkillDefinition[] = [
  ...ATTACK_SKILLS,
  ...DEFENSE_SKILLS,
  ...UTILITY_SKILLS,
  ...KNOWLEDGE_SKILLS,
];

/**
 * Skills grouped by tree
 */
export const SKILLS_BY_TREE = {
  attack: ATTACK_SKILLS,
  defense: DEFENSE_SKILLS,
  utility: UTILITY_SKILLS,
  knowledge: KNOWLEDGE_SKILLS,
} as const;

/**
 * Get a skill definition by ID
 */
export function getSkillById(skillId: string): SkillDefinition | undefined {
  return ALL_SKILLS.find((skill) => skill.id === skillId);
}

/**
 * Get all skills for a specific tree
 */
export function getSkillsByTree(tree: 'attack' | 'defense' | 'utility' | 'knowledge'): SkillDefinition[] {
  return SKILLS_BY_TREE[tree];
}

/**
 * Total number of skills in the system
 */
export const TOTAL_SKILLS = ALL_SKILLS.length;
