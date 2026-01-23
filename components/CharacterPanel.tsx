'use client';

import { CharacterHeader } from './character/CharacterHeader';
import { HpBar } from './character/HpBar';
import { XpProgressBar } from './character/XpProgressBar';
import { MasteryCircles } from './character/MasteryCircles';
import { ActionButtons } from './character/ActionButtons';
import { MEDIEVAL_COLORS, MEDIEVAL_STYLES } from '@/lib/ui/medieval-styles';
import type { SubjectScore } from './character/MasteryCircles';
import { ShopItemsDisplay } from './character/ShopItemsDisplay';
import type { Item } from '@/lib/shop/Item';
import type { Perk } from '@/lib/shop/Perk';

interface CharacterPanelProps {
  username: string;
  scores: SubjectScore[];
  level: number;
  currentXp: number;
  xpForCurrentLevel: number;
  xpForNextLevel: number;
  currentHp: number;
  maxHp: number;
  gold: number;
  onLogout: () => void;
  onRestart: () => void;
  onSkills: () => void;
  onSettings?: () => void;
  equippedItems?: Item[];
  activePerks?: Perk[];
}

/**
 * Character panel in medieval metal frame style
 */
export default function CharacterPanel({
  username,
  scores,
  level,
  currentXp,
  xpForCurrentLevel,
  xpForNextLevel,
  currentHp,
  maxHp,
  gold,
  onLogout,
  onRestart,
  onSkills,
  onSettings,
  equippedItems = [],
  activePerks = []
}: CharacterPanelProps) {
  return (
    <div style={{
      position: 'absolute',
      top: '10px',
      left: '10px',
      zIndex: 100,
      ...MEDIEVAL_STYLES.panelFrame,
      padding: '12px',
      minWidth: '260px',
    }}>
      {/* Corner rivets for the main panel */}
      <div style={{
        position: 'absolute',
        top: '6px',
        left: '6px',
        ...MEDIEVAL_STYLES.rivet,
        width: '6px',
        height: '6px',
      }} />
      <div style={{
        position: 'absolute',
        top: '6px',
        right: '6px',
        ...MEDIEVAL_STYLES.rivet,
        width: '6px',
        height: '6px',
      }} />
      <div style={{
        position: 'absolute',
        bottom: '6px',
        left: '6px',
        ...MEDIEVAL_STYLES.rivet,
        width: '6px',
        height: '6px',
      }} />
      <div style={{
        position: 'absolute',
        bottom: '6px',
        right: '6px',
        ...MEDIEVAL_STYLES.rivet,
        width: '6px',
        height: '6px',
      }} />

      {/* Inner metal border effect */}
      <div style={{
        position: 'absolute',
        top: '3px',
        left: '3px',
        right: '3px',
        bottom: '3px',
        border: `1px solid ${MEDIEVAL_COLORS.frame.innerBorder}`,
        borderRadius: '2px',
        pointerEvents: 'none',
      }} />

      <CharacterHeader username={username} level={level} />

      <HpBar currentHp={currentHp} maxHp={maxHp} />

      <XpProgressBar
        currentXp={currentXp}
        xpForCurrentLevel={xpForCurrentLevel}
        xpForNextLevel={xpForNextLevel}
      />

      {/* Gold Display */}
      <div style={{
        margin: '6px 0',
        padding: '4px 8px',
        background: `linear-gradient(135deg, ${MEDIEVAL_COLORS.gold.primary}15, ${MEDIEVAL_COLORS.gold.secondary}15)`,
        border: `1px solid ${MEDIEVAL_COLORS.gold.primary}60`,
        borderRadius: '3px',
        display: 'flex',
        alignItems: 'center',
        gap: '6px'
      }}>
        <span style={{
          fontSize: '16px',
          filter: 'drop-shadow(0 0 2px rgba(255, 215, 0, 0.8))'
        }}>🪙</span>
        <span style={{
          fontFamily: 'monospace',
          fontSize: '14px',
          fontWeight: 'bold',
          color: MEDIEVAL_COLORS.gold.primary,
          textShadow: `0 0 4px ${MEDIEVAL_COLORS.gold.secondary}80`,
          letterSpacing: '0.5px'
        }}>
          {gold}
        </span>
        <span style={{
          fontSize: '11px',
          color: MEDIEVAL_COLORS.text.secondary,
          opacity: 0.8
        }}>
          Gold
        </span>
      </div>

      <MasteryCircles scores={scores} />

      <ShopItemsDisplay
        equippedItems={equippedItems}
        activePerks={activePerks}
      />

      <ActionButtons
        onRestart={onRestart}
        onSkills={onSkills}
        onLogout={onLogout}
        onSettings={onSettings}
      />
    </div>
  );
}
