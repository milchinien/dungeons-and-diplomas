/**
 * Centralized UI color constants
 *
 * Usage: import { COLORS, RENDER_COLORS } from '@/lib/ui/colors';
 */

export const COLORS = {
  // Status colors
  success: '#4CAF50',
  error: '#FF4444',
  warning: '#FFA500',

  // Gold/accent colors
  gold: '#FFD700',

  // Background colors
  background: {
    dark: '#1a1a2e',
    darker: '#0f0f1a',
    panel: '#1a1a1a',
    input: '#2a2a2a',
  },

  // Border colors
  border: {
    gold: '#8B7355',
    light: '#a08060',
    input: '#555',
  },

  // Text colors
  text: {
    primary: '#fff',
    secondary: '#ccc',
    muted: '#aaa',
  }
} as const;

/**
 * Rendering-specific color constants for canvas operations
 *
 * Usage: import { RENDER_COLORS } from '@/lib/ui/colors';
 */
export const RENDER_COLORS = {
  // Canvas background
  BACKGROUND: '#000000',

  // Missing/placeholder tile indicator (magenta)
  MISSING_TILE: '#FF00FF',

  // Minimap colors
  minimap: {
    treasure: '#FFD700',
    combat: '#FF4444',
    empty: '#888888',
    wall: '#444444',
    door: '#4CAF50',
    player: '#00FFFF',
  },

  // Editor colors
  editor: {
    selection: '#00FFFF',
    border: '#000000',
    text: '#000000',
    enemyLevelEasy: '#00ff00',
    enemyLevelMedium: '#ffff00',
    enemyLevelHard: '#ff0000',
    playerSpawn: 'rgba(0, 255, 255, 0.5)',
    playerSpawnBorder: '#00FFFF',
  }
} as const;

export type Colors = typeof COLORS;
export type RenderColors = typeof RENDER_COLORS;
