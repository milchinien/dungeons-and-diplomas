import { useState, useEffect } from 'react';

interface EditorLevel {
  id: number;
  name: string;
  structure_seed: number;
  decoration_seed: number;
  spawn_seed: number;
  created_at: string;
  notes?: string;
}

interface LevelBrowserModalProps {
  onClose: () => void;
  onLoad: (level: EditorLevel) => void;
}

export default function LevelBrowserModal({ onClose, onLoad }: LevelBrowserModalProps) {
  const [levels, setLevels] = useState<EditorLevel[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLevel, setSelectedLevel] = useState<EditorLevel | null>(null);

  useEffect(() => {
    loadLevels();
  }, []);

  const loadLevels = async () => {
    try {
      const response = await fetch('/api/editor/levels');
      if (response.ok) {
        const data = await response.json();
        setLevels(data);
      }
    } catch (error) {
      console.error('Failed to load levels:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this level?')) {
      return;
    }

    try {
      const response = await fetch(`/api/editor/levels/${id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        setLevels(levels.filter(l => l.id !== id));
        if (selectedLevel?.id === id) {
          setSelectedLevel(null);
        }
      } else {
        alert('Failed to delete level');
      }
    } catch (error) {
      console.error('Error deleting level:', error);
      alert('Error deleting level');
    }
  };

  const handleLoad = () => {
    if (selectedLevel) {
      onLoad(selectedLevel);
      onClose();
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
        minWidth: '600px',
        maxWidth: '800px',
        maxHeight: '80vh',
        color: 'white',
        fontFamily: 'Rajdhani, monospace',
        display: 'flex',
        flexDirection: 'column'
      }}>
        <h2 style={{ margin: '0 0 20px 0', fontSize: '24px' }}>Load Level</h2>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px' }}>Loading...</div>
        ) : levels.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#888' }}>
            No saved levels found. Create and save a level first!
          </div>
        ) : (
          <>
            <div style={{
              flex: 1,
              overflowY: 'auto',
              marginBottom: '20px',
              border: '1px solid #333',
              borderRadius: '4px'
            }}>
              {levels.map(level => (
                <div
                  key={level.id}
                  onClick={() => setSelectedLevel(level)}
                  style={{
                    padding: '15px',
                    borderBottom: '1px solid #333',
                    cursor: 'pointer',
                    backgroundColor: selectedLevel?.id === level.id ? '#2a2a2a' : 'transparent',
                    transition: 'background-color 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    if (selectedLevel?.id !== level.id) {
                      e.currentTarget.style.backgroundColor = '#1f1f1f';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (selectedLevel?.id !== level.id) {
                      e.currentTarget.style.backgroundColor = 'transparent';
                    }
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '5px' }}>
                        {level.name}
                      </div>
                      <div style={{ fontSize: '12px', color: '#888' }}>
                        Created: {new Date(level.created_at).toLocaleDateString()}
                      </div>
                      {level.notes && (
                        <div style={{ fontSize: '12px', color: '#aaa', marginTop: '5px' }}>
                          {level.notes}
                        </div>
                      )}
                      <div style={{ fontSize: '11px', color: '#666', marginTop: '5px' }}>
                        Seeds: {level.structure_seed} / {level.decoration_seed} / {level.spawn_seed}
                      </div>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(level.id);
                      }}
                      style={{
                        padding: '5px 10px',
                        backgroundColor: '#f44336',
                        border: 'none',
                        borderRadius: '4px',
                        color: 'white',
                        fontSize: '12px',
                        cursor: 'pointer',
                        marginLeft: '10px'
                      }}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {selectedLevel && (
              <div style={{
                padding: '15px',
                backgroundColor: '#2a2a2a',
                borderRadius: '4px',
                marginBottom: '20px'
              }}>
                <div style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '10px' }}>
                  Selected: {selectedLevel.name}
                </div>
                <div style={{ fontSize: '12px', color: '#aaa' }}>
                  <div>Structure Seed: {selectedLevel.structure_seed}</div>
                  <div>Decoration Seed: {selectedLevel.decoration_seed}</div>
                  <div>Spawn Seed: {selectedLevel.spawn_seed}</div>
                </div>
              </div>
            )}
          </>
        )}

        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={handleLoad}
            disabled={!selectedLevel}
            style={{
              flex: 1,
              padding: '12px',
              backgroundColor: selectedLevel ? '#4CAF50' : '#666',
              border: 'none',
              borderRadius: '4px',
              color: 'white',
              fontSize: '16px',
              fontWeight: 'bold',
              cursor: selectedLevel ? 'pointer' : 'not-allowed'
            }}
          >
            Load Level
          </button>

          <button
            onClick={onClose}
            style={{
              flex: 1,
              padding: '12px',
              backgroundColor: '#666',
              border: 'none',
              borderRadius: '4px',
              color: 'white',
              fontSize: '16px',
              cursor: 'pointer'
            }}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
