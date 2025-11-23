interface CombatQuestionProps {
  question: string;
  isHidden: boolean;
}

export default function CombatQuestion({ question, isHidden }: CombatQuestionProps) {
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

      <div style={{
        position: 'absolute',
        top: '120px',
        left: '50%',
        transform: 'translateX(-50%)',
        width: '90%',
        maxWidth: '900px',
        zIndex: 20,
        opacity: isHidden ? 0 : 1,
        transition: 'opacity 0.3s ease, transform 0.3s ease',
        pointerEvents: isHidden ? 'none' : 'auto'
      }}>
        {/* Hanging Chains */}
        <div style={{
          position: 'absolute',
          top: '-30px',
          left: '20%',
          width: '3px',
          height: '30px',
          background: 'linear-gradient(180deg, #4a4a4a 0%, #2a2a2a 100%)',
          boxShadow: '1px 0 2px rgba(0,0,0,0.5)'
        }} />
        <div style={{
          position: 'absolute',
          top: '-30px',
          right: '20%',
          width: '3px',
          height: '30px',
          background: 'linear-gradient(180deg, #4a4a4a 0%, #2a2a2a 100%)',
          boxShadow: '1px 0 2px rgba(0,0,0,0.5)'
        }} />

        {/* Question Wood Banner */}
        <div className="wood-texture" style={{
          padding: '35px 45px',
          borderRadius: '12px',
          border: '6px solid #2a1810',
          boxShadow: '0 8px 16px rgba(0,0,0,0.8), inset 0 3px 6px rgba(255,255,255,0.1)',
          position: 'relative'
        }}>
          <div style={{
            fontSize: '32px',
            fontWeight: 'bold',
            color: '#f5deb3',
            textAlign: 'center',
            textShadow: '3px 3px 6px rgba(0, 0, 0, 0.9)',
            fontFamily: 'serif',
            lineHeight: 1.5,
            letterSpacing: '0.5px'
          }}>
            {question}
          </div>

          {/* Wood grain accent line */}
          <div style={{
            position: 'absolute',
            bottom: '15px',
            left: '45px',
            right: '45px',
            height: '3px',
            background: 'linear-gradient(90deg, transparent, #2a1810, transparent)',
            opacity: 0.5
          }} />

          {/* Metal corners */}
          <div className="metal-corner" style={{ top: '-8px', left: '-8px' }} />
          <div className="metal-corner" style={{ top: '-8px', right: '-8px' }} />
          <div className="metal-corner" style={{ bottom: '-8px', left: '-8px' }} />
          <div className="metal-corner" style={{ bottom: '-8px', right: '-8px' }} />
        </div>
      </div>
    </>
  );
}
