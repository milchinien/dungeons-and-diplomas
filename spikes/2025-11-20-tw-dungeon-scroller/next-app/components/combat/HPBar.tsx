'use client';

interface HPBarProps {
  current: number;
  max: number;
  color: string;
  label?: string;
}

export default function HPBar({ current, max, color, label }: HPBarProps) {
  const percentage = Math.max(0, Math.min(100, (current / max) * 100));

  return (
    <div style={{
      width: '240px',
      display: 'flex',
      flexDirection: 'column',
      gap: '6px'
    }}>
      {/* Label */}
      {label && (
        <div style={{
          fontSize: '16px',
          fontWeight: 'bold',
          color: '#d4d4d4',
          textTransform: 'uppercase',
          letterSpacing: '1.5px',
          textShadow: '2px 2px 3px rgba(0, 0, 0, 0.9)'
        }}>
          {label}
        </div>
      )}

      {/* Metal/Iron Frame HP Bar */}
      <div style={{
        width: '100%',
        height: '32px',
        background: 'linear-gradient(180deg, #1a1a1a 0%, #0d0d0d 100%)',
        border: '3px solid',
        borderColor: '#4a4a4a',
        borderRadius: '2px',
        position: 'relative',
        overflow: 'hidden',
        boxShadow: 'inset 0 2px 4px rgba(0, 0, 0, 0.8), 0 2px 4px rgba(0, 0, 0, 0.5)',
        // Metal rivets effect with box-shadow
        outline: '1px solid #2a2a2a',
        outlineOffset: '-6px'
      }}>
        {/* Inner shadow for depth */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '3px',
          background: 'linear-gradient(180deg, rgba(0,0,0,0.6) 0%, transparent 100%)',
          pointerEvents: 'none',
          zIndex: 2
        }} />

        {/* Fill bar with gradient */}
        <div style={{
          height: '100%',
          background: color === '#00ff00'
            ? 'linear-gradient(180deg, #00ff00 0%, #00cc00 50%, #009900 100%)'
            : 'linear-gradient(180deg, #ff0000 0%, #cc0000 50%, #990000 100%)',
          position: 'absolute',
          top: 0,
          left: 0,
          width: `${percentage}%`,
          transition: 'width 0.3s ease-out',
          boxShadow: `inset 0 1px 2px rgba(255, 255, 255, 0.3), 0 0 8px ${color}80`
        }} />

        {/* Shine effect on fill */}
        <div style={{
          position: 'absolute',
          top: '2px',
          left: 0,
          width: `${percentage}%`,
          height: '40%',
          background: 'linear-gradient(180deg, rgba(255,255,255,0.4) 0%, transparent 100%)',
          pointerEvents: 'none'
        }} />

        {/* Text */}
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          fontSize: '16px',
          fontWeight: 'bold',
          color: '#ffffff',
          textShadow: '0 0 4px rgba(0, 0, 0, 1), 2px 2px 3px rgba(0, 0, 0, 0.9)',
          zIndex: 3,
          fontFamily: 'monospace'
        }}>
          {current}/{max}
        </div>

        {/* Metal rivets (decorative dots in corners) */}
        <div style={{
          position: 'absolute',
          top: '2px',
          left: '2px',
          width: '4px',
          height: '4px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, #6a6a6a 0%, #3a3a3a 100%)',
          boxShadow: 'inset 0 1px 1px rgba(255,255,255,0.3)',
          zIndex: 4
        }} />
        <div style={{
          position: 'absolute',
          top: '2px',
          right: '2px',
          width: '4px',
          height: '4px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, #6a6a6a 0%, #3a3a3a 100%)',
          boxShadow: 'inset 0 1px 1px rgba(255,255,255,0.3)',
          zIndex: 4
        }} />
        <div style={{
          position: 'absolute',
          bottom: '2px',
          left: '2px',
          width: '4px',
          height: '4px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, #6a6a6a 0%, #3a3a3a 100%)',
          boxShadow: 'inset 0 1px 1px rgba(255,255,255,0.3)',
          zIndex: 4
        }} />
        <div style={{
          position: 'absolute',
          bottom: '2px',
          right: '2px',
          width: '4px',
          height: '4px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, #6a6a6a 0%, #3a3a3a 100%)',
          boxShadow: 'inset 0 1px 1px rgba(255,255,255,0.3)',
          zIndex: 4
        }} />
      </div>
    </div>
  );
}
