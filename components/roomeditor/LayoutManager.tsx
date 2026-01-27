'use client';

import { useState, useEffect } from 'react';
import type { RoomLayout } from '@/lib/roomlayouts/types';
import { TILE } from '@/lib/constants';

interface LayoutManagerProps {
  selectedLayoutId: number | null;
  onSelectLayout: (layout: RoomLayout | null) => void;
  onCreateNew: () => void;
  onDeleteLayout: (layoutId: number) => void;
}

export default function LayoutManager({
  selectedLayoutId,
  onSelectLayout,
  onCreateNew,
  onDeleteLayout
}: LayoutManagerProps) {
  const [layouts, setLayouts] = useState<RoomLayout[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({
    roomType: 'all',
    minWidth: '',
    maxWidth: '',
    minHeight: '',
    maxHeight: '',
    difficulty: ''
  });

  // Load layouts from API
  const loadLayouts = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filter.roomType !== 'all') params.append('roomType', filter.roomType);
      if (filter.minWidth) params.append('minWidth', filter.minWidth);
      if (filter.maxWidth) params.append('maxWidth', filter.maxWidth);
      if (filter.minHeight) params.append('minHeight', filter.minHeight);
      if (filter.maxHeight) params.append('maxHeight', filter.maxHeight);
      if (filter.difficulty) params.append('difficulty', filter.difficulty);

      const response = await fetch(`/api/room-layouts?${params.toString()}`);
      if (response.ok) {
        const data = await response.json();
        setLayouts(data);
      }
    } catch (error) {
      console.error('Failed to load layouts:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLayouts();
  }, [filter]);

  const handleDelete = async (layoutId: number) => {
    if (!confirm('Are you sure you want to delete this layout?')) return;

    try {
      const response = await fetch(`/api/room-layouts/${layoutId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        onDeleteLayout(layoutId);
        loadLayouts();
      } else {
        alert('Failed to delete layout');
      }
    } catch (error) {
      console.error('Failed to delete layout:', error);
      alert('Failed to delete layout');
    }
  };

  return (
    <div style={{
      width: '300px',
      height: '100%',
      backgroundColor: '#2a2a2a',
      color: 'white',
      display: 'flex',
      flexDirection: 'column',
      fontFamily: 'Rajdhani, monospace'
    }}>
      {/* Header */}
      <div style={{
        padding: '16px',
        borderBottom: '1px solid #444',
        fontSize: '20px',
        fontWeight: 'bold'
      }}>
        Room Layouts
      </div>

      {/* Filters */}
      <div style={{
        padding: '12px',
        borderBottom: '1px solid #444',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px'
      }}>
        <select
          value={filter.roomType}
          onChange={(e) => setFilter({ ...filter, roomType: e.target.value })}
          style={{
            padding: '6px',
            backgroundColor: '#1a1a1a',
            color: 'white',
            border: '1px solid #555',
            borderRadius: '4px',
            fontFamily: 'Rajdhani, monospace'
          }}
        >
          <option value="all">All Types</option>
          <option value="empty">Empty</option>
          <option value="treasure">Treasure</option>
          <option value="combat">Combat</option>
          <option value="shop">Shop</option>
          <option value="any">Any</option>
        </select>

        <div style={{ display: 'flex', gap: '8px' }}>
          <input
            type="number"
            placeholder="Min W"
            value={filter.minWidth}
            onChange={(e) => setFilter({ ...filter, minWidth: e.target.value })}
            style={{
              flex: 1,
              padding: '6px',
              backgroundColor: '#1a1a1a',
              color: 'white',
              border: '1px solid #555',
              borderRadius: '4px',
              fontFamily: 'Rajdhani, monospace'
            }}
          />
          <input
            type="number"
            placeholder="Max W"
            value={filter.maxWidth}
            onChange={(e) => setFilter({ ...filter, maxWidth: e.target.value })}
            style={{
              flex: 1,
              padding: '6px',
              backgroundColor: '#1a1a1a',
              color: 'white',
              border: '1px solid #555',
              borderRadius: '4px',
              fontFamily: 'Rajdhani, monospace'
            }}
          />
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <input
            type="number"
            placeholder="Min H"
            value={filter.minHeight}
            onChange={(e) => setFilter({ ...filter, minHeight: e.target.value })}
            style={{
              flex: 1,
              padding: '6px',
              backgroundColor: '#1a1a1a',
              color: 'white',
              border: '1px solid #555',
              borderRadius: '4px',
              fontFamily: 'Rajdhani, monospace'
            }}
          />
          <input
            type="number"
            placeholder="Max H"
            value={filter.maxHeight}
            onChange={(e) => setFilter({ ...filter, maxHeight: e.target.value })}
            style={{
              flex: 1,
              padding: '6px',
              backgroundColor: '#1a1a1a',
              color: 'white',
              border: '1px solid #555',
              borderRadius: '4px',
              fontFamily: 'Rajdhani, monospace'
            }}
          />
        </div>

        <input
          type="number"
          placeholder="Difficulty (1-10)"
          value={filter.difficulty}
          onChange={(e) => setFilter({ ...filter, difficulty: e.target.value })}
          min="1"
          max="10"
          style={{
            padding: '6px',
            backgroundColor: '#1a1a1a',
            color: 'white',
            border: '1px solid #555',
            borderRadius: '4px',
            fontFamily: 'Rajdhani, monospace'
          }}
        />
      </div>

      {/* Create New Button */}
      <div style={{ padding: '12px', borderBottom: '1px solid #444' }}>
        <button
          onClick={onCreateNew}
          style={{
            width: '100%',
            padding: '10px',
            backgroundColor: '#4a9eff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontFamily: 'Rajdhani, monospace',
            fontSize: '16px',
            fontWeight: 'bold'
          }}
          onMouseOver={(e) => (e.currentTarget.style.backgroundColor = '#3a8eef')}
          onMouseOut={(e) => (e.currentTarget.style.backgroundColor = '#4a9eff')}
        >
          + Create New Layout
        </button>
      </div>

      {/* Layout List */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '12px',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px'
      }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '20px', color: '#888' }}>
            Loading...
          </div>
        ) : layouts.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '20px', color: '#888' }}>
            No layouts found
          </div>
        ) : (
          layouts.map((layout) => (
            <LayoutThumbnail
              key={layout.id}
              layout={layout}
              isSelected={layout.id === selectedLayoutId}
              onSelect={() => onSelectLayout(layout)}
              onDelete={() => handleDelete(layout.id)}
            />
          ))
        )}
      </div>
    </div>
  );
}

interface LayoutThumbnailProps {
  layout: RoomLayout;
  isSelected: boolean;
  onSelect: () => void;
  onDelete: () => void;
}

function LayoutThumbnail({ layout, isSelected, onSelect, onDelete }: LayoutThumbnailProps) {
  const thumbnailSize = 80;
  const tileSize = Math.min(
    thumbnailSize / layout.width,
    thumbnailSize / layout.height
  );

  return (
    <div
      onClick={onSelect}
      style={{
        padding: '12px',
        backgroundColor: isSelected ? '#3a3a3a' : '#222',
        border: isSelected ? '2px solid #4a9eff' : '1px solid #444',
        borderRadius: '6px',
        cursor: 'pointer',
        transition: 'all 0.2s'
      }}
      onMouseOver={(e) => {
        if (!isSelected) e.currentTarget.style.backgroundColor = '#2a2a2a';
      }}
      onMouseOut={(e) => {
        if (!isSelected) e.currentTarget.style.backgroundColor = '#222';
      }}
    >
      {/* Layout Name */}
      <div style={{
        fontSize: '14px',
        fontWeight: 'bold',
        marginBottom: '8px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <span>{layout.name}</span>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          style={{
            padding: '4px 8px',
            backgroundColor: '#d44',
            color: 'white',
            border: 'none',
            borderRadius: '3px',
            cursor: 'pointer',
            fontSize: '12px'
          }}
          onMouseOver={(e) => (e.currentTarget.style.backgroundColor = '#c33')}
          onMouseOut={(e) => (e.currentTarget.style.backgroundColor = '#d44')}
        >
          Delete
        </button>
      </div>

      {/* Thumbnail Canvas */}
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        marginBottom: '8px'
      }}>
        <svg
          width={thumbnailSize}
          height={thumbnailSize}
          style={{ backgroundColor: '#000', borderRadius: '4px' }}
        >
          {layout.tileGrid.map((row, y) =>
            row.map((tile, x) => {
              let color = '#000';
              if (tile === TILE.FLOOR) color = '#666';
              else if (tile === TILE.WALL) color = '#333';
              else if (tile === TILE.DOOR) color = '#4a9eff';

              return (
                <rect
                  key={`${x}-${y}`}
                  x={x * tileSize}
                  y={y * tileSize}
                  width={tileSize}
                  height={tileSize}
                  fill={color}
                  stroke="#111"
                  strokeWidth="0.5"
                />
              );
            })
          )}
        </svg>
      </div>

      {/* Layout Info */}
      <div style={{
        fontSize: '12px',
        color: '#aaa',
        display: 'flex',
        flexDirection: 'column',
        gap: '4px'
      }}>
        <div>Size: {layout.width}x{layout.height}</div>
        <div>Type: {layout.roomType}</div>
        <div>Difficulty: {layout.difficulty}/10</div>
        <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
          {layout.doorPositions.north && <span style={doorBadgeStyle}>N</span>}
          {layout.doorPositions.south && <span style={doorBadgeStyle}>S</span>}
          {layout.doorPositions.east && <span style={doorBadgeStyle}>E</span>}
          {layout.doorPositions.west && <span style={doorBadgeStyle}>W</span>}
        </div>
      </div>
    </div>
  );
}

const doorBadgeStyle: React.CSSProperties = {
  display: 'inline-block',
  padding: '2px 6px',
  backgroundColor: '#4a9eff',
  borderRadius: '3px',
  fontSize: '10px',
  fontWeight: 'bold'
};
