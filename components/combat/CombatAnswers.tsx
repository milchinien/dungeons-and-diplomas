interface CombatAnswersProps {
  answers: string[];
  onSelectAnswer: (index: number) => void;
  isHidden: boolean;
}

export default function CombatAnswers({ answers, onSelectAnswer, isHidden }: CombatAnswersProps) {
  return (
    <>
      <style jsx>{`
        .wood-texture {
          background:
            linear-gradient(180deg, rgba(0,0,0,0.1) 0%, transparent 50%, rgba(0,0,0,0.2) 100%),
            repeating-linear-gradient(90deg, #3d2817 0px, #4a3420 2px, #3d2817 4px),
            linear-gradient(90deg, #4a3420, #3d2817, #4a3420);
        }

        .metal-corner {
          position: absolute;
          width: 16px;
          height: 16px;
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
          width: 4px;
          height: 4px;
          background: #1a1a1a;
          border-radius: 50%;
          box-shadow: inset 0 1px 2px rgba(0,0,0,0.8);
        }
      `}</style>

      <div style={{
        position: 'absolute',
        top: '320px',
        left: '50%',
        transform: 'translateX(-50%)',
        width: '90%',
        maxWidth: '900px',
        display: 'flex',
        flexDirection: 'column',
        gap: '20px',
        zIndex: 20,
        opacity: isHidden ? 0 : 1,
        transition: 'opacity 0.3s ease',
        pointerEvents: isHidden ? 'none' : 'auto'
      }}>
        {answers.map((answer, index) => (
          <button
            key={index}
            onClick={() => onSelectAnswer(index)}
            className="wood-texture"
            style={{
              padding: '20px 30px',
              borderRadius: '10px',
              border: '5px solid #2a1810',
              boxShadow: '0 6px 12px rgba(0,0,0,0.7), inset 0 2px 4px rgba(255,255,255,0.1)',
              cursor: 'pointer',
              transition: 'all 0.2s',
              position: 'relative',
              textAlign: 'left',
              fontSize: '22px',
              fontWeight: '600',
              color: '#f5deb3',
              textShadow: '2px 2px 4px rgba(0, 0, 0, 0.9)',
              fontFamily: 'serif',
              display: 'flex',
              alignItems: 'center',
              gap: '15px'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-3px)';
              e.currentTarget.style.boxShadow = '0 8px 16px rgba(0,0,0,0.9), inset 0 2px 4px rgba(255,255,255,0.2)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 6px 12px rgba(0,0,0,0.7), inset 0 2px 4px rgba(255,255,255,0.1)';
            }}
          >
            {/* Letter badge */}
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              background: 'radial-gradient(circle, #5a5a5a 0%, #2a2a2a 70%)',
              border: '3px solid #1a1a1a',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '20px',
              fontWeight: 'bold',
              color: '#f5deb3',
              flexShrink: 0,
              boxShadow: 'inset 1px 1px 2px rgba(255,255,255,0.3), 0 2px 4px rgba(0,0,0,0.5)'
            }}>
              {String.fromCharCode(65 + index)}
            </div>

            <span>{answer}</span>

            {/* Metal corners */}
            <div className="metal-corner" style={{ top: '-7px', left: '-7px' }} />
            <div className="metal-corner" style={{ top: '-7px', right: '-7px' }} />
            <div className="metal-corner" style={{ bottom: '-7px', left: '-7px' }} />
            <div className="metal-corner" style={{ bottom: '-7px', right: '-7px' }} />
          </button>
        ))}
      </div>
    </>
  );
}
