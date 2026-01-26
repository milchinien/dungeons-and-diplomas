/**
 * Medieval/Fantasy Metal UI Style Constants
 *
 * Unified design system for all UI elements in the dungeon crawler.
 * Based on the metal/iron frame style with rivets and metallic shine.
 */

export const MEDIEVAL_COLORS = {
  // Metal frame colors
  frame: {
    dark: '#1a1a1a',
    darker: '#0d0d0d',
    border: '#4a4a4a',
    borderLight: '#5a5a5a',
    innerBorder: '#2a2a2a',
  },

  // Rivet/decorative element colors
  rivet: {
    light: '#6a6a6a',
    dark: '#3a3a3a',
  },

  // Bar fill colors
  hp: {
    full: '#00ff00',
    medium: '#00cc00',
    low: '#009900',
    critical: '#ff0000',
    criticalMedium: '#cc0000',
    criticalLow: '#990000',
    warning: '#ffaa00',
    warningMedium: '#cc8800',
    warningLow: '#996600',
  },

  xp: {
    full: '#ffd700',
    medium: '#ccac00',
    low: '#997f00',
  },

  shield: {
    full: '#4a9eff',
    medium: '#3a7ecc',
    low: '#2a5e99',
  },

  // Gold colors
  gold: {
    primary: '#ffd700',
    secondary: '#ffed4e',
    dark: '#ccac00',
  },

  // Text colors
  text: {
    primary: '#ffffff',
    secondary: '#d4d4d4',
    muted: '#888888',
    gold: '#ffd700',
    hp: '#ff6666',
    xp: '#ffd700',
    shield: '#4a9eff',
  },

  // Panel colors
  panel: {
    background: 'rgba(15, 15, 20, 0.95)',
    border: '#4a4a4a',
    borderGold: '#8B7355',
    innerGlow: 'rgba(0, 0, 0, 0.8)',
  },

  // Accent colors for mastery levels
  mastery: {
    beginner: '#ff9800',
    advanced: '#2196F3',
    master: '#4CAF50',
    perfect: '#FFD700',
  },
} as const;

