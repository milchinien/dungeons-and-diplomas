'use client';

import { useState, useRef } from 'react';
import { MEDIEVAL_STYLES, MEDIEVAL_COLORS } from '@/lib/ui/medieval-styles';

interface MainMenuProps {
  onPlay: () => void;
  onProgress: () => void;
  onSettings: () => void;
  onProfileSelect: () => void;
  onSecretUnlocked: () => void;
  username?: string | null;
}

export default function MainMenu({ onPlay, onProgress, onSettings, onProfileSelect, onSecretUnlocked, username }: MainMenuProps) {
  // Easter egg: Track D-O-D-O sequence
  const [secretSequence, setSecretSequence] = useState<string[]>([]);
  const secretTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const TARGET_SEQUENCE = ['D', 'O', 'D', 'O'];

  const handleLetterClick = (letter: string) => {
    // Clear timeout on any click
    if (secretTimeoutRef.current) {
      clearTimeout(secretTimeoutRef.current);
    }

    // Add letter to sequence
    const newSequence = [...secretSequence, letter];
    setSecretSequence(newSequence);

    // Check if sequence matches
    const isMatch = newSequence.every((l, i) => l === TARGET_SEQUENCE[i]);

    if (isMatch && newSequence.length === TARGET_SEQUENCE.length) {
      // Success! Unlock secret menu
      console.log('[MainMenu] Secret sequence unlocked!');
      onSecretUnlocked();
      setSecretSequence([]);
    } else if (!isMatch) {
      // Wrong letter, reset sequence
      setSecretSequence([]);
    }

    // Reset sequence after 3 seconds of inactivity
    secretTimeoutRef.current = setTimeout(() => {
      setSecretSequence([]);
    }, 3000);
  };

  const renderTitle = () => {
    const title = "DUNGEONS & DIPLOMAS";
    return title.split('').map((char, index) => {
      const isDOrO = char === 'D' || char === 'O';

      return (
        <span
          key={index}
          onClick={() => isDOrO && handleLetterClick(char)}
          style={{
            cursor: 'default', // No visual indication that it's clickable
            display: 'inline-block',
          }}
        >
          {char}
        </span>
      );
    });
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        backgroundColor: '#000000',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 10000,
        backgroundImage:
          'radial-gradient(ellipse at center, #1a1410 0%, #0a0805 60%, #000000 100%)',
      }}
    >
      {/* Dark overlay for better text visibility */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          backgroundColor: 'rgba(0, 0, 0, 0.7)',
          zIndex: 0,
        }}
      />

      {/* Title */}
      <div
        style={{
          position: 'relative',
          zIndex: 1,
          marginBottom: '60px',
        }}
      >
        <h1
          style={{
            fontSize: '64px',
            fontWeight: 'bold',
            textShadow: `
              0 0 20px ${MEDIEVAL_COLORS.gold.primary},
              0 0 40px ${MEDIEVAL_COLORS.gold.dark},
              4px 4px 8px rgba(0, 0, 0, 0.8)
            `,
            letterSpacing: '4px',
            margin: 0,
            textAlign: 'center',
            userSelect: 'none',
          }}
        >
          {renderTitle()}
        </h1>
        {username && (
          <p
            style={{
              fontSize: '18px',
              color: MEDIEVAL_COLORS.text.secondary,
              textAlign: 'center',
              marginTop: '16px',
              textShadow: '2px 2px 4px rgba(0, 0, 0, 0.8)',
            }}
          >
            Willkommen zurück, <span style={{ color: MEDIEVAL_COLORS.gold.primary }}>{username}</span>!
          </p>
        )}
      </div>

      {/* Main buttons container */}
      <div
        style={{
          position: 'relative',
          zIndex: 1,
          display: 'flex',
          flexDirection: 'column',
          gap: '20px',
          alignItems: 'center',
        }}
      >
        {/* Play button */}
        <button
          onClick={onPlay}
          style={{
            ...MEDIEVAL_STYLES.button,
            padding: '24px 80px',
            fontSize: '32px',
            fontWeight: 'bold',
            color: MEDIEVAL_COLORS.text.primary,
            textTransform: 'uppercase',
            letterSpacing: '3px',
            textShadow: '2px 2px 4px rgba(0, 0, 0, 0.9)',
            transition: 'all 0.3s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = MEDIEVAL_COLORS.gold.primary;
            e.currentTarget.style.boxShadow = `
              0 0 20px ${MEDIEVAL_COLORS.gold.primary},
              inset 0 1px 0 rgba(255, 255, 255, 0.15),
              inset -1px -1px 1px rgba(255, 255, 255, 0.05),
              0 4px 12px rgba(0, 0, 0, 0.6)
            `;
            e.currentTarget.style.color = MEDIEVAL_COLORS.gold.primary;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = MEDIEVAL_COLORS.frame.border;
            e.currentTarget.style.boxShadow = `
              inset 0 1px 0 rgba(255, 255, 255, 0.1),
              inset -1px -1px 1px rgba(255, 255, 255, 0.02),
              0 2px 4px rgba(0, 0, 0, 0.5)
            `;
            e.currentTarget.style.color = MEDIEVAL_COLORS.text.primary;
          }}
        >
          Spielen
        </button>

        {/* Progress button */}
        <button
          onClick={onProgress}
          style={{
            ...MEDIEVAL_STYLES.button,
            padding: '16px 60px',
            fontSize: '24px',
            fontWeight: 'bold',
            color: MEDIEVAL_COLORS.text.secondary,
            textTransform: 'uppercase',
            letterSpacing: '2px',
            textShadow: '2px 2px 4px rgba(0, 0, 0, 0.9)',
            transition: 'all 0.3s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = MEDIEVAL_COLORS.gold.primary;
            e.currentTarget.style.boxShadow = `
              0 0 20px ${MEDIEVAL_COLORS.gold.primary},
              inset 0 1px 0 rgba(255, 255, 255, 0.15),
              inset -1px -1px 1px rgba(255, 255, 255, 0.05),
              0 4px 12px rgba(0, 0, 0, 0.6)
            `;
            e.currentTarget.style.color = MEDIEVAL_COLORS.gold.primary;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = MEDIEVAL_COLORS.frame.border;
            e.currentTarget.style.boxShadow = `
              inset 0 1px 0 rgba(255, 255, 255, 0.1),
              inset -1px -1px 1px rgba(255, 255, 255, 0.02),
              0 2px 4px rgba(0, 0, 0, 0.5)
            `;
            e.currentTarget.style.color = MEDIEVAL_COLORS.text.secondary;
          }}
        >
          Fortschritt
        </button>
      </div>

      {/* Bottom corner buttons */}
      {/* Settings button - bottom left */}
      <button
        onClick={onSettings}
        style={{
          position: 'absolute',
          bottom: '40px',
          left: '40px',
          zIndex: 1,
          ...MEDIEVAL_STYLES.button,
          padding: '20px',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '64px',
          height: '64px',
          transition: 'all 0.3s ease',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.borderColor = MEDIEVAL_COLORS.gold.primary;
          e.currentTarget.style.boxShadow = `
            0 0 20px ${MEDIEVAL_COLORS.gold.primary},
            inset 0 1px 0 rgba(255, 255, 255, 0.15),
            0 4px 12px rgba(0, 0, 0, 0.6)
          `;
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = MEDIEVAL_COLORS.frame.border;
          e.currentTarget.style.boxShadow = `
            inset 0 1px 0 rgba(255, 255, 255, 0.1),
            0 2px 4px rgba(0, 0, 0, 0.5)
          `;
        }}
        title="Einstellungen"
      >
        {/* Gear icon */}
        <svg
          width="32"
          height="32"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{ color: MEDIEVAL_COLORS.text.primary }}
        >
          <circle cx="12" cy="12" r="3" />
          <path d="M12 1v6m0 6v6m-5-5l-4.33 2.5m12.66 0L20 12.5m-8-8.66L9.5 0m0 17.66L12 19m5-5l4.33-2.5m-12.66 0L4 11.5m8 8.66L14.5 24m0-17.66L12 5" />
          <path d="m19.07 4.93-4.24 4.24m0 5.66 4.24 4.24M9.17 9.17 4.93 4.93m0 14.14 4.24-4.24" />
        </svg>
      </button>

      {/* Profile select button - bottom right */}
      <button
        onClick={onProfileSelect}
        style={{
          position: 'absolute',
          bottom: '40px',
          right: '40px',
          zIndex: 1,
          ...MEDIEVAL_STYLES.button,
          padding: '20px',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '64px',
          height: '64px',
          transition: 'all 0.3s ease',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.borderColor = MEDIEVAL_COLORS.gold.primary;
          e.currentTarget.style.boxShadow = `
            0 0 20px ${MEDIEVAL_COLORS.gold.primary},
            inset 0 1px 0 rgba(255, 255, 255, 0.15),
            0 4px 12px rgba(0, 0, 0, 0.6)
          `;
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = MEDIEVAL_COLORS.frame.border;
          e.currentTarget.style.boxShadow = `
            inset 0 1px 0 rgba(255, 255, 255, 0.1),
            0 2px 4px rgba(0, 0, 0, 0.5)
          `;
        }}
        title="Profil auswählen"
      >
        {/* Repeat/refresh icon */}
        <svg
          width="32"
          height="32"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{ color: MEDIEVAL_COLORS.text.primary }}
        >
          <polyline points="23 4 23 10 17 10" />
          <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
        </svg>
      </button>

      {/* Version info */}
      <div
        style={{
          position: 'absolute',
          bottom: '20px',
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 1,
          fontSize: '14px',
          color: MEDIEVAL_COLORS.text.muted,
          textShadow: '1px 1px 2px rgba(0, 0, 0, 0.8)',
        }}
      >
        v1.0.0 - Educational Dungeon Crawler
      </div>
    </div>
  );
}
