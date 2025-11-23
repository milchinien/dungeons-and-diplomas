'use client';

import { CSSProperties, ReactNode } from 'react';

/**
 * Shared overlay container for Victory/Defeat screens
 *
 * Provides consistent positioning, z-index, and basic styling.
 */

export const OVERLAY_STYLES = {
  container: {
    position: 'fixed' as const,
    top: 0,
    left: 0,
    width: '100vw',
    height: '100vh',
    zIndex: 2000,
  },
  title: {
    fontSize: '120px',
    fontWeight: 900,
    userSelect: 'none' as const,
    letterSpacing: '10px',
  },
  subtitle: {
    fontSize: '36px',
    fontWeight: 600,
    color: '#CCCCCC',
    userSelect: 'none' as const,
  },
};

interface GameOverlayProps {
  children: ReactNode;
  backgroundColor?: string;
  pointerEvents?: 'none' | 'auto';
  style?: CSSProperties;
}

export default function GameOverlay({
  children,
  backgroundColor,
  pointerEvents = 'auto',
  style,
}: GameOverlayProps) {
  return (
    <div
      style={{
        ...OVERLAY_STYLES.container,
        backgroundColor,
        pointerEvents,
        overflow: 'hidden',
        ...style,
      }}
    >
      {children}
    </div>
  );
}
