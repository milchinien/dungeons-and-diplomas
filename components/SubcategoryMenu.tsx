'use client';

import { useState } from 'react';
import GameOverlay from './GameOverlay';
import { COLORS } from '@/lib/ui/colors';

interface SubcategoryMenuProps {
  dungeonType: string;
  onSelectSubcategory: (subcategory: string) => void;
  onBack: () => void;
}

interface SubcategoryButtonProps {
  label: string;
  description: string;
  onClick: () => void;
  isAvailable?: boolean;
}

function SubcategoryButton({ label, description, onClick, isAvailable = false }: SubcategoryButtonProps) {
  const [isHovered, setIsHovered] = useState(false);

  const grayColor = '#888';
  const hoverGray = '#aaa';
  const disabledColor = '#555';

  const isDisabled = !isAvailable;

  return (
    <button
      onClick={isDisabled ? undefined : onClick}
      onMouseEnter={() => !isDisabled && setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      disabled={isDisabled}
      style={{
        width: '280px',
        padding: '18px 24px',
        fontSize: '20px',
        fontWeight: 600,
        color: isDisabled ? '#666' : (isHovered ? '#000' : '#fff'),
        backgroundColor: isDisabled ? 'transparent' : (isHovered ? hoverGray : 'transparent'),
        border: `3px solid ${isDisabled ? disabledColor : grayColor}`,
        borderRadius: '8px',
        cursor: isDisabled ? 'not-allowed' : 'pointer',
        transition: 'all 0.2s ease',
        transform: isHovered && !isDisabled ? 'scale(1.05)' : 'scale(1)',
        userSelect: 'none',
        textShadow: isHovered && !isDisabled ? 'none' : '0 2px 4px rgba(0, 0, 0, 0.5)',
        textAlign: 'left',
        opacity: isDisabled ? 0.5 : 1,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        {isAvailable && (
          <span style={{
            backgroundColor: '#4CAF50',
            color: '#fff',
            padding: '2px 6px',
            borderRadius: '4px',
            fontSize: '10px',
            fontWeight: 700,
          }}>
            AKTIV
          </span>
        )}
        <span>{label}</span>
      </div>
      <div style={{
        fontSize: '13px',
        fontWeight: 400,
        color: isDisabled ? '#555' : (isHovered ? '#333' : '#777'),
        marginTop: '4px',
      }}>
        {description}
      </div>
    </button>
  );
}

// Define subcategories for different dungeon types
const subcategoriesMap: Record<string, Array<{ id: string; label: string; description: string; available: boolean }>> = {
  daily: [
    { id: 'mixed', label: 'Gemischte Fragen', description: 'Alle Themen kombiniert', available: true },
  ],
  mathe: [
    { id: 'binomisch', label: 'Binomische Formeln', description: '(a+b)² und mehr', available: false },
    { id: 'gleichungen', label: 'Gleichungen', description: 'Lineare & quadratische', available: false },
    { id: 'geometrie', label: 'Geometrie', description: 'Formen & Flächen', available: false },
    { id: 'brueche', label: 'Bruchrechnung', description: 'Teilen & Kürzen', available: false },
  ],
  physik: [
    { id: 'mechanik', label: 'Mechanik', description: 'Kräfte & Bewegung', available: false },
    { id: 'elektrik', label: 'Elektrizität', description: 'Strom & Spannung', available: false },
    { id: 'optik', label: 'Optik', description: 'Licht & Linsen', available: false },
  ],
  chemie: [
    { id: 'elemente', label: 'Elemente', description: 'Periodensystem', available: false },
    { id: 'reaktionen', label: 'Reaktionen', description: 'Verbindungen', available: false },
  ],
};

function getDungeonTitle(dungeonType: string): string {
  switch (dungeonType) {
    case 'daily': return 'Daily Dungeon';
    case 'mathe': return 'Mathematik';
    case 'physik': return 'Physik';
    case 'chemie': return 'Chemie';
    default: return 'Dungeon';
  }
}

export default function SubcategoryMenu({ dungeonType, onSelectSubcategory, onBack }: SubcategoryMenuProps) {
  const subcategories = subcategoriesMap[dungeonType] || subcategoriesMap.daily;

  return (
    <GameOverlay
      backgroundColor="rgba(0, 0, 0, 0.95)"
      style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        animation: 'menuFadeIn 0.3s ease-out',
      }}
    >
      {/* Title */}
      <div
        style={{
          fontSize: '48px',
          fontWeight: 900,
          color: '#888',
          textShadow: '0 0 20px rgba(136, 136, 136, 0.4), 4px 4px 8px rgba(0, 0, 0, 0.9)',
          marginBottom: '10px',
          userSelect: 'none',
          letterSpacing: '3px',
        }}
      >
        {getDungeonTitle(dungeonType).toUpperCase()}
      </div>

      {/* Subtitle */}
      <div
        style={{
          fontSize: '18px',
          color: '#666',
          marginBottom: '50px',
          userSelect: 'none',
        }}
      >
        Wähle eine Kategorie
      </div>

      {/* Subcategory List */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
          alignItems: 'center',
        }}
      >
        {subcategories.map((sub) => (
          <SubcategoryButton
            key={sub.id}
            label={sub.label}
            description={sub.description}
            onClick={() => onSelectSubcategory(sub.id)}
            isAvailable={sub.available}
          />
        ))}
      </div>

      {/* Back Button */}
      <button
        onClick={onBack}
        style={{
          marginTop: '50px',
          padding: '12px 30px',
          fontSize: '18px',
          fontWeight: 500,
          color: '#777',
          backgroundColor: 'transparent',
          border: '2px solid #777',
          borderRadius: '6px',
          cursor: 'pointer',
          transition: 'all 0.2s ease',
          userSelect: 'none',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.color = '#fff';
          e.currentTarget.style.borderColor = '#fff';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.color = '#777';
          e.currentTarget.style.borderColor = '#777';
        }}
      >
        Zurück
      </button>

      <style jsx>{`
        @keyframes menuFadeIn {
          from {
            opacity: 0;
            transform: translateY(-20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </GameOverlay>
  );
}
