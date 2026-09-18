/**
 * Shrine Buff Selection Modal
 *
 * Displays after defeating shrine enemies.
 * Shows 2 random buffs for the player to choose from.
 */
import type { Buff } from '@/lib/constants';

interface ShrineBuffModalProps {
  buffs: Buff[];
  onSelectBuff: (buff: Buff) => void;
}

export default function ShrineBuffModal({ buffs, onSelectBuff }: ShrineBuffModalProps) {
  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100vw',
      height: '100vh',
      backgroundColor: 'rgba(0, 0, 0, 0.85)',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 300,
    }}>
      {/* Title */}
      <h1 style={{
        color: '#ffd700',
        fontSize: '48px',
        fontFamily: 'serif',
        textShadow: '0 0 20px rgba(255, 215, 0, 0.5)',
        marginBottom: '20px',
        letterSpacing: '4px',
      }}>
        SHRINE BLESSING
      </h1>

      <p style={{
        color: '#aaa',
        fontSize: '18px',
        marginBottom: '40px',
      }}>
        Choose a buff
      </p>

      {/* Buff Cards */}
      <div style={{
        display: 'flex',
        gap: '40px',
        justifyContent: 'center',
      }}>
        {buffs.map((buff, index) => (
          <BuffCard
            key={buff.type}
            buff={buff}
            onClick={() => onSelectBuff(buff)}
            delay={index * 0.1}
          />
        ))}
      </div>
    </div>
  );
}

interface BuffCardProps {
  buff: Buff;
  onClick: () => void;
  delay: number;
}

function BuffCard({ buff, onClick, delay }: BuffCardProps) {
  return (
    <button
      onClick={onClick}
      style={{
        background: 'linear-gradient(180deg, #2a2a4a 0%, #1a1a2e 100%)',
        border: '3px solid #4a4a6a',
        borderRadius: '12px',
        padding: '30px 40px',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        animation: `fadeIn 0.5s ease ${delay}s both`,
        minWidth: '280px',
        maxWidth: '320px',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'scale(1.05) translateY(-5px)';
        e.currentTarget.style.borderColor = '#ffd700';
        e.currentTarget.style.boxShadow = '0 10px 30px rgba(255, 215, 0, 0.3)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'scale(1) translateY(0)';
        e.currentTarget.style.borderColor = '#4a4a6a';
        e.currentTarget.style.boxShadow = 'none';
      }}
    >
      {/* Icon */}
      <div style={{
        fontSize: '64px',
        marginBottom: '15px',
        filter: 'drop-shadow(0 0 10px rgba(255, 255, 255, 0.3))',
      }}>
        {buff.icon}
      </div>

      {/* Name */}
      <h2 style={{
        color: '#ffd700',
        fontSize: '24px',
        fontWeight: 'bold',
        marginBottom: '10px',
        textTransform: 'uppercase',
        letterSpacing: '2px',
      }}>
        {buff.name}
      </h2>

      {/* Description */}
      <p style={{
        color: '#ccc',
        fontSize: '16px',
        lineHeight: '1.4',
      }}>
        {buff.description}
      </p>
    </button>
  );
}
