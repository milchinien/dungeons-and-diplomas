interface CombatTimerProps {
  timer: number;
}

export default function CombatTimer({ timer }: CombatTimerProps) {
  return (
    <>
      <style jsx>{`
        @keyframes timerBlink {
          0%, 100% {
            opacity: 1;
            color: #FF4444;
          }
          50% {
            opacity: 0.3;
            color: #FF8888;
          }
        }

        .wood-texture {
          background:
            linear-gradient(180deg, rgba(0,0,0,0.1) 0%, transparent 50%, rgba(0,0,0,0.2) 100%),
            repeating-linear-gradient(90deg, #3d2817 0px, #4a3420 2px, #3d2817 4px),
            linear-gradient(90deg, #4a3420, #3d2817, #4a3420);
        }

        .metal-corner {
          position: absolute;
          width: 20px;
          height: 20px;
          background: radial-gradient(circle, #5a5a5a 0%, #2a2a2a 70%);
          border: 2px solid #1a1a1a;
          box-shadow:
            inset 1px 1px 2px rgba(255,255,255,0.3),
            inset -1px -1px 2px rgba(0,0,0,0.5),
            0 2px 4px rgba(0,0,0,0.5);
        }

        .metal-corner::after {
          content: '';
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 6px;
          height: 6px;
          background: #1a1a1a;
          border-radius: 50%;
          box-shadow: inset 0 1px 2px rgba(0,0,0,0.8);
        }
      `}</style>

      <div className="wood-texture" style={{
        padding: '12px 25px',
        borderRadius: '8px',
        border: '4px solid #2a1810',
        boxShadow: '0 4px 8px rgba(0,0,0,0.6), inset 0 2px 4px rgba(255,255,255,0.1)',
        position: 'relative'
      }}>
        <div style={{
          fontSize: '24px',
          color: timer < 5 ? '#FF4444' : '#FFD700',
          fontWeight: 'bold',
          animation: timer < 5 ? 'timerBlink 0.5s ease-in-out infinite' : 'none',
          textShadow: '2px 2px 4px rgba(0, 0, 0, 0.9)',
          fontFamily: 'monospace'
        }}>
          {timer}s
        </div>
        <div className="metal-corner" style={{ top: '-6px', left: '-6px', borderRadius: '50% 0 0 0' }} />
        <div className="metal-corner" style={{ top: '-6px', right: '-6px', borderRadius: '0 50% 0 0' }} />
        <div className="metal-corner" style={{ bottom: '-6px', left: '-6px', borderRadius: '0 0 0 50%' }} />
        <div className="metal-corner" style={{ bottom: '-6px', right: '-6px', borderRadius: '0 0 50% 0' }} />
      </div>
    </>
  );
}
