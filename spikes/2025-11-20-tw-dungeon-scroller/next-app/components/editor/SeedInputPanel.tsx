interface SeedInputPanelProps {
  structureSeed: number;
  decorationSeed: number;
  spawnSeed: number;
  onStructureSeedChange: (seed: number) => void;
  onDecorationSeedChange: (seed: number) => void;
  onSpawnSeedChange: (seed: number) => void;
  onGenerate: () => void;
}

export default function SeedInputPanel({
  structureSeed,
  decorationSeed,
  spawnSeed,
  onStructureSeedChange,
  onDecorationSeedChange,
  onSpawnSeedChange,
  onGenerate
}: SeedInputPanelProps) {
  return (
    <div style={{
      position: 'absolute',
      top: '20px',
      left: '20px',
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      border: '2px solid #4CAF50',
      borderRadius: '8px',
      padding: '20px',
      color: 'white',
      fontFamily: 'Rajdhani, monospace',
      zIndex: 1000,
      minWidth: '300px'
    }}>
      <h3 style={{ margin: '0 0 15px 0', fontSize: '18px' }}>Dungeon Seeds</h3>

      <div style={{ marginBottom: '10px' }}>
        <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px' }}>
          Structure Seed
        </label>
        <input
          type="number"
          value={structureSeed}
          onChange={(e) => onStructureSeedChange(parseInt(e.target.value, 10) || 0)}
          style={{
            width: '100%',
            padding: '8px',
            backgroundColor: '#2a2a2a',
            border: '1px solid #4CAF50',
            borderRadius: '4px',
            color: 'white',
            fontSize: '14px'
          }}
        />
      </div>

      <div style={{ marginBottom: '10px' }}>
        <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px' }}>
          Decoration Seed
        </label>
        <input
          type="number"
          value={decorationSeed}
          onChange={(e) => onDecorationSeedChange(parseInt(e.target.value, 10) || 0)}
          style={{
            width: '100%',
            padding: '8px',
            backgroundColor: '#2a2a2a',
            border: '1px solid #4CAF50',
            borderRadius: '4px',
            color: 'white',
            fontSize: '14px'
          }}
        />
      </div>

      <div style={{ marginBottom: '15px' }}>
        <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px' }}>
          Spawn Seed
        </label>
        <input
          type="number"
          value={spawnSeed}
          onChange={(e) => onSpawnSeedChange(parseInt(e.target.value, 10) || 0)}
          style={{
            width: '100%',
            padding: '8px',
            backgroundColor: '#2a2a2a',
            border: '1px solid #4CAF50',
            borderRadius: '4px',
            color: 'white',
            fontSize: '14px'
          }}
        />
      </div>

      <button
        onClick={onGenerate}
        style={{
          width: '100%',
          padding: '10px',
          backgroundColor: '#4CAF50',
          border: 'none',
          borderRadius: '4px',
          color: 'white',
          fontSize: '16px',
          fontWeight: 'bold',
          cursor: 'pointer'
        }}
        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#45a049'}
        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#4CAF50'}
      >
        Generate Dungeon
      </button>
    </div>
  );
}
