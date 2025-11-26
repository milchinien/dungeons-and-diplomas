import { DUNGEON_ALGORITHM } from '@/lib/constants';
import type { DungeonAlgorithm } from '@/lib/constants';

interface SeedInputPanelProps {
  structureSeed: number;
  decorationSeed: number;
  spawnSeed: number;
  dungeonWidth: number;
  dungeonHeight: number;
  algorithm: DungeonAlgorithm;
  onStructureSeedChange: (seed: number) => void;
  onDecorationSeedChange: (seed: number) => void;
  onSpawnSeedChange: (seed: number) => void;
  onWidthChange: (width: number) => void;
  onHeightChange: (height: number) => void;
  onAlgorithmChange: (algorithm: DungeonAlgorithm) => void;
  onGenerate: () => void;
}

const ALGORITHM_NAMES: Record<DungeonAlgorithm, string> = {
  [DUNGEON_ALGORITHM.BSP]: 'BSP (Binary Space Partitioning)'
};

export default function SeedInputPanel({
  structureSeed,
  decorationSeed,
  spawnSeed,
  dungeonWidth,
  dungeonHeight,
  algorithm,
  onStructureSeedChange,
  onDecorationSeedChange,
  onSpawnSeedChange,
  onWidthChange,
  onHeightChange,
  onAlgorithmChange,
  onGenerate
}: SeedInputPanelProps) {
  const generateRandomSeed = () => Math.floor(Math.random() * 1000000);

  const randomizeAll = () => {
    onStructureSeedChange(generateRandomSeed());
    onDecorationSeedChange(generateRandomSeed());
    onSpawnSeedChange(generateRandomSeed());
  };

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
        <div style={{ display: 'flex', gap: '5px' }}>
          <input
            type="number"
            value={structureSeed}
            onChange={(e) => onStructureSeedChange(parseInt(e.target.value, 10) || 0)}
            style={{
              flex: 1,
              padding: '8px',
              backgroundColor: '#2a2a2a',
              border: '1px solid #4CAF50',
              borderRadius: '4px',
              color: 'white',
              fontSize: '14px'
            }}
          />
          <button
            onClick={() => onStructureSeedChange(generateRandomSeed())}
            style={{
              padding: '8px 12px',
              backgroundColor: '#2196F3',
              border: 'none',
              borderRadius: '4px',
              color: 'white',
              fontSize: '12px',
              cursor: 'pointer'
            }}
            title="Random seed"
          >
            🎲
          </button>
        </div>
      </div>

      <div style={{ marginBottom: '10px' }}>
        <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px' }}>
          Decoration Seed
        </label>
        <div style={{ display: 'flex', gap: '5px' }}>
          <input
            type="number"
            value={decorationSeed}
            onChange={(e) => onDecorationSeedChange(parseInt(e.target.value, 10) || 0)}
            style={{
              flex: 1,
              padding: '8px',
              backgroundColor: '#2a2a2a',
              border: '1px solid #4CAF50',
              borderRadius: '4px',
              color: 'white',
              fontSize: '14px'
            }}
          />
          <button
            onClick={() => onDecorationSeedChange(generateRandomSeed())}
            style={{
              padding: '8px 12px',
              backgroundColor: '#2196F3',
              border: 'none',
              borderRadius: '4px',
              color: 'white',
              fontSize: '12px',
              cursor: 'pointer'
            }}
            title="Random seed"
          >
            🎲
          </button>
        </div>
      </div>

      <div style={{ marginBottom: '15px' }}>
        <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px' }}>
          Spawn Seed
        </label>
        <div style={{ display: 'flex', gap: '5px' }}>
          <input
            type="number"
            value={spawnSeed}
            onChange={(e) => onSpawnSeedChange(parseInt(e.target.value, 10) || 0)}
            style={{
              flex: 1,
              padding: '8px',
              backgroundColor: '#2a2a2a',
              border: '1px solid #4CAF50',
              borderRadius: '4px',
              color: 'white',
              fontSize: '14px'
            }}
          />
          <button
            onClick={() => onSpawnSeedChange(generateRandomSeed())}
            style={{
              padding: '8px 12px',
              backgroundColor: '#2196F3',
              border: 'none',
              borderRadius: '4px',
              color: 'white',
              fontSize: '12px',
              cursor: 'pointer'
            }}
            title="Random seed"
          >
            🎲
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '5px', marginBottom: '15px' }}>
        <button
          onClick={randomizeAll}
          style={{
            flex: 1,
            padding: '8px',
            backgroundColor: '#9C27B0',
            border: 'none',
            borderRadius: '4px',
            color: 'white',
            fontSize: '14px',
            cursor: 'pointer'
          }}
        >
          🎲 Randomize All
        </button>
      </div>

      <hr style={{ border: 'none', borderTop: '1px solid #4CAF50', margin: '15px 0' }} />

      <h3 style={{ margin: '0 0 15px 0', fontSize: '18px' }}>Map Size</h3>

      <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
        <div style={{ flex: 1 }}>
          <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px' }}>
            Width
          </label>
          <input
            type="number"
            value={dungeonWidth}
            min={20}
            max={200}
            onChange={(e) => onWidthChange(Math.max(20, Math.min(200, parseInt(e.target.value, 10) || 100)))}
            style={{
              width: '100%',
              padding: '8px',
              backgroundColor: '#2a2a2a',
              border: '1px solid #4CAF50',
              borderRadius: '4px',
              color: 'white',
              fontSize: '14px',
              boxSizing: 'border-box'
            }}
          />
        </div>
        <div style={{ flex: 1 }}>
          <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px' }}>
            Height
          </label>
          <input
            type="number"
            value={dungeonHeight}
            min={20}
            max={200}
            onChange={(e) => onHeightChange(Math.max(20, Math.min(200, parseInt(e.target.value, 10) || 100)))}
            style={{
              width: '100%',
              padding: '8px',
              backgroundColor: '#2a2a2a',
              border: '1px solid #4CAF50',
              borderRadius: '4px',
              color: 'white',
              fontSize: '14px',
              boxSizing: 'border-box'
            }}
          />
        </div>
      </div>

      <div style={{ marginBottom: '15px' }}>
        <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px' }}>
          Algorithm
        </label>
        <select
          value={algorithm}
          onChange={(e) => onAlgorithmChange(parseInt(e.target.value, 10) as DungeonAlgorithm)}
          style={{
            width: '100%',
            padding: '8px',
            backgroundColor: '#2a2a2a',
            border: '1px solid #4CAF50',
            borderRadius: '4px',
            color: 'white',
            fontSize: '14px'
          }}
        >
          {Object.entries(DUNGEON_ALGORITHM).map(([key, value]) => (
            <option key={value} value={value}>
              {ALGORITHM_NAMES[value as DungeonAlgorithm] || key}
            </option>
          ))}
        </select>
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