export const MEDIEVAL_STYLES = {
  // Standard metal frame bar container
  barFrame: {
    background: `linear-gradient(180deg, ${MEDIEVAL_COLORS.frame.dark} 0%, ${MEDIEVAL_COLORS.frame.darker} 100%)`,
    border: `3px solid ${MEDIEVAL_COLORS.frame.border}`,
    borderRadius: '2px',
    boxShadow: `inset 0 2px 4px ${MEDIEVAL_COLORS.panel.innerGlow}, 0 2px 4px rgba(0, 0, 0, 0.5)`,
    outline: `1px solid ${MEDIEVAL_COLORS.frame.innerBorder}`,
    outlineOffset: '-6px',
  },

  // Small metal frame (for smaller bars)
  barFrameSmall: {
    background: `linear-gradient(180deg, ${MEDIEVAL_COLORS.frame.dark} 0%, ${MEDIEVAL_COLORS.frame.darker} 100%)`,
    border: `2px solid ${MEDIEVAL_COLORS.frame.border}`,
    borderRadius: '2px',
    boxShadow: `inset 0 1px 3px ${MEDIEVAL_COLORS.panel.innerGlow}, 0 1px 3px rgba(0, 0, 0, 0.5)`,
  },

  // Inner shadow overlay for depth
  innerShadow: {
    position: 'absolute' as const,
    top: 0,
    left: 0,
    right: 0,
    height: '3px',
    background: 'linear-gradient(180deg, rgba(0,0,0,0.6) 0%, transparent 100%)',
    pointerEvents: 'none' as const,
    zIndex: 2,
  },

  // Shine effect on bar fill
  shineEffect: {
    position: 'absolute' as const,
    top: '2px',
    left: 0,
    height: '40%',
    background: 'linear-gradient(180deg, rgba(255,255,255,0.4) 0%, transparent 100%)',
    pointerEvents: 'none' as const,
  },

  // Text style for bar labels
  barLabel: {
    fontSize: '14px',
    fontWeight: 'bold' as const,
    textTransform: 'uppercase' as const,
    letterSpacing: '1.5px',
    textShadow: '2px 2px 3px rgba(0, 0, 0, 0.9)',
  },

  // Text style for bar values
  barValue: {
    fontSize: '14px',
    fontWeight: 'bold' as const,
    color: MEDIEVAL_COLORS.text.primary,
    textShadow: '0 0 4px rgba(0, 0, 0, 1), 2px 2px 3px rgba(0, 0, 0, 0.9)',
    fontFamily: 'monospace',
  },

  // Panel container style
  panelFrame: {
    backgroundColor: MEDIEVAL_COLORS.panel.background,
    border: `3px solid ${MEDIEVAL_COLORS.frame.border}`,
    borderRadius: '4px',
    boxShadow: `
      inset 0 1px 0 rgba(255, 255, 255, 0.05),
      0 4px 16px rgba(0, 0, 0, 0.7),
      0 0 0 1px ${MEDIEVAL_COLORS.frame.innerBorder}
    `,
  },

  // Metal rivet style
  rivet: {
    width: '4px',
    height: '4px',
    borderRadius: '50%',
    background: `radial-gradient(circle, ${MEDIEVAL_COLORS.rivet.light} 0%, ${MEDIEVAL_COLORS.rivet.dark} 100%)`,
    boxShadow: 'inset 0 1px 1px rgba(255,255,255,0.3)',
    zIndex: 4,
  },

  // Section divider
  divider: {
    height: '1px',
    background: `linear-gradient(90deg, transparent 0%, ${MEDIEVAL_COLORS.frame.border} 50%, transparent 100%)`,
    margin: '8px 0',
  },

  // Button style
  button: {
    background: `linear-gradient(180deg, ${MEDIEVAL_COLORS.frame.dark} 0%, ${MEDIEVAL_COLORS.frame.darker} 100%)`,
    border: `2px solid ${MEDIEVAL_COLORS.frame.border}`,
    borderRadius: '2px',
    boxShadow: `inset 0 1px 0 rgba(255, 255, 255, 0.1), 0 2px 4px rgba(0, 0, 0, 0.5)`,
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },

  buttonHover: {
    borderColor: MEDIEVAL_COLORS.frame.borderLight,
    boxShadow: `inset 0 1px 0 rgba(255, 255, 255, 0.15), 0 2px 6px rgba(0, 0, 0, 0.6)`,
  },
} as const;

/**
 * Generate gradient for HP bar based on percentage
 */
export function getHpGradient(percentage: number): string {
  if (percentage <= 25) {
    return `linear-gradient(180deg, ${MEDIEVAL_COLORS.hp.critical} 0%, ${MEDIEVAL_COLORS.hp.criticalMedium} 50%, ${MEDIEVAL_COLORS.hp.criticalLow} 100%)`;
  } else if (percentage <= 50) {
    return `linear-gradient(180deg, ${MEDIEVAL_COLORS.hp.warning} 0%, ${MEDIEVAL_COLORS.hp.warningMedium} 50%, ${MEDIEVAL_COLORS.hp.warningLow} 100%)`;
  }
  return `linear-gradient(180deg, ${MEDIEVAL_COLORS.hp.full} 0%, ${MEDIEVAL_COLORS.hp.medium} 50%, ${MEDIEVAL_COLORS.hp.low} 100%)`;
}

/**
 * Get glow color for HP bar based on percentage
 */
export function getHpGlowColor(percentage: number): string {
  if (percentage <= 25) return MEDIEVAL_COLORS.hp.critical;
  if (percentage <= 50) return MEDIEVAL_COLORS.hp.warning;
  return MEDIEVAL_COLORS.hp.full;
}

/**
 * Generate gradient for XP bar
 */
export function getXpGradient(): string {
  return `linear-gradient(180deg, ${MEDIEVAL_COLORS.xp.full} 0%, ${MEDIEVAL_COLORS.xp.medium} 50%, ${MEDIEVAL_COLORS.xp.low} 100%)`;
}

/**
 * Generate gradient for shield/mana bar
 */
export function getShieldGradient(): string {
  return `linear-gradient(180deg, ${MEDIEVAL_COLORS.shield.full} 0%, ${MEDIEVAL_COLORS.shield.medium} 50%, ${MEDIEVAL_COLORS.shield.low} 100%)`;
}

export type MedievalColors = typeof MEDIEVAL_COLORS;
export type MedievalStyles = typeof MEDIEVAL_STYLES;
