'use client';

import { useState, useEffect } from 'react';
import { useEditorState } from '@/hooks/useEditorState';
import SeedInputPanel from './editor/SeedInputPanel';
import EditorToolbar from './editor/EditorToolbar';
import SaveLevelModal from './editor/SaveLevelModal';

interface EditorCanvasProps {
  availableSubjects: string[];
}

export default function EditorCanvas({ availableSubjects }: EditorCanvasProps) {
  const editorState = useEditorState({ availableSubjects });
  const [showSaveModal, setShowSaveModal] = useState(false);

  const canvasRef = editorState.canvasRef;

  // Mouse drag for panning
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX, y: e.clientY });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;

    const dx = dragStart.x - e.clientX;
    const dy = dragStart.y - e.clientY;

    editorState.pan(dx, dy);
    setDragStart({ x: e.clientX, y: e.clientY });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Mouse wheel for zooming
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();

    if (e.deltaY < 0) {
      editorState.zoomIn();
    } else {
      editorState.zoomOut();
    }
  };

  // Keyboard controls (WASD for panning)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const panSpeed = 50;

      switch (e.key) {
        case 'w':
        case 'W':
        case 'ArrowUp':
          editorState.pan(0, -panSpeed);
          break;
        case 's':
        case 'S':
        case 'ArrowDown':
          editorState.pan(0, panSpeed);
          break;
        case 'a':
        case 'A':
        case 'ArrowLeft':
          editorState.pan(-panSpeed, 0);
          break;
        case 'd':
        case 'D':
        case 'ArrowRight':
          editorState.pan(panSpeed, 0);
          break;
        case '+':
        case '=':
          editorState.zoomIn();
          break;
        case '-':
        case '_':
          editorState.zoomOut();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [editorState]);

  // Canvas resize
  useEffect(() => {
    const handleResize = () => {
      if (canvasRef.current) {
        canvasRef.current.width = window.innerWidth;
        canvasRef.current.height = window.innerHeight;
        editorState.render();
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [canvasRef, editorState]);

  return (
    <>
      <div style={{ position: 'relative', width: '100vw', height: '100vh', backgroundColor: '#1a1a1a' }}>
        {/* Seed Input Panel */}
        <SeedInputPanel
          structureSeed={editorState.structureSeed}
          decorationSeed={editorState.decorationSeed}
          spawnSeed={editorState.spawnSeed}
          onStructureSeedChange={editorState.setStructureSeed}
          onDecorationSeedChange={editorState.setDecorationSeed}
          onSpawnSeedChange={editorState.setSpawnSeed}
          onGenerate={editorState.generateDungeon}
        />

        {/* Toolbar */}
        <EditorToolbar
          zoom={editorState.camera.zoom}
          onZoomIn={editorState.zoomIn}
          onZoomOut={editorState.zoomOut}
          onSave={() => setShowSaveModal(true)}
          dungeonGenerated={editorState.dungeonGenerated}
        />

        {/* Canvas */}
        <canvas
          ref={canvasRef}
          style={{
            display: 'block',
            cursor: isDragging ? 'grabbing' : 'grab',
            imageRendering: 'pixelated'
          }}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onWheel={handleWheel}
        />

        {/* Save Modal */}
        {showSaveModal && (
          <SaveLevelModal
            structureSeed={editorState.structureSeed}
            decorationSeed={editorState.decorationSeed}
            spawnSeed={editorState.spawnSeed}
            onClose={() => setShowSaveModal(false)}
            onSave={() => {
              setShowSaveModal(false);
              // Reload levels list if needed
            }}
          />
        )}
      </div>
    </>
  );
}
