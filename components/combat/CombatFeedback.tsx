interface CombatFeedbackProps {
  feedback: string;
}

export default function CombatFeedback({ feedback }: CombatFeedbackProps) {
  if (!feedback) return null;

  const isCorrect = feedback.startsWith('\u2713'); // checkmark

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
        bottom: '50px',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 25
      }}>
        <div className="wood-texture" style={{
          padding: '20px 40px',
          borderRadius: '10px',
          border: '5px solid #2a1810',
          boxShadow: isCorrect
            ? '0 0 30px rgba(76, 175, 80, 0.8), 0 6px 12px rgba(0,0,0,0.7)'
            : '0 0 30px rgba(255, 68, 68, 0.8), 0 6px 12px rgba(0,0,0,0.7)',
          position: 'relative'
        }}>
          <div style={{
            fontSize: '26px',
            fontWeight: 'bold',
            color: isCorrect ? '#4CAF50' : '#FF4444',
            textShadow: '2px 2px 4px rgba(0, 0, 0, 0.9)',
            fontFamily: 'serif',
            textAlign: 'center'
          }}>
            {feedback.split('<br>').map((line, i) => (
              <div key={i} dangerouslySetInnerHTML={{ __html: line }} />
            ))}
          </div>
          <div className="metal-corner" style={{ top: '-7px', left: '-7px' }} />
          <div className="metal-corner" style={{ top: '-7px', right: '-7px' }} />
          <div className="metal-corner" style={{ bottom: '-7px', left: '-7px' }} />
          <div className="metal-corner" style={{ bottom: '-7px', right: '-7px' }} />
        </div>
      </div>
    </>
  );
}
