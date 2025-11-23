'use client';

import { useState, useEffect } from 'react';
import { useEditorState } from '@/hooks/useEditorState';
import SeedInputPanel from './editor/SeedInputPanel';
import EditorToolbar from './editor/EditorToolbar';
import SaveLevelModal from './editor/SaveLevelModal';
import LevelBrowserModal from './editor/LevelBrowserModal';
import Toast, { useToast } from './editor/Toast';

interface EditorCanvasProps {
  availableSubjects: string[];
}

export default function EditorCanvas({ availableSubjects }: EditorCanvasProps) {
  const editorState = useEditorState({ availableSubjects });
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [showLoadModal, setShowLoadModal] = useState(false);
  const { messages, showToast, dismissToast } = useToast();

  const canvasRef = editorState.canvasRef;

  // Prevent browser scrolling
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

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

  // Mouse wheel for zooming - use native event listener with passive: false
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();

      if (e.deltaY < 0) {
        editorState.zoomIn();
      } else {
        editorState.zoomOut();
      }
    };

    canvas.addEventListener('wheel', handleWheel, { passive: false });
    return () => canvas.removeEventListener('wheel', handleWheel);
  }, [canvasRef, editorState]);

  // Keyboard controls (WASD for panning)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore keyboard shortcuts if user is typing in an input field
      const target = e.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      ) {
        return;
      }

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


  const handleLoadLevel = (level: any) => {
    editorState.setStructureSeed(level.structure_seed);
    editorState.setDecorationSeed(level.decoration_seed);
    editorState.setSpawnSeed(level.spawn_seed);
    editorState.setDungeonWidth(level.width ?? 100);
    editorState.setDungeonHeight(level.height ?? 100);
    editorState.setAlgorithm(level.algorithm ?? 1);

    // Trigger generation after a short delay to ensure state is updated
    setTimeout(() => {
      editorState.generateDungeon();
    }, 100);
  };

  const handleScreenshot = () => {
    if (!canvasRef.current) return;

    // Create a temporary canvas for the screenshot (without UI overlays)
    const canvas = canvasRef.current;
    const link = document.createElement('a');
    link.download = `dungeon-${Date.now()}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  return (
    <>
      <div style={{ position: 'relative', width: '100vw', height: '100vh', backgroundColor: '#1a1a1a', overflow: 'hidden' }}>
        {/* Seed Input Panel */}
        <SeedInputPanel
          structureSeed={editorState.structureSeed}
          decorationSeed={editorState.decorationSeed}
          spawnSeed={editorState.spawnSeed}
          dungeonWidth={editorState.dungeonWidth}
          dungeonHeight={editorState.dungeonHeight}
          algorithm={editorState.algorithm}
          onStructureSeedChange={editorState.setStructureSeed}
          onDecorationSeedChange={editorState.setDecorationSeed}
          onSpawnSeedChange={editorState.setSpawnSeed}
          onWidthChange={editorState.setDungeonWidth}
          onHeightChange={editorState.setDungeonHeight}
          onAlgorithmChange={editorState.setAlgorithm}
          onGenerate={editorState.generateDungeon}
        />

        {/* Toolbar */}
        <EditorToolbar
          zoom={editorState.camera.zoom}
          onZoomIn={editorState.zoomIn}
          onZoomOut={editorState.zoomOut}
          onZoomReset={editorState.zoomReset}
          onSave={() => setShowSaveModal(true)}
          onLoad={() => setShowLoadModal(true)}
          onScreenshot={handleScreenshot}
          onToggleGrid={() => editorState.setShowGrid(!editorState.showGrid)}
          dungeonGenerated={editorState.dungeonGenerated}
          showGrid={editorState.showGrid}
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
        />

        {/* Save Modal */}
        {showSaveModal && (
          <SaveLevelModal
            structureSeed={editorState.structureSeed}
            decorationSeed={editorState.decorationSeed}
            spawnSeed={editorState.spawnSeed}
            width={editorState.dungeonWidth}
            height={editorState.dungeonHeight}
            algorithm={editorState.algorithm}
            onClose={() => setShowSaveModal(false)}
            onSave={(success, message) => {
              setShowSaveModal(false);
              showToast(message, success ? 'success' : 'error');
            }}
          />
        )}

        {/* Load Modal */}
        {showLoadModal && (
          <LevelBrowserModal
            onClose={() => setShowLoadModal(false)}
            onLoad={handleLoadLevel}
          />
        )}

        {/* Toast Notifications */}
        <Toast messages={messages} onDismiss={dismissToast} />
      </div>
    </>
  );
}
