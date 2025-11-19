// Design tokens extracted from Combat-Raum.png and Karte.png
export const theme = {
  colors: {
    // Background colors
    background: '#4a4a4a',
    stone: '#666666',
    uiDark: '#2a2a2a',
    border: '#1a1a1a',

    // Character colors
    playerGreen: '#00ff00',
    enemyGreen: '#33cc66',

    // HP bars
    hpGreen: '#00ff00',
    hpRed: '#ff0000',
    hpBackground: '#ffffff',

    // Room colors
    gold: '#ffcc00',
    shopBlue: '#6699cc',
    bossRed: '#cc3333',
    torchFire: '#ff9933',

    // UI elements
    textPrimary: '#ffffff',
    textSecondary: '#cccccc',
  },

  spacing: {
    xs: '4px',
    sm: '8px',
    md: '16px',
    lg: '24px',
    xl: '32px',
    xxl: '48px',
    xxxl: '64px',
  },

  fontSize: {
    xs: '12px',
    sm: '14px',
    md: '16px',
    lg: '20px',
    xl: '24px',
    xxl: '32px',
    xxxl: '48px',
  },

  borderRadius: {
    sm: '4px',
    md: '8px',
    lg: '12px',
    round: '50%',
  },

  game: {
    width: 1280,
    height: 720,
  },
};

export type Theme = typeof theme;
