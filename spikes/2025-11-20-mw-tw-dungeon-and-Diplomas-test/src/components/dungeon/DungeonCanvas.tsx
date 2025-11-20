import { useEffect, useRef, useState } from 'react';
import { SpriteSheetLoader } from '../../lib/SpriteSheetLoader';
import { Enemy } from '../../lib/Enemy';
import type { Player } from '../../lib/Enemy';
import {
  createEmptyDungeon,
  generateTileVariants,
  generateRooms,
  connectRooms,
  addWalls,
} from '../../lib/dungeon/generation';
import {
  DUNGEON_WIDTH,
  DUNGEON_HEIGHT,
  TILE,
  DIRECTION,
  ANIMATION,
  PLAYER_SPEED_TILES,
  PLAYER_SIZE,
  PLAYER_MAX_HP,
  TILE_SOURCE_SIZE,
  TILESET_COORDS,
} from '../../lib/constants';
import type { TileType, TileVariant, Room, TileCoord } from '../../lib/constants';
import { CombatScene } from '../combat/CombatScene';
import type { MathQuestion } from '../../types/game';

export function DungeonCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Combat state
  const [inCombat, setInCombat] = useState(false);
  const [playerHp, setPlayerHp] = useState(PLAYER_MAX_HP);
  const currentEnemyRef = useRef<Enemy | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState<MathQuestion>({
    question: '5 + 3',
    correctAnswer: 8,
  });

  // Game state refs
  const dungeonRef = useRef<TileType[][]>([]);
  const tileVariantsRef = useRef<TileVariant[][]>([]);
  const roomsRef = useRef<Room[]>([]);
  const roomMapRef = useRef<number[][]>([]);
  const playerRef = useRef<Player>({
    x: 0,
    y: 0,
    width: 0,
    height: 0,
    direction: DIRECTION.DOWN,
    isMoving: false,
    hp: PLAYER_MAX_HP,
    maxHp: PLAYER_MAX_HP,
  });

  const keysRef = useRef({
    ArrowUp: false,
    ArrowDown: false,
    ArrowLeft: false,
    ArrowRight: false,
    w: false,
    s: false,
    a: false,
    d: false,
  });

  const playerSpriteRef = useRef<SpriteSheetLoader | null>(null);
  const enemiesRef = useRef<Enemy[]>([]);
  const tilesetImageRef = useRef<HTMLImageElement | null>(null);
  const tileSizeRef = useRef(64);
  const lastTimeRef = useRef(0);
  const gameLoopIdRef = useRef<number | null>(null);
  const inCombatRef = useRef(false);

  useEffect(() => {
    const initGame = async () => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;

      // Load tileset
      const tilesetImage = new Image();
      await new Promise<void>((resolve) => {
        tilesetImage.onload = () => resolve();
        tilesetImage.src = '/assets/Castle-Dungeon2_Tiles/Tileset.png';
      });
      tilesetImageRef.current = tilesetImage;

      // Load player sprite
      const playerSprite = new SpriteSheetLoader('player');
      await playerSprite.load();
      playerSprite.playAnimation(DIRECTION.DOWN, ANIMATION.IDLE);
      playerSpriteRef.current = playerSprite;

      // Generate dungeon
      await generateNewDungeon();


      // Start game loop
      gameLoopIdRef.current = requestAnimationFrame(gameLoop);
    };

    initGame();

    // Handle resize
    const handleResize = () => {
      if (canvasRef.current) {
        canvasRef.current.width = window.innerWidth;
        canvasRef.current.height = window.innerHeight;
      }
    };

    // Input handling
    const handleKeyDown = (e: KeyboardEvent) => {
      if (keysRef.current.hasOwnProperty(e.key)) {
        (keysRef.current as any)[e.key] = true;
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (keysRef.current.hasOwnProperty(e.key)) {
        (keysRef.current as any)[e.key] = false;
      }
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      if (gameLoopIdRef.current) {
        cancelAnimationFrame(gameLoopIdRef.current);
      }
    };
  }, []);

  const generateNewDungeon = async () => {
    dungeonRef.current = createEmptyDungeon();
    tileVariantsRef.current = generateTileVariants();

    // Initialize roomMap
    roomMapRef.current = [];
    for (let y = 0; y < DUNGEON_HEIGHT; y++) {
      roomMapRef.current[y] = [];
      for (let x = 0; x < DUNGEON_WIDTH; x++) {
        roomMapRef.current[y][x] = -1;
      }
    }

    roomsRef.current = generateRooms(dungeonRef.current, roomMapRef.current);
    connectRooms(dungeonRef.current, roomMapRef.current, roomsRef.current);
    addWalls(dungeonRef.current);

    // Spawn player
    spawnPlayer();

    // Spawn enemies
    await spawnEnemies();

    // Reset player HP
    playerRef.current.hp = PLAYER_MAX_HP;
  };

  const spawnPlayer = () => {
    const validSpawnPoints: { x: number; y: number }[] = [];

    for (let y = 0; y < DUNGEON_HEIGHT; y++) {
      for (let x = 0; x < DUNGEON_WIDTH; x++) {
        if (dungeonRef.current[y][x] === TILE.FLOOR) {
          validSpawnPoints.push({ x, y });
        }
      }
    }

    if (validSpawnPoints.length > 0) {
      const spawnPoint = validSpawnPoints[Math.floor(Math.random() * validSpawnPoints.length)];
      playerRef.current.x = spawnPoint.x * tileSizeRef.current;
      playerRef.current.y = spawnPoint.y * tileSizeRef.current;

      // Make all rooms invisible first
      for (const room of roomsRef.current) {
        room.visible = false;
      }

      // Then make only the player's starting room visible
      const roomId = roomMapRef.current[spawnPoint.y][spawnPoint.x];
      if (roomId >= 0 && roomsRef.current[roomId]) {
        roomsRef.current[roomId].visible = true;
      }
    }
  };

  const spawnEnemies = async () => {
    enemiesRef.current = [];

    const playerTileX = Math.floor((playerRef.current.x + tileSizeRef.current / 2) / tileSizeRef.current);
    const playerTileY = Math.floor((playerRef.current.y + tileSizeRef.current / 2) / tileSizeRef.current);
    const playerRoomId = roomMapRef.current[playerTileY]?.[playerTileX] ?? -1;

    for (let i = 0; i < roomsRef.current.length; i++) {
      // Skip player's starting room
      if (i === playerRoomId) continue;

      const room = roomsRef.current[i];
      const roomFloorTiles: { x: number; y: number }[] = [];

      for (let y = room.y; y < room.y + room.height; y++) {
        for (let x = room.x; x < room.x + room.width; x++) {
          if (y >= 0 && y < DUNGEON_HEIGHT && x >= 0 && x < DUNGEON_WIDTH) {
            if (dungeonRef.current[y][x] === TILE.FLOOR && roomMapRef.current[y][x] === i) {
              roomFloorTiles.push({ x, y });
            }
          }
        }
      }

      if (roomFloorTiles.length > 0) {
        const spawnPos = roomFloorTiles[Math.floor(Math.random() * roomFloorTiles.length)];
        const enemy = new Enemy(spawnPos.x * tileSizeRef.current, spawnPos.y * tileSizeRef.current, 'goblin', i);
        await enemy.load();
        enemiesRef.current.push(enemy);
      }
    }
  };


  const startCombat = (enemy: Enemy) => {
    currentEnemyRef.current = enemy;
    inCombatRef.current = true;
    setInCombat(true);
  };

  const handlePlayerDamage = (damage: number) => {
    playerRef.current.hp = Math.max(0, playerRef.current.hp - damage);
    setPlayerHp(playerRef.current.hp);
  };

  const handleEnemyDamage = (damage: number) => {
    if (currentEnemyRef.current) {
      currentEnemyRef.current.takeDamage(damage);
    }
  };

  const handleCombatEnd = (victory: boolean) => {
    inCombatRef.current = false;
    setInCombat(false);
    currentEnemyRef.current = null;
    if (!victory) {
      setTimeout(() => generateNewDungeon(), 500);
    }
  };

  const generateNewQuestion = () => {
    const operators = ['+', '-', '*'];
    const operator = operators[Math.floor(Math.random() * operators.length)];
    const num1 = Math.floor(Math.random() * 20) + 1;
    const num2 = Math.floor(Math.random() * 10) + 1;

    let correctAnswer = 0;
    let question = '';

    switch (operator) {
      case '+':
        correctAnswer = num1 + num2;
        question = `${num1} + ${num2}`;
        break;
      case '-':
        correctAnswer = num1 - num2;
        question = `${num1} - ${num2}`;
        break;
      case '*':
        correctAnswer = num1 * num2;
        question = `${num1} × ${num2}`;
        break;
    }

    setCurrentQuestion({ question, correctAnswer });
  };

  const checkCollision = (x: number, y: number): boolean => {
    const playerSize = tileSizeRef.current * PLAYER_SIZE;
    const margin = (tileSizeRef.current - playerSize) / 2;

    const left = x + margin;
    const right = x + tileSizeRef.current - margin;
    const top = y + margin;
    const bottom = y + tileSizeRef.current - margin;

    const points = [
      { x: left, y: top },
      { x: right, y: top },
      { x: left, y: bottom },
      { x: right, y: bottom },
    ];

    for (let p of points) {
      const tileX = Math.floor(p.x / tileSizeRef.current);
      const tileY = Math.floor(p.y / tileSizeRef.current);

      if (tileX < 0 || tileX >= DUNGEON_WIDTH || tileY < 0 || tileY >= DUNGEON_HEIGHT) {
        return true;
      }

      if (dungeonRef.current[tileY][tileX] === TILE.WALL || dungeonRef.current[tileY][tileX] === TILE.EMPTY) {
        return true;
      }
    }
    return false;
  };

  const updateFogOfWar = () => {
    const playerTileX = Math.floor((playerRef.current.x + tileSizeRef.current / 2) / tileSizeRef.current);
    const playerTileY = Math.floor((playerRef.current.y + tileSizeRef.current / 2) / tileSizeRef.current);

    if (playerTileX >= 0 && playerTileX < DUNGEON_WIDTH && playerTileY >= 0 && playerTileY < DUNGEON_HEIGHT) {
      const roomId = roomMapRef.current[playerTileY][playerTileX];
      if (roomId >= 0 && roomsRef.current[roomId] && !roomsRef.current[roomId].visible) {
        roomsRef.current[roomId].visible = true;
      }
    }
  };

  const getTileCoords = (x: number, y: number, tile: TileType): TileCoord | null => {
    if (tile === TILE.EMPTY) {
      return null;
    }

    if (tile === TILE.FLOOR) {
      const roomId = roomMapRef.current[y][x];
      if (roomId >= 0 && roomsRef.current[roomId]) {
        const roomType = roomsRef.current[roomId].type;

        if (roomType === 'treasure') {
          return { x: 18, y: 11 };
        } else if (roomType === 'combat') {
          return { x: 7, y: 12 };
        }
      }

      return tileVariantsRef.current[y][x].floor;
    }

    if (tile === TILE.DOOR) {
      const hasWallLeft = x > 0 && dungeonRef.current[y][x - 1] === TILE.WALL;
      const hasWallRight = x < DUNGEON_WIDTH - 1 && dungeonRef.current[y][x + 1] === TILE.WALL;
      const hasWallAbove = y > 0 && dungeonRef.current[y - 1][x] === TILE.WALL;
      const hasWallBelow = y < DUNGEON_HEIGHT - 1 && dungeonRef.current[y + 1][x] === TILE.WALL;

      if (hasWallLeft || hasWallRight) {
        return TILESET_COORDS.DOOR_VERTICAL;
      } else if (hasWallAbove || hasWallBelow) {
        return TILESET_COORDS.DOOR_HORIZONTAL;
      } else {
        const hasFloorLeft = x > 0 && dungeonRef.current[y][x - 1] === TILE.FLOOR;
        const hasFloorRight = x < DUNGEON_WIDTH - 1 && dungeonRef.current[y][x + 1] === TILE.FLOOR;

        if (hasFloorLeft && hasFloorRight) {
          return TILESET_COORDS.DOOR_HORIZONTAL;
        } else {
          return TILESET_COORDS.DOOR_VERTICAL;
        }
      }
    }

    if (tile === TILE.WALL || tile === TILE.CORNER) {
      return tileVariantsRef.current[y][x].wall;
    }

    return tileVariantsRef.current[y][x].floor;
  };

  const update = (dt: number) => {
    if (isNaN(dt)) dt = 0;
    if (inCombatRef.current) return;

    let dx = 0;
    let dy = 0;

    if (keysRef.current.ArrowUp || keysRef.current.w) dy -= 1;
    if (keysRef.current.ArrowDown || keysRef.current.s) dy += 1;
    if (keysRef.current.ArrowLeft || keysRef.current.a) dx -= 1;
    if (keysRef.current.ArrowRight || keysRef.current.d) dx += 1;

    playerRef.current.isMoving = dx !== 0 || dy !== 0;

    if (playerRef.current.isMoving) {
      const length = Math.sqrt(dx * dx + dy * dy);
      const currentSpeed = PLAYER_SPEED_TILES * tileSizeRef.current;
      dx = (dx / length) * currentSpeed * dt;
      dy = (dy / length) * currentSpeed * dt;

      const newX = playerRef.current.x + dx;
      const newY = playerRef.current.y + dy;

      if (!checkCollision(newX, playerRef.current.y)) {
        playerRef.current.x = newX;
      }
      if (!checkCollision(playerRef.current.x, newY)) {
        playerRef.current.y = newY;
      }

      if (Math.abs(dx) > Math.abs(dy)) {
        playerRef.current.direction = dx > 0 ? DIRECTION.RIGHT : DIRECTION.LEFT;
      } else {
        playerRef.current.direction = dy > 0 ? DIRECTION.DOWN : DIRECTION.UP;
      }

      playerSpriteRef.current?.playAnimation(playerRef.current.direction, ANIMATION.RUN);
      updateFogOfWar();

      const pTileX = Math.floor((playerRef.current.x + tileSizeRef.current / 2) / tileSizeRef.current);
      const pTileY = Math.floor((playerRef.current.y + tileSizeRef.current / 2) / tileSizeRef.current);

      if (pTileX >= 0 && pTileX < DUNGEON_WIDTH && pTileY >= 0 && pTileY < DUNGEON_HEIGHT) {
        if (dungeonRef.current[pTileY][pTileX] === TILE.DOOR) {
          dungeonRef.current[pTileY][pTileX] = TILE.FLOOR;
        }
      }
    } else {
      playerSpriteRef.current?.playAnimation(playerRef.current.direction, ANIMATION.IDLE);
    }

    playerSpriteRef.current?.update(dt);

    for (const enemy of enemiesRef.current) {
      enemy.update(
        dt,
        playerRef.current,
        tileSizeRef.current,
        roomsRef.current,
        dungeonRef.current,
        roomMapRef.current,
        startCombat,
        inCombatRef.current
      );
    }
  };

  const render = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx || !tilesetImageRef.current) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    let camX = playerRef.current.x + tileSizeRef.current / 2 - canvas.width / 2;
    let camY = playerRef.current.y + tileSizeRef.current / 2 - canvas.height / 2;

    ctx.save();
    ctx.translate(-Math.floor(camX), -Math.floor(camY));

    ctx.fillStyle = '#000000';
    ctx.fillRect(Math.floor(camX), Math.floor(camY), canvas.width, canvas.height);

    const startCol = Math.floor(camX / tileSizeRef.current);
    const endCol = startCol + canvas.width / tileSizeRef.current + 1;
    const startRow = Math.floor(camY / tileSizeRef.current);
    const endRow = startRow + canvas.height / tileSizeRef.current + 1;

    for (let y = startRow; y < endRow; y++) {
      for (let x = startCol; x < endCol; x++) {
        if (x >= 0 && x < DUNGEON_WIDTH && y >= 0 && y < DUNGEON_HEIGHT) {
          const tile = dungeonRef.current[y][x];
          const roomId = roomMapRef.current[y][x];

          if (tile === TILE.EMPTY) continue;

          let isVisible = false;

          if (roomId >= 0 && roomsRef.current[roomId]) {
            isVisible = roomsRef.current[roomId].visible;
          } else if (roomId === -1 || roomId === -2) {
            for (let dy = -1; dy <= 1; dy++) {
              for (let dx = -1; dx <= 1; dx++) {
                if (dx === 0 && dy === 0) continue;
                const ny = y + dy;
                const nx = x + dx;
                if (ny >= 0 && ny < DUNGEON_HEIGHT && nx >= 0 && nx < DUNGEON_WIDTH) {
                  const neighborRoomId = roomMapRef.current[ny][nx];
                  if (neighborRoomId >= 0 && roomsRef.current[neighborRoomId]?.visible) {
                    isVisible = true;
                    break;
                  }
                }
              }
              if (isVisible) break;
            }
          }

          if (!isVisible) {
            ctx.fillStyle = '#000000';
            ctx.fillRect(
              x * tileSizeRef.current,
              y * tileSizeRef.current,
              tileSizeRef.current,
              tileSizeRef.current
            );
            continue;
          }

          const coords = getTileCoords(x, y, tile);
          if (coords) {
            const srcX = coords.x * TILE_SOURCE_SIZE;
            const srcY = coords.y * TILE_SOURCE_SIZE;

            ctx.drawImage(
              tilesetImageRef.current,
              srcX,
              srcY,
              TILE_SOURCE_SIZE,
              TILE_SOURCE_SIZE,
              x * tileSizeRef.current,
              y * tileSizeRef.current,
              tileSizeRef.current,
              tileSizeRef.current
            );
          }
        } else {
          const wallCoords = TILESET_COORDS.WALL_TOP;
          const srcX = wallCoords.x * TILE_SOURCE_SIZE;
          const srcY = wallCoords.y * TILE_SOURCE_SIZE;

          ctx.drawImage(
            tilesetImageRef.current,
            srcX,
            srcY,
            TILE_SOURCE_SIZE,
            TILE_SOURCE_SIZE,
            x * tileSizeRef.current,
            y * tileSizeRef.current,
            tileSizeRef.current,
            tileSizeRef.current
          );
        }
      }
    }

    for (const enemy of enemiesRef.current) {
      enemy.draw(ctx, roomsRef.current, tileSizeRef.current);
    }

    playerSpriteRef.current?.draw(
      ctx,
      playerRef.current.x,
      playerRef.current.y,
      tileSizeRef.current,
      tileSizeRef.current
    );

    ctx.restore();
  };

  const gameLoop = (timestamp: number) => {
    const dt = (timestamp - lastTimeRef.current) / 1000;
    lastTimeRef.current = timestamp;

    update(dt);
    render();

    gameLoopIdRef.current = requestAnimationFrame(gameLoop);
  };

  return (
    <>
      <canvas
        ref={canvasRef}
        style={{
          display: 'block',
          imageRendering: 'pixelated',
        }}
      />
      {inCombat && currentEnemyRef.current && (
        <CombatScene
          player={{
            currentHp: playerHp,
            maxHp: PLAYER_MAX_HP,
            gold: 0,
            inventory: [],
          }}
          enemy={{
            id: currentEnemyRef.current.spriteName,
            name: 'Goblin',
            maxHp: currentEnemyRef.current.maxHp,
            currentHp: currentEnemyRef.current.hp,
            damage: 15,
            isBoss: false,
          }}
          question={currentQuestion}
          onPlayerDamage={handlePlayerDamage}
          onEnemyDamage={handleEnemyDamage}
          onCombatEnd={handleCombatEnd}
          onGenerateNewQuestion={generateNewQuestion}
        />
      )}
    </>
  );
}
