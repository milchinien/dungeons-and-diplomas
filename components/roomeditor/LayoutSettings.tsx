'use client';

import { useState, useEffect } from 'react';
import type { RoomLayoutInput } from '@/lib/roomlayouts/types';
import type { DrawTool } from './LayoutCanvas';
import { TILE } from '@/lib/constants';
import type { TileType } from '@/lib/constants';

interface LayoutSettingsProps {
  layoutName: string;
  roomType: string;
  difficulty: number;
  tags: string[];
  width: number;
  height: number;
  onSettingsChange: (settings: Partial<RoomLayoutInput>) => void;
  onSave: () => void;
  onReset: () => void;
  canSave: boolean;
  activeTool: DrawTool;
  onToolChange: (tool: DrawTool) => void;
  selectedTile: TileType;
  onTileSelect: (tile: TileType) => void;
}

export default function LayoutSettings({
  layoutName,
  roomType,
  difficulty,
  tags,
  width,
  height,
  onSettingsChange,
  onSave,
  onReset,
  canSave,
  activeTool,
  onToolChange,
  selectedTile,
  onTileSelect
}: LayoutSettingsProps) {
  const [tagInput, setTagInput] = useState('');

  const handleAddTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      onSettingsChange({ tags: [...tags, tagInput.trim()] });
      setTagInput('');
    }
  };

  const handleRemoveTag = (tag: string) => {
    onSettingsChange({ tags: tags.filter(t => t !== tag) });
  };

  return (
    <div style={{
      width: '300px',
      height: '100%',
      backgroundColor: '#2a2a2a',
      color: 'white',
      display: 'flex',
      flexDirection: 'column',
      fontFamily: 'Rajdhani, monospace',
      overflow: 'auto'
    }}>
      {/* Header */}
      <div style={{
        padding: '16px',
        borderBottom: '1px solid #444',
        fontSize: '20px',
        fontWeight: 'bold'
      }}>
        Layout Settings
      </div>

      {/* Drawing Tools */}
      <div style={{
        padding: '12px',
        borderBottom: '1px solid #444'
      }}>
        <div style={{ fontSize: '14px', marginBottom: '8px', fontWeight: 'bold' }}>
          Drawing Tools
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <ToolButton
            active={activeTool === 'pen'}
            onClick={() => onToolChange('pen')}
            label="✏️ Pen"
          />
          <ToolButton
            active={activeTool === 'eraser'}
            onClick={() => onToolChange('eraser')}
            label="🗑️ Eraser"
          />
          <ToolButton
            active={activeTool === 'fill'}
            onClick={() => onToolChange('fill')}
            label="🪣 Fill"
          />
          <ToolButton
            active={activeTool === 'door'}
            onClick={() => onToolChange('door')}
            label="🚪 Door (edges only)"
          />
        </div>
      </div>

      {/* Tile Selection (for pen tool) */}
      {activeTool === 'pen' && (
        <div style={{
          padding: '12px',
          borderBottom: '1px solid #444'
        }}>
          <div style={{ fontSize: '14px', marginBottom: '8px', fontWeight: 'bold' }}>
            Select Tile
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <TileButton
              active={selectedTile === TILE.FLOOR}
              onClick={() => onTileSelect(TILE.FLOOR)}
              label="Floor"
              color="#666"
            />
            <TileButton
              active={selectedTile === TILE.WALL}
              onClick={() => onTileSelect(TILE.WALL)}
              label="Wall"
              color="#333"
            />
          </div>
        </div>
      )}

      {/* Layout Metadata */}
      <div style={{
        padding: '12px',
        borderBottom: '1px solid #444',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px'
      }}>
        <div style={{ fontSize: '14px', fontWeight: 'bold' }}>
          Layout Metadata
        </div>

        <div>
          <label style={{ fontSize: '12px', color: '#aaa', display: 'block', marginBottom: '4px' }}>
            Name
          </label>
          <input
            type="text"
            value={layoutName}
            onChange={(e) => onSettingsChange({ name: e.target.value })}
            style={{
              width: '100%',
              padding: '8px',
              backgroundColor: '#1a1a1a',
              color: 'white',
              border: '1px solid #555',
              borderRadius: '4px',
              fontFamily: 'Rajdhani, monospace'
            }}
            placeholder="Layout name..."
          />
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <div style={{ flex: 1 }}>
            <label style={{ fontSize: '12px', color: '#aaa', display: 'block', marginBottom: '4px' }}>
              Width
            </label>
            <input
              type="number"
              value={width}
              onChange={(e) => {
                const val = parseInt(e.target.value);
                if (val >= 5 && val <= 15) {
                  onSettingsChange({ width: val });
                }
              }}
              min="5"
              max="15"
              style={{
                width: '100%',
                padding: '8px',
                backgroundColor: '#1a1a1a',
                color: 'white',
                border: '1px solid #555',
                borderRadius: '4px',
                fontFamily: 'Rajdhani, monospace'
              }}
            />
          </div>
          <div style={{ flex: 1 }}>
            <label style={{ fontSize: '12px', color: '#aaa', display: 'block', marginBottom: '4px' }}>
              Height
            </label>
            <input
              type="number"
              value={height}
              onChange={(e) => {
                const val = parseInt(e.target.value);
                if (val >= 5 && val <= 15) {
                  onSettingsChange({ height: val });
                }
              }}
              min="5"
              max="15"
              style={{
                width: '100%',
                padding: '8px',
                backgroundColor: '#1a1a1a',
                color: 'white',
                border: '1px solid #555',
                borderRadius: '4px',
                fontFamily: 'Rajdhani, monospace'
              }}
            />
          </div>
        </div>

        <div>
          <label style={{ fontSize: '12px', color: '#aaa', display: 'block', marginBottom: '4px' }}>
            Room Type
          </label>
          <select
            value={roomType}
            onChange={(e) => onSettingsChange({ roomType: e.target.value as any })}
            style={{
              width: '100%',
              padding: '8px',
              backgroundColor: '#1a1a1a',
              color: 'white',
              border: '1px solid #555',
              borderRadius: '4px',
              fontFamily: 'Rajdhani, monospace'
            }}
          >
            <option value="any">Any</option>
            <option value="empty">Empty</option>
            <option value="treasure">Treasure</option>
            <option value="combat">Combat</option>
            <option value="shop">Shop</option>
          </select>
        </div>

        <div>
          <label style={{ fontSize: '12px', color: '#aaa', display: 'block', marginBottom: '4px' }}>
            Difficulty (1-10)
          </label>
          <input
            type="number"
            value={difficulty}
            onChange={(e) => {
              const val = parseInt(e.target.value);
              if (val >= 1 && val <= 10) {
                onSettingsChange({ difficulty: val });
              }
            }}
            min="1"
            max="10"
            style={{
              width: '100%',
              padding: '8px',
              backgroundColor: '#1a1a1a',
              color: 'white',
              border: '1px solid #555',
              borderRadius: '4px',
              fontFamily: 'Rajdhani, monospace'
            }}
          />
        </div>

        <div>
          <label style={{ fontSize: '12px', color: '#aaa', display: 'block', marginBottom: '4px' }}>
            Tags
          </label>
          <div style={{ display: 'flex', gap: '4px', marginBottom: '8px' }}>
            <input
              type="text"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddTag();
                }
              }}
              style={{
                flex: 1,
                padding: '6px',
                backgroundColor: '#1a1a1a',
                color: 'white',
                border: '1px solid #555',
                borderRadius: '4px',
                fontFamily: 'Rajdhani, monospace',
                fontSize: '12px'
              }}
              placeholder="Add tag..."
            />
            <button
              onClick={handleAddTag}
              style={{
                padding: '6px 12px',
                backgroundColor: '#4a9eff',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontFamily: 'Rajdhani, monospace',
                fontSize: '12px'
              }}
            >
              Add
            </button>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
            {tags.map((tag) => (
              <span
                key={tag}
                style={{
                  padding: '4px 8px',
                  backgroundColor: '#444',
                  borderRadius: '4px',
                  fontSize: '11px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                {tag}
                <button
                  onClick={() => handleRemoveTag(tag)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#d44',
                    cursor: 'pointer',
                    padding: 0,
                    fontSize: '14px',
                    lineHeight: 1
                  }}
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div style={{
        padding: '12px',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px'
      }}>
        <button
          onClick={onSave}
          disabled={!canSave}
          style={{
            padding: '12px',
            backgroundColor: canSave ? '#4a9eff' : '#555',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: canSave ? 'pointer' : 'not-allowed',
            fontFamily: 'Rajdhani, monospace',
            fontSize: '16px',
            fontWeight: 'bold'
          }}
        >
          💾 Save Layout
        </button>
        <button
          onClick={onReset}
          style={{
            padding: '10px',
            backgroundColor: '#d44',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontFamily: 'Rajdhani, monospace',
            fontSize: '14px'
          }}
        >
          🗑️ Reset Canvas
        </button>
      </div>
    </div>
  );
}

interface ToolButtonProps {
  active: boolean;
  onClick: () => void;
  label: string;
}

function ToolButton({ active, onClick, label }: ToolButtonProps) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: '10px',
        backgroundColor: active ? '#4a9eff' : '#333',
        color: 'white',
        border: active ? '2px solid #6af' : '1px solid #555',
        borderRadius: '4px',
        cursor: 'pointer',
        fontFamily: 'Rajdhani, monospace',
        fontSize: '14px',
        textAlign: 'left',
        transition: 'all 0.2s'
      }}
      onMouseOver={(e) => {
        if (!active) e.currentTarget.style.backgroundColor = '#3a3a3a';
      }}
      onMouseOut={(e) => {
        if (!active) e.currentTarget.style.backgroundColor = '#333';
      }}
    >
      {label}
    </button>
  );
}

interface TileButtonProps {
  active: boolean;
  onClick: () => void;
  label: string;
  color: string;
}

function TileButton({ active, onClick, label, color }: TileButtonProps) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: '10px',
        backgroundColor: active ? color : '#333',
        color: 'white',
        border: active ? '2px solid #fff' : '1px solid #555',
        borderRadius: '4px',
        cursor: 'pointer',
        fontFamily: 'Rajdhani, monospace',
        fontSize: '14px',
        textAlign: 'left',
        transition: 'all 0.2s'
      }}
      onMouseOver={(e) => {
        if (!active) e.currentTarget.style.backgroundColor = color;
        e.currentTarget.style.opacity = '0.8';
      }}
      onMouseOut={(e) => {
        if (!active) e.currentTarget.style.backgroundColor = '#333';
        e.currentTarget.style.opacity = '1';
      }}
    >
      {label}
    </button>
  );
}
