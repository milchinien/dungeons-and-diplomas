/**
 * Medieval/Fantasy Metal UI Style Constants
 *
 * Unified design system for all UI elements in the dungeon crawler.
 * Based on the metal/iron frame style with rivets, metallic shine, and textures.
 */

/**
 * Generate SVG noise texture pattern for metallic surfaces
 * Uses feTurbulence for realistic scratched/worn metal effect
 */
export function getMetalNoisePattern(id: string = 'metal-noise'): string {
  return `
    <svg width="0" height="0" style="position: absolute;">
      <defs>
        <filter id="${id}">
          <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="4" result="noise" />
          <feColorMatrix in="noise" type="saturate" values="0" result="desaturated" />
          <feComponentTransfer in="desaturated" result="opacity">
            <feFuncA type="table" tableValues="0 0.05 0.1" />
          </feComponentTransfer>
          <feBlend in="SourceGraphic" in2="opacity" mode="multiply" />
        </filter>
      </defs>
    </svg>
  `.trim();
}

/**
 * Generate SVG scratch pattern for worn metal
 */
export function getScratchPattern(id: string = 'metal-scratches'): string {
  return `
    <svg width="0" height="0" style="position: absolute;">
      <defs>
        <filter id="${id}">
          <feTurbulence type="fractalNoise" baseFrequency="2 0.05" numOctaves="2" result="scratches" />
          <feColorMatrix in="scratches" type="saturate" values="0" />
          <feComponentTransfer result="opacity">
            <feFuncA type="table" tableValues="0 0 0.8 0.1" />
          </feComponentTransfer>
        </filter>
      </defs>
    </svg>
  `.trim();
}

/**
 * Data URL for inline SVG noise (no external element needed)
 */
export const METAL_NOISE_DATA_URL = 'data:image/svg+xml,' + encodeURIComponent(`
  <svg xmlns="http://www.w3.org/2000/svg" width="200" height="200">
    <filter id="noise">
      <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="4" />
    </filter>
    <rect width="200" height="200" filter="url(#noise)" opacity="0.08" />
  </svg>
`);

/**
 * Data URL for scratch pattern
 */
export const SCRATCH_PATTERN_DATA_URL = 'data:image/svg+xml,' + encodeURIComponent(`
  <svg xmlns="http://www.w3.org/2000/svg" width="300" height="100">
    <filter id="scratches">
      <feTurbulence type="fractalNoise" baseFrequency="2 0.05" numOctaves="2" />
    </filter>
    <rect width="300" height="100" filter="url(#scratches)" opacity="0.15" />
  </svg>
`);

