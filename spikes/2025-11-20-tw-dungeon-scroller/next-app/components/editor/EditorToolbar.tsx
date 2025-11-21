interface EditorToolbarProps {
  zoom: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onSave: () => void;
  dungeonGenerated: boolean;
}

export default function EditorToolbar({
  zoom,
  onZoomIn,
  onZoomOut,
  onSave,
  dungeonGenerated
}: EditorToolbarProps) {
  return (
    <div style={{
      position: 'absolute',
      top: '20px',
      right: '20px',
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      border: '2px solid #4CAF50',
      borderRadius: '8px',
      padding: '15px',
      color: 'white',
      fontFamily: 'Rajdhani, monospace',
      zIndex: 1000,
      display: 'flex',
      flexDirection: 'column',
      gap: '10px'
    }}>
      <div style={{ fontSize: '14px', marginBottom: '5px' }}>
        Zoom: {Math.round(zoom * 100)}%
      </div>

      <button
        onClick={onZoomIn}
        style={{
          padding: '8px',
          backgroundColor: '#4CAF50',
          border: 'none',
          borderRadius: '4px',
          color: 'white',
          cursor: 'pointer',
          fontSize: '14px'
        }}
      >
        Zoom In (+)
      </button>

      <button
        onClick={onZoomOut}
        style={{
          padding: '8px',
          backgroundColor: '#4CAF50',
          border: 'none',
          borderRadius: '4px',
          color: 'white',
          cursor: 'pointer',
          fontSize: '14px'
        }}
      >
        Zoom Out (-)
      </button>

      <button
        onClick={onSave}
        disabled={!dungeonGenerated}
        style={{
          padding: '8px',
          backgroundColor: dungeonGenerated ? '#2196F3' : '#666',
          border: 'none',
          borderRadius: '4px',
          color: 'white',
          cursor: dungeonGenerated ? 'pointer' : 'not-allowed',
          fontSize: '14px',
          marginTop: '10px'
        }}
      >
        Save Level
      </button>

      <div style={{
        fontSize: '12px',
        color: '#888',
        marginTop: '10px',
        borderTop: '1px solid #444',
        paddingTop: '10px'
      }}>
        Controls:<br/>
        WASD / Arrows: Pan<br/>
        Mouse Drag: Pan<br/>
        Mouse Wheel: Zoom
      </div>
    </div>
  );
}
