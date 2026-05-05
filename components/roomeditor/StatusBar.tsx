'use client';

import type { DrawTool } from './LayoutCanvas';

interface StatusBarProps {
  cursorX: number | null;
  cursorY: number | null;
  activeTool: DrawTool;
  canvasWidth: number;
  canvasHeight: number;
  validationState: { isValid: boolean; errors: string[] };
  gridVisible: boolean;
}

const TOOL_DESCRIPTIONS: Record<DrawTool, string> = {
  pen: 'Draw floor or wall tiles',
  eraser: 'Remove tiles',
  fill: 'Flood fill area',
  door: 'Place door on edges'
};

export default function StatusBar({
  cursorX,
  cursorY,
  activeTool,
  canvasWidth,
  canvasHeight,
  validationState,
  gridVisible
}: StatusBarProps) {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      padding: '0 16px',
      height: '40px',
      backgroundColor: '#222',
      borderTop: '1px solid #333',
      fontFamily: 'Rajdhani, monospace',
      fontSize: '13px',
      color: '#ccc',
      gap: '16px',
      flexShrink: 0
    }}>
      {/* Cursor Position */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        <span style={{ color: '#4a9eff' }}>🎯</span>
        <span>
          Cursor: {cursorX !== null && cursorY !== null ? `(${cursorX}, ${cursorY})` : '(--, --)'}
        </span>
      </div>

      <div style={{ width: '1px', height: '20px', backgroundColor: '#444' }} />

      {/* Active Tool */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        <span style={{ color: '#4a9eff' }}>🔧</span>
        <span>
          Tool: <strong style={{ color: 'white' }}>{activeTool.charAt(0).toUpperCase() + activeTool.slice(1)}</strong>
          {' - '}{TOOL_DESCRIPTIONS[activeTool]}
        </span>
      </div>

      <div style={{ width: '1px', height: '20px', backgroundColor: '#444' }} />

      {/* Canvas Size */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        <span style={{ color: '#4a9eff' }}>📐</span>
        <span>
          Size: {canvasWidth}×{canvasHeight} | Grid: <strong style={{ color: gridVisible ? '#4ade80' : '#999' }}>{gridVisible ? 'ON' : 'OFF'}</strong>
        </span>
      </div>

      <div style={{ width: '1px', height: '20px', backgroundColor: '#444' }} />

      {/* Validation Status */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        {validationState.isValid ? (
          <>
            <span style={{ color: '#4ade80' }}>✓</span>
            <span style={{ color: '#4ade80' }}>Valid</span>
          </>
        ) : (
          <>
            <span style={{ color: '#fbbf24' }}>⚠</span>
            <span style={{ color: '#fbbf24' }}>
              {validationState.errors.length} error{validationState.errors.length !== 1 ? 's' : ''}
            </span>
          </>
        )}
      </div>
    </div>
  );
}