export const MEDIEVAL_COLORS = {
  // Metal frame colors with rust/patina variations
  frame: {
    dark: '#1a1a1a',
    darker: '#0d0d0d',
    border: '#4a4a4a',
    borderLight: '#5a5a5a',
    innerBorder: '#2a2a2a',
    rust: '#8b4513',
    rustDark: '#6b3410',
    patina: '#3d5c4f',
    bronze: '#8b6914',
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
  // Standard metal frame bar container with texture
  barFrame: {
    background: `
      url("${METAL_NOISE_DATA_URL}"),
      url("${SCRATCH_PATTERN_DATA_URL}"),
      linear-gradient(180deg, ${MEDIEVAL_COLORS.frame.dark} 0%, ${MEDIEVAL_COLORS.frame.darker} 100%)
    `,
    backgroundBlendMode: 'overlay, overlay, normal',
    border: `3px solid ${MEDIEVAL_COLORS.frame.border}`,
    borderRadius: '2px',
    boxShadow: `
      inset 0 2px 4px ${MEDIEVAL_COLORS.panel.innerGlow},
      inset -1px -1px 2px rgba(255, 255, 255, 0.05),
      0 2px 4px rgba(0, 0, 0, 0.5)
    `,
    outline: `1px solid ${MEDIEVAL_COLORS.frame.innerBorder}`,
    outlineOffset: '-6px',
  },

  // Small metal frame (for smaller bars) with texture
  barFrameSmall: {
    background: `
      url("${METAL_NOISE_DATA_URL}"),
      linear-gradient(180deg, ${MEDIEVAL_COLORS.frame.dark} 0%, ${MEDIEVAL_COLORS.frame.darker} 100%)
    `,
    backgroundBlendMode: 'overlay, normal',
    border: `2px solid ${MEDIEVAL_COLORS.frame.border}`,
    borderRadius: '2px',
    boxShadow: `
      inset 0 1px 3px ${MEDIEVAL_COLORS.panel.innerGlow},
      inset -1px -1px 1px rgba(255, 255, 255, 0.05),
      0 1px 3px rgba(0, 0, 0, 0.5)
    `,
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

  // Panel container style with texture and edge wear
  panelFrame: {
    background: `
      url("${METAL_NOISE_DATA_URL}"),
      url("${SCRATCH_PATTERN_DATA_URL}"),
      linear-gradient(135deg, rgba(255, 255, 255, 0.02) 0%, transparent 50%, rgba(0, 0, 0, 0.1) 100%),
      ${MEDIEVAL_COLORS.panel.background}
    `,
    backgroundBlendMode: 'overlay, overlay, overlay, normal',
    border: `3px solid ${MEDIEVAL_COLORS.frame.border}`,
    borderRadius: '4px',
    boxShadow: `
      inset 0 1px 0 rgba(255, 255, 255, 0.05),
      inset -2px -2px 3px rgba(255, 255, 255, 0.02),
      0 4px 16px rgba(0, 0, 0, 0.7),
      0 0 0 1px ${MEDIEVAL_COLORS.frame.innerBorder}
    `,
  },

  // Enhanced 3D metal rivet style
  rivet: {
    width: '4px',
    height: '4px',
    borderRadius: '50%',
    background: `
      radial-gradient(circle at 30% 30%, ${MEDIEVAL_COLORS.rivet.light} 0%, ${MEDIEVAL_COLORS.rivet.dark} 70%, #1a1a1a 100%)
    `,
    boxShadow: `
      inset 1px 1px 1px rgba(255, 255, 255, 0.4),
      inset -1px -1px 1px rgba(0, 0, 0, 0.6),
      0 1px 2px rgba(0, 0, 0, 0.5)
    `,
    border: '0.5px solid rgba(0, 0, 0, 0.3)',
    zIndex: 4,
  },

  // Section divider
  divider: {
    height: '1px',
    background: `linear-gradient(90deg, transparent 0%, ${MEDIEVAL_COLORS.frame.border} 50%, transparent 100%)`,
    margin: '8px 0',
  },

  // Button style with texture
  button: {
    background: `
      url("${METAL_NOISE_DATA_URL}"),
      linear-gradient(180deg, ${MEDIEVAL_COLORS.frame.dark} 0%, ${MEDIEVAL_COLORS.frame.darker} 100%)
    `,
    backgroundBlendMode: 'overlay, normal',
    border: `2px solid ${MEDIEVAL_COLORS.frame.border}`,
    borderRadius: '2px',
    boxShadow: `
      inset 0 1px 0 rgba(255, 255, 255, 0.1),
      inset -1px -1px 1px rgba(255, 255, 255, 0.02),
      0 2px 4px rgba(0, 0, 0, 0.5)
    `,
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },

  buttonHover: {
    borderColor: MEDIEVAL_COLORS.frame.borderLight,
    boxShadow: `
      inset 0 1px 0 rgba(255, 255, 255, 0.15),
      inset -1px -1px 1px rgba(255, 255, 255, 0.05),
      0 2px 6px rgba(0, 0, 0, 0.6)
    `,
  },
} as const;

/**
 * Generate gradient for HP bar based on percentage with texture overlay
 */
export function getHpGradient(percentage: number): string {
  let gradient = '';
  if (percentage <= 25) {
    gradient = `linear-gradient(180deg, ${MEDIEVAL_COLORS.hp.critical} 0%, ${MEDIEVAL_COLORS.hp.criticalMedium} 50%, ${MEDIEVAL_COLORS.hp.criticalLow} 100%)`;
  } else if (percentage <= 50) {
    gradient = `linear-gradient(180deg, ${MEDIEVAL_COLORS.hp.warning} 0%, ${MEDIEVAL_COLORS.hp.warningMedium} 50%, ${MEDIEVAL_COLORS.hp.warningLow} 100%)`;
  } else {
    gradient = `linear-gradient(180deg, ${MEDIEVAL_COLORS.hp.full} 0%, ${MEDIEVAL_COLORS.hp.medium} 50%, ${MEDIEVAL_COLORS.hp.low} 100%)`;
  }

  // Add texture overlay for more realistic look
  return `
    url("${METAL_NOISE_DATA_URL}"),
    ${gradient}
  `;
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
 * Generate gradient for XP bar with metallic shimmer
 */
export function getXpGradient(): string {
  return `
    url("${METAL_NOISE_DATA_URL}"),
    linear-gradient(90deg, transparent 0%, rgba(255, 255, 255, 0.3) 50%, transparent 100%),
    linear-gradient(180deg, ${MEDIEVAL_COLORS.xp.full} 0%, ${MEDIEVAL_COLORS.xp.medium} 50%, ${MEDIEVAL_COLORS.xp.low} 100%)
  `;
}

/**
 * Generate gradient for shield/mana bar with glass effect
 */
export function getShieldGradient(): string {
  return `
    url("${METAL_NOISE_DATA_URL}"),
    linear-gradient(180deg, ${MEDIEVAL_COLORS.shield.full} 0%, ${MEDIEVAL_COLORS.shield.medium} 50%, ${MEDIEVAL_COLORS.shield.low} 100%)
  `;
}

export type MedievalColors = typeof MEDIEVAL_COLORS;
export type MedievalStyles = typeof MEDIEVAL_STYLES;
