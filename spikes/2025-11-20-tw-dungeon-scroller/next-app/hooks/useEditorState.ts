import { useState, useRef, useEffect, useCallback } from 'react';
import { DungeonManager } from '@/lib/game/DungeonManager';
import { EditorRenderer, EditorCamera } from '@/lib/rendering/EditorRenderer';
import type { Player } from '@/lib/Enemy';
import { DIRECTION, PLAYER_MAX_HP } from '@/lib/constants';

interface UseEditorStateProps {
  availableSubjects: string[];
}

export function useEditorState({ availableSubjects }: UseEditorStateProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Seeds
  const [structureSeed, setStructureSeed] = useState<number>(1);
  const [decorationSeed, setDecorationSeed] = useState<number>(1);
  const [spawnSeed, setSpawnSeed] = useState<number>(1);

  // Camera
  const [camera, setCamera] = useState<EditorCamera>({
    x: 0,
    y: 0,
    zoom: 0.5
  });

  // Grid state
  const [showGrid, setShowGrid] = useState(false);

  // Dungeon state
  const dungeonManagerRef = useRef<DungeonManager | null>(null);
  const editorRendererRef = useRef<EditorRenderer>(new EditorRenderer());
  const [dungeonGenerated, setDungeonGenerated] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  // Fake player for DungeonManager
  const fakePlayerRef = useRef<Player>({
    x: 0,
    y: 0,
    width: 64,
    height: 64,
    direction: DIRECTION.DOWN,
    isMoving: false,
    hp: PLAYER_MAX_HP,
    maxHp: PLAYER_MAX_HP
  });

  // Initialize
  useEffect(() => {
    const init = async () => {
      await editorRendererRef.current.loadTileset();

      const dungeonManager = new DungeonManager(fakePlayerRef.current);
      await dungeonManager.initialize(availableSubjects);
      dungeonManagerRef.current = dungeonManager;

      setIsInitialized(true);
    };

    init();
  }, [availableSubjects]);

  // Generate dungeon with seeds
  const generateDungeon = useCallback(async () => {
    if (!dungeonManagerRef.current || !canvasRef.current) return;

    await dungeonManagerRef.current.generateNewDungeon(
      availableSubjects,
      null, // No user ID needed for editor
      structureSeed,
      decorationSeed,
      spawnSeed
    );

    setDungeonGenerated(true);

    // Center camera on dungeon
    const dungeonWidth = dungeonManagerRef.current.dungeon[0].length;
    const dungeonHeight = dungeonManagerRef.current.dungeon.length;
    const tileSize = dungeonManagerRef.current.tileSize;

    const newCamera = {
      x: (dungeonWidth * tileSize * 0.5) / 2 - canvasRef.current.width / 2,
      y: (dungeonHeight * tileSize * 0.5) / 2 - canvasRef.current.height / 2,
      zoom: 0.5 // Start zoomed out to see more
    };

    setCamera(newCamera);

    // Render after a short delay to ensure state is updated
    setTimeout(() => render(), 50);
  }, [availableSubjects, structureSeed, decorationSeed, spawnSeed]);

  // Render (call this whenever something changes)
  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !dungeonManagerRef.current || !dungeonGenerated) return;

    const manager = dungeonManagerRef.current;

    editorRendererRef.current.render(
      canvas,
      manager.dungeon,
      manager.tileVariants,
      manager.roomMap,
      manager.rooms,
      manager.enemies,
      camera,
      manager.tileSize,
      manager.treasures,
      {
        x: Math.floor(fakePlayerRef.current.x / manager.tileSize),
        y: Math.floor(fakePlayerRef.current.y / manager.tileSize)
      },
      showGrid
    );
  }, [camera, dungeonGenerated, showGrid]);

  // Camera controls
  const zoomIn = useCallback(() => {
    setCamera(prev => {
      const newZoom = Math.min(prev.zoom * 1.2, 4.0);
      return { ...prev, zoom: newZoom };
    });
  }, []);

  const zoomOut = useCallback(() => {
    setCamera(prev => {
      const newZoom = Math.max(prev.zoom / 1.2, 0.1);
      return { ...prev, zoom: newZoom };
    });
  }, []);

  const zoomReset = useCallback(() => {
    setCamera(prev => ({ ...prev, zoom: 1.0 }));
  }, []);

  const pan = useCallback((dx: number, dy: number) => {
    setCamera(prev => ({
      ...prev,
      x: prev.x + dx,
      y: prev.y + dy
    }));
  }, []);

  // Trigger render on camera or showGrid change
  useEffect(() => {
    if (isInitialized && dungeonGenerated) {
      render();
    }
  }, [camera, dungeonGenerated, isInitialized, render, showGrid]);

  return {
    canvasRef,
    structureSeed,
    decorationSeed,
    spawnSeed,
    setStructureSeed,
    setDecorationSeed,
    setSpawnSeed,
    generateDungeon,
    dungeonGenerated,
    camera,
    zoomIn,
    zoomOut,
    zoomReset,
    pan,
    render,
    isInitialized,
    showGrid,
    setShowGrid
  };
}
