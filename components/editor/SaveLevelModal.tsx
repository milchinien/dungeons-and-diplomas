import { useState } from 'react';
import { DUNGEON_ALGORITHM } from '@/lib/constants';
import type { DungeonAlgorithm } from '@/lib/constants';

interface SaveLevelModalProps {
  structureSeed: number;
  decorationSeed: number;
  spawnSeed: number;
  width: number;
  height: number;
  algorithm: DungeonAlgorithm;
  onClose: () => void;
  onSave: (success: boolean, message: string) => void;
}

const ALGORITHM_NAMES: Record<DungeonAlgorithm, string> = {
  [DUNGEON_ALGORITHM.BSP]: 'BSP'
};

export default function SaveLevelModal({
  structureSeed,
  decorationSeed,
  spawnSeed,
  width,
  height,
  algorithm,
  onClose,
  onSave
}: SaveLevelModalProps) {
  const [levelName, setLevelName] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [validationError, setValidationError] = useState('');

  const handleSave = async () => {
    if (!levelName.trim()) {
      setValidationError('Please enter a level name');
      return;
    }
    setValidationError('');

    setSaving(true);

    try {
      const response = await fetch('/api/editor/levels', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: levelName,
          structure_seed: structureSeed,
          decoration_seed: decorationSeed,
          spawn_seed: spawnSeed,
          width: width,
          height: height,
          algorithm: algorithm,
          notes: notes
        })
      });

      if (response.ok) {
        onSave(true, 'Level saved successfully!');
      } else {
        onSave(false, 'Failed to save level');
      }
    } catch (error) {
      console.error('Error saving level:', error);
      onSave(false, 'Error saving level');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100vw',
      height: '100vh',
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 2000
    }}>
      <div style={{
        backgroundColor: '#1a1a1a',
        border: '2px solid #4CAF50',
        borderRadius: '8px',
        padding: '30px',
        minWidth: '400px',
        color: 'white',
        fontFamily: 'Rajdhani, monospace'
      }}>
        <h2 style={{ margin: '0 0 20px 0', fontSize: '24px' }}>Save Level</h2>

        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px' }}>
            Level Name *
          </label>
          <input
            type="text"
            value={levelName}
            onChange={(e) => {
              setLevelName(e.target.value);
              if (validationError) setValidationError('');
            }}
            placeholder="My Awesome Dungeon"
            style={{
              width: '100%',
              padding: '10px',
              backgroundColor: '#2a2a2a',
              border: `1px solid ${validationError ? '#f44336' : '#4CAF50'}`,
              borderRadius: '4px',
              color: 'white',
              fontSize: '14px',
              boxSizing: 'border-box'
            }}
          />
          {validationError && (
            <div style={{ color: '#f44336', fontSize: '12px', marginTop: '5px' }}>
              {validationError}
            </div>
          )}
        </div>

        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px' }}>
            Notes (Optional)
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Description, design notes, etc."
            rows={3}
            style={{
              width: '100%',
              padding: '10px',
              backgroundColor: '#2a2a2a',
              border: '1px solid #4CAF50',
              borderRadius: '4px',
              color: 'white',
              fontSize: '14px',
              resize: 'vertical'
            }}
          />
        </div>

        <div style={{
          padding: '15px',
          backgroundColor: '#2a2a2a',
          borderRadius: '4px',
          marginBottom: '20px',
          fontSize: '13px',
          color: '#aaa'
        }}>
          <div>Structure Seed: {structureSeed}</div>
          <div>Decoration Seed: {decorationSeed}</div>
          <div>Spawn Seed: {spawnSeed}</div>
          <div style={{ marginTop: '10px', borderTop: '1px solid #444', paddingTop: '10px' }}>
            <div>Size: {width} x {height}</div>
            <div>Algorithm: {ALGORITHM_NAMES[algorithm] || `Unknown (${algorithm})`}</div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={handleSave}
            disabled={saving}
            style={{
              flex: 1,
              padding: '12px',
              backgroundColor: saving ? '#666' : '#4CAF50',
              border: 'none',
              borderRadius: '4px',
              color: 'white',
              fontSize: '16px',
              fontWeight: 'bold',
              cursor: saving ? 'not-allowed' : 'pointer'
            }}
          >
            {saving ? 'Saving...' : 'Save'}
          </button>

          <button
            onClick={onClose}
            disabled={saving}
            style={{
              flex: 1,
              padding: '12px',
              backgroundColor: '#666',
              border: 'none',
              borderRadius: '4px',
              color: 'white',
              fontSize: '16px',
              cursor: saving ? 'not-allowed' : 'pointer'
            }}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
