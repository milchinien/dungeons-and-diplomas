'use client';

import type { DrawTool } from './LayoutCanvas';

interface ToolBarProps {
  activeTool: DrawTool;
  onToolChange: (tool: DrawTool) => void;
  onGridToggle: () => void;
  onHelpToggle: () => void;
  onUndo: () => void;
  onRedo: () => void;
  onSave: () => void;
  onReset: () => void;
  canUndo: boolean;
  canRedo: boolean;
  canSave: boolean;
  gridVisible: boolean;
}

export default function ToolBar({
  activeTool,
  onToolChange,
  onGridToggle,
  onHelpToggle,
  onUndo,
  onRedo,
  onSave,
  onReset,
  canUndo,
  canRedo,
  canSave,
  gridVisible
}: ToolBarProps) {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      padding: '10px 16px',
      backgroundColor: '#222',
      borderBottom: '1px solid #333',
      gap: '16px',
      flexShrink: 0,
      fontFamily: 'Rajdhani, monospace'
    }}>
      {/* Tools Section */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px'
      }}>
        <span style={{ fontSize: '14px', color: '#aaa', marginRight: '4px' }}>Tools:</span>
        <ToolButton
          active={activeTool === 'pen'}
          onClick={() => onToolChange('pen')}
          icon="✏️"
          label="P"
          tooltip="Pen tool (P)"
        />
        <ToolButton
          active={activeTool === 'eraser'}
          onClick={() => onToolChange('eraser')}
          icon="🗑️"
          label="E"
          tooltip="Eraser tool (E)"
        />
        <ToolButton
          active={activeTool === 'fill'}
          onClick={() => onToolChange('fill')}
          icon="🪣"
          label="F"
          tooltip="Fill tool (F)"
        />
        <ToolButton
          active={activeTool === 'door'}
          onClick={() => onToolChange('door')}
          icon="🚪"
          label="D"
          tooltip="Door tool (D)"
        />
      </div>

      <div style={{ width: '1px', height: '30px', backgroundColor: '#444' }} />

      {/* View Section */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px'
      }}>
        <ToolButton
          active={gridVisible}
          onClick={onGridToggle}
          icon={gridVisible ? '🔲' : '⬜'}
          label="G"
          tooltip={`Grid: ${gridVisible ? 'ON' : 'OFF'} (G)`}
        />
        <ToolButton
          active={false}
          onClick={onHelpToggle}
          icon="?"
          label="Help"
          tooltip="Help (? or H)"
        />
      </div>

      <div style={{ width: '1px', height: '30px', backgroundColor: '#444' }} />

      {/* Edit Section */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px'
      }}>
        <ActionButton
          onClick={onUndo}
          disabled={!canUndo}
          icon="↩"
          label="Undo"
          tooltip="Undo (Ctrl+Z)"
        />
        <ActionButton
          onClick={onRedo}
          disabled={!canRedo}
          icon="↪"
          label="Redo"
          tooltip="Redo (Ctrl+Y)"
        />
      </div>

      <div style={{ width: '1px', height: '30px', backgroundColor: '#444' }} />

      {/* Actions Section */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px'
      }}>
        <ActionButton
          onClick={onSave}
          disabled={!canSave}
          icon="💾"
          label="Save"
          tooltip="Save layout"
          primary
        />
        <ActionButton
          onClick={onReset}
          disabled={false}
          icon="🗑️"
          label="Reset"
          tooltip="Reset canvas"
          danger
        />
      </div>
    </div>
  );
}

interface ToolButtonProps {
  active: boolean;
  onClick: () => void;
  icon: string;
  label: string;
  tooltip: string;
}

function ToolButton({ active, onClick, icon, label, tooltip }: ToolButtonProps) {
  return (
    <button
      onClick={onClick}
      title={tooltip}
      style={{
        padding: '8px 12px',
        backgroundColor: active ? 'rgba(74, 158, 255, 0.13)' : '#333',
        color: 'white',
        border: active ? '2px solid #4a9eff' : '1px solid #555',
        borderRadius: '6px',
        cursor: 'pointer',
        fontFamily: 'Rajdhani, monospace',
        fontSize: '14px',
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        transition: 'all 0.15s ease-in-out',
        minWidth: '60px',
        justifyContent: 'center'
      }}
      onMouseEnter={(e) => {
        if (!active) {
          e.currentTarget.style.backgroundColor = '#3a3a3a';
        }
        e.currentTarget.style.transform = 'scale(1.05)';
      }}
      onMouseLeave={(e) => {
        if (!active) {
          e.currentTarget.style.backgroundColor = '#333';
        }
        e.currentTarget.style.transform = 'scale(1)';
      }}
      onMouseDown={(e) => {
        e.currentTarget.style.transform = 'scale(0.98)';
      }}
      onMouseUp={(e) => {
        e.currentTarget.style.transform = 'scale(1.05)';
      }}
    >
      <span>{icon}</span>
      <span style={{ fontSize: '12px', fontWeight: 'bold' }}>{label}</span>
    </button>
  );
}

interface ActionButtonProps {
  onClick: () => void;
  disabled: boolean;
  icon: string;
  label: string;
  tooltip: string;
  primary?: boolean;
  danger?: boolean;
}

function ActionButton({ onClick, disabled, icon, label, tooltip, primary, danger }: ActionButtonProps) {
  const getBackgroundColor = () => {
    if (disabled) return '#222';
    if (primary) return '#4a9eff';
    if (danger) return '#d44';
    return '#444';
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={tooltip}
      style={{
        padding: '8px 12px',
        backgroundColor: getBackgroundColor(),
        color: disabled ? '#666' : 'white',
        border: '1px solid #555',
        borderRadius: '6px',
        cursor: disabled ? 'not-allowed' : 'pointer',
        fontFamily: 'Rajdhani, monospace',
        fontSize: '14px',
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        transition: 'all 0.15s ease-in-out'
      }}
      onMouseEnter={(e) => {
        if (!disabled) {
          e.currentTarget.style.transform = 'scale(1.05)';
          if (primary) e.currentTarget.style.backgroundColor = '#3a8eef';
          else if (danger) e.currentTarget.style.backgroundColor = '#c33';
          else e.currentTarget.style.backgroundColor = '#555';
        }
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'scale(1)';
        if (!disabled) {
          e.currentTarget.style.backgroundColor = getBackgroundColor();
        }
      }}
      onMouseDown={(e) => {
        if (!disabled) {
          e.currentTarget.style.transform = 'scale(0.98)';
        }
      }}
      onMouseUp={(e) => {
        if (!disabled) {
          e.currentTarget.style.transform = 'scale(1.05)';
        }
      }}
    >
      <span>{icon}</span>
      <span style={{ fontSize: '13px', fontWeight: 'bold' }}>{label}</span>
    </button>
  );
}
