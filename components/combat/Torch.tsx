'use client';

interface TorchProps {
  left: number;
  top: number;
}

export default function Torch({ left, top }: TorchProps) {
  return (
    <div style={{
      position: 'absolute',
      left: `${left}px`,
      top: `${top}px`,
      width: '40px',
      height: '80px',
      zIndex: 5
    }}>
      {/* Torch Flame */}
      <div style={{
        width: '40px',
        height: '45px',
        background: 'radial-gradient(ellipse at center, #ffff00 0%, #ffcc00 30%, #ff9933 60%, #ff6600 100%)',
        borderRadius: '50% 50% 50% 50% / 60% 60% 40% 40%',
        animation: 'torchFlicker 0.5s ease-in-out infinite',
        position: 'relative',
        top: '-10px',
        boxShadow: '0 0 25px rgba(255, 153, 51, 0.7), 0 0 50px rgba(255, 102, 0, 0.5)',
        filter: 'blur(1px)'
      }}>
        <div style={{
          position: 'absolute',
          top: '7px',
          left: '7px',
          right: '7px',
          bottom: '7px',
          background: 'radial-gradient(ellipse at center, rgba(255, 255, 255, 0.8) 0%, transparent 70%)',
          borderRadius: '50%'
        }} />
      </div>

      {/* Torch Stick */}
      <div style={{
        width: '12px',
        height: '55px',
        backgroundColor: '#8b4513',
        margin: '0 auto',
        borderRadius: '3px'
      }} />

      <style jsx>{`
        @keyframes torchFlicker {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.8; }
        }
      `}</style>
    </div>
  );
}
