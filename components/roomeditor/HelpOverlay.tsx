'use client';

interface HelpOverlayProps {
  onClose: () => void;
}

export default function HelpOverlay({ onClose }: HelpOverlayProps) {
  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        fontFamily: 'Rajdhani, monospace'
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          backgroundColor: '#2a2a2a',
          border: '2px solid #4a9eff',
          borderRadius: '8px',
          padding: '24px',
          maxWidth: '600px',
          width: '90%',
          color: 'white',
          position: 'relative'
        }}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '12px',
            right: '12px',
            backgroundColor: 'transparent',
            border: 'none',
            color: '#999',
            fontSize: '24px',
            cursor: 'pointer',
            padding: '4px 8px',
            transition: 'color 0.15s'
          }}
          onMouseEnter={(e) => { e.currentTarget.style.color = 'white'; }}
          onMouseLeave={(e) => { e.currentTarget.style.color = '#999'; }}
        >
          ×
        </button>

        {/* Title */}
        <h2 style={{
          fontSize: '24px',
          fontWeight: 'bold',
          marginBottom: '20px',
          color: '#4a9eff'
        }}>
          KEYBOARD SHORTCUTS
        </h2>

        {/* Shortcuts Sections */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <ShortcutSection
            title="DRAWING TOOLS"
            shortcuts={[
              { key: 'P', description: 'Pen tool - Draw floor or wall tiles' },
              { key: 'E', description: 'Eraser tool - Remove tiles' },
              { key: 'F', description: 'Fill tool - Flood fill area' },
              { key: 'D', description: 'Door tool - Place door on edges' }
            ]}
          />

          <ShortcutSection
            title="VIEW"
            shortcuts={[
              { key: 'G', description: 'Toggle grid - Show/hide grid lines' }
            ]}
          />

          <ShortcutSection
            title="EDIT"
            shortcuts={[
              { key: 'Ctrl+Z', description: 'Undo - Undo last action' },
              { key: 'Ctrl+Y', description: 'Redo - Redo action' }
            ]}
          />

          <ShortcutSection
            title="OTHER"
            shortcuts={[
              { key: '? / H', description: 'Help - Show this help' },
              { key: 'ESC', description: 'Close - Close dialogs' }
            ]}
          />
        </div>

        {/* Footer */}
        <div style={{
          marginTop: '24px',
          paddingTop: '16px',
          borderTop: '1px solid #444',
          textAlign: 'center',
          fontSize: '12px',
          color: '#888'
        }}>
          Press <strong style={{ color: '#4a9eff' }}>ESC</strong> or click outside to close
        </div>
      </div>
    </div>
  );
}

interface ShortcutSectionProps {
  title: string;
  shortcuts: { key: string; description: string }[];
}

function ShortcutSection({ title, shortcuts }: ShortcutSectionProps) {
  return (
    <div>
      <h3 style={{
        fontSize: '16px',
        fontWeight: 'bold',
        marginBottom: '8px',
        color: '#ddd',
        letterSpacing: '1px'
      }}>
        {title}
      </h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        {shortcuts.map((shortcut, index) => (
          <div
            key={index}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '16px'
            }}
          >
            <kbd style={{
              backgroundColor: '#1a1a1a',
              border: '1px solid #555',
              borderRadius: '4px',
              padding: '4px 10px',
              fontSize: '13px',
              fontWeight: 'bold',
              color: '#4a9eff',
              minWidth: '80px',
              textAlign: 'center'
            }}>
              {shortcut.key}
            </kbd>
            <span style={{
              fontSize: '14px',
              color: '#ccc'
            }}>
              {shortcut.description}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
