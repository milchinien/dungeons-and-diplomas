'use client';

import { useEffect, useRef, useState } from 'react';
import { SpriteSheetLoader } from '@/lib/SpriteSheetLoader';
import { Enemy } from '@/lib/Enemy';
import type { Player } from '@/lib/Enemy';
import { createEmptyDungeon, generateTileVariants, generateRooms, connectRooms, addWalls } from '@/lib/dungeon/generation';
import type { Question, QuestionDatabase } from '@/lib/questions';
import LoginModal from './LoginModal';
import SkillDashboard from './SkillDashboard';
import {
  DUNGEON_WIDTH,
  DUNGEON_HEIGHT,
  TILE,
  DIRECTION,
  ANIMATION,
  PLAYER_SPEED_TILES,
  PLAYER_SIZE,
  PLAYER_MAX_HP,
  COMBAT_TIME_LIMIT,
  DAMAGE_CORRECT,
  DAMAGE_WRONG,
  TILE_SOURCE_SIZE,
  TILESET_COORDS
} from '@/lib/constants';
import type { TileType, TileVariant, Room, TileCoord } from '@/lib/constants';

export default function GameCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const minimapRef = useRef<HTMLCanvasElement>(null);
  const [gameInitialized, setGameInitialized] = useState(false);
  const [questionDatabase, setQuestionDatabase] = useState<QuestionDatabase | null>(null);

  // User/Auth state
  const [userId, setUserId] = useState<number | null>(null);
  const [username, setUsername] = useState<string | null>(null);
  const [showLogin, setShowLogin] = useState(true);
  const [showSkillDashboard, setShowSkillDashboard] = useState(false);

  // Combat state
  const [inCombat, setInCombat] = useState(false);
  const inCombatRef = useRef(false); // Use ref for immediate updates in game loop
  const [combatSubject, setCombatSubject] = useState('');
  const [combatQuestion, setCombatQuestion] = useState<Question & { shuffledAnswers: string[]; correctIndex: number } | null>(null);
  const [combatTimer, setCombatTimer] = useState(COMBAT_TIME_LIMIT);
  const [combatFeedback, setCombatFeedback] = useState('');
  const [playerHp, setPlayerHp] = useState(PLAYER_MAX_HP);
  const [enemyHp, setEnemyHp] = useState(0);

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
    maxHp: PLAYER_MAX_HP
  });
  const keysRef = useRef({
    ArrowUp: false,
    ArrowDown: false,
    ArrowLeft: false,
    ArrowRight: false,
    w: false,
    s: false,
    a: false,
    d: false
  });
  const playerSpriteRef = useRef<SpriteSheetLoader | null>(null);
  const enemiesRef = useRef<Enemy[]>([]);
  const tilesetImageRef = useRef<HTMLImageElement | null>(null);
  const tileSizeRef = useRef(64);
  const lastTimeRef = useRef(0);
  const currentEnemyRef = useRef<Enemy | null>(null);
  const combatTimerIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const currentSubjectRef = useRef('');
  const gameLoopIdRef = useRef<number | null>(null);
  const isInitializingRef = useRef(false);
  const isMountedRef = useRef(true);
  const questionStartTimeRef = useRef<number>(0);
  const gamePausedRef = useRef(false);

  // Check localStorage for existing user on mount
  useEffect(() => {
    const storedUserId = localStorage.getItem('userId');
    const storedUsername = localStorage.getItem('username');

    if (storedUserId && storedUsername) {
      setUserId(parseInt(storedUserId, 10));
      setUsername(storedUsername);
      setShowLogin(false);
    }
  }, []);

  // Load questions from API
  useEffect(() => {
    const loadQuestions = async () => {
      try {
        const response = await fetch('/api/questions');
        if (!response.ok) {
          throw new Error('Failed to load questions');
        }
        const data = await response.json();
        setQuestionDatabase(data);
      } catch (error) {
        console.error('Error loading questions:', error);
      }
    };

    loadQuestions();
  }, []);

  const handleLogin = (id: number, name: string) => {
    setUserId(id);
    setUsername(name);
    setShowLogin(false);
  };

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    localStorage.removeItem('userId');
    localStorage.removeItem('username');
    setUserId(null);
    setUsername(null);
    setShowLogin(true);
  };

  const handleOpenSkills = () => {
    gamePausedRef.current = true;
    setShowSkillDashboard(true);
  };

  const handleCloseSkills = () => {
    gamePausedRef.current = false;
    setShowSkillDashboard(false);
  };

  useEffect(() => {
    isMountedRef.current = true;

    const initGame = async () => {
      if (!isMountedRef.current || isInitializingRef.current) {
        console.log('Init blocked - mounted:', isMountedRef.current, 'isInitializing:', isInitializingRef.current);
        return;
      }

      // Wait for questions to be loaded before initializing game
      if (!questionDatabase) {
        console.log('Waiting for questions to load...');
        return;
      }

      isInitializingRef.current = true;
      console.log('Init starting...');

      const canvas = canvasRef.current;
      if (!canvas) return;

      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;

      // Load tileset
      const tilesetImage = new Image();
      await new Promise<void>((resolve) => {
        tilesetImage.onload = () => resolve();
        tilesetImage.src = '/Assets/Castle-Dungeon2_Tiles/Tileset.png';
      });
      tilesetImageRef.current = tilesetImage;

      // Load player sprite
      const playerSprite = new SpriteSheetLoader('player');
      await playerSprite.load();
      playerSprite.playAnimation(DIRECTION.DOWN, ANIMATION.IDLE);
      playerSpriteRef.current = playerSprite;

      // Generate dungeon
      await generateNewDungeon();

      if (!isMountedRef.current) {
        console.log('Init stopped after generateNewDungeon - component unmounted');
        return;
      }

      setGameInitialized(true);

      // Start game loop
      gameLoopIdRef.current = requestAnimationFrame(gameLoop);
      console.log('Init completed');
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
      console.log('Cleanup called');
      isMountedRef.current = false;
      // Don't reset isInitializingRef - we want to prevent re-initialization in StrictMode
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      if (combatTimerIntervalRef.current) {
        clearInterval(combatTimerIntervalRef.current);
      }
      if (gameLoopIdRef.current) {
        cancelAnimationFrame(gameLoopIdRef.current);
      }
    };
  }, [questionDatabase]); // Re-run when questions are loaded

  const generateNewDungeon = async () => {
    console.log('===== GENERATE NEW DUNGEON CALLED =====');
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

    console.log('Calling spawnPlayer...');
    // Spawn player
    spawnPlayer();

    console.log('Calling spawnEnemies...');
    // Spawn enemies
    await spawnEnemies();

    // Reset player HP
    playerRef.current.hp = PLAYER_MAX_HP;
    setPlayerHp(PLAYER_MAX_HP);
    console.log('===== GENERATE NEW DUNGEON FINISHED =====');
  };

  const spawnPlayer = () => {
    console.log('===== SPAWN PLAYER CALLED =====');
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
      console.log(`Player spawned at tile (${spawnPoint.x}, ${spawnPoint.y}), room ID: ${roomId}`);
      if (roomId >= 0 && roomsRef.current[roomId]) {
        roomsRef.current[roomId].visible = true;
        console.log(`Room ${roomId} set to visible`);
      }
    }
    console.log('===== SPAWN PLAYER FINISHED =====');
  };

  const spawnEnemies = async () => {
    console.log('===== SPAWN ENEMIES CALLED =====');
    console.log('Current enemies before clear:', enemiesRef.current.length);
    enemiesRef.current = [];

    // Get player's current room - NOTE: roomMap is [y][x] format!
    const playerTileX = Math.floor((playerRef.current.x + tileSizeRef.current / 2) / tileSizeRef.current);
    const playerTileY = Math.floor((playerRef.current.y + tileSizeRef.current / 2) / tileSizeRef.current);

    // Get player's room ID (same as original: roomMap[y][x])
    const playerRoomId = roomMapRef.current[playerTileY]?.[playerTileX] ?? -1;

    console.log('Player position:', playerRef.current.x, playerRef.current.y);
    console.log('Player tile:', playerTileX, playerTileY);
    console.log('Player room ID:', playerRoomId);
    console.log('Total rooms:', roomsRef.current.length);

    let spawnedCount = 0;

    for (let i = 0; i < roomsRef.current.length; i++) {
      // Skip player's starting room
      if (i === playerRoomId) {
        console.log('Skipping room', i, '(player room)');
        continue;
      }

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
        const enemy = new Enemy(
          spawnPos.x * tileSizeRef.current,
          spawnPos.y * tileSizeRef.current,
          'goblin',
          i
        );
        await enemy.load();
        enemiesRef.current.push(enemy);
        spawnedCount++;
        console.log(`Spawned enemy ${spawnedCount} in room ${i} at tile (${spawnPos.x}, ${spawnPos.y})`);
      }
    }

    console.log(`Total enemies spawned: ${spawnedCount}`);
    console.log(`Enemies array length: ${enemiesRef.current.length}`);
    console.log('===== SPAWN ENEMIES FINISHED =====');
  };

  const startCombat = (enemy: Enemy) => {
    if (!questionDatabase) {
      console.error('Question database not loaded yet');
      return;
    }

    setInCombat(true);
    inCombatRef.current = true;
    currentEnemyRef.current = enemy;

    const subjects = Object.keys(questionDatabase);
    const subject = subjects[Math.floor(Math.random() * subjects.length)];
    currentSubjectRef.current = subject;
    setCombatSubject(questionDatabase[subject].subject);

    askQuestion();
  };

  const askQuestion = () => {
    if (!currentEnemyRef.current?.alive || playerRef.current.hp <= 0) {
      endCombat();
      return;
    }

    if (!questionDatabase) {
      console.error('Question database not loaded');
      endCombat();
      return;
    }

    const questionPool = questionDatabase[currentSubjectRef.current].questions;
    const questionData = questionPool[Math.floor(Math.random() * questionPool.length)];

    // Shuffle answers
    const correctAnswerText = questionData.answers[questionData.correct];
    const indices = questionData.answers.map((_, i) => i);
    for (let i = indices.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [indices[i], indices[j]] = [indices[j], indices[i]];
    }

    const shuffledAnswers = indices.map(i => questionData.answers[i]);
    const correctIndex = shuffledAnswers.indexOf(correctAnswerText);

    setCombatQuestion({
      ...questionData,
      shuffledAnswers,
      correctIndex
    });
    setCombatFeedback('');
    setCombatTimer(COMBAT_TIME_LIMIT);
    setEnemyHp(currentEnemyRef.current?.hp ?? 0);

    // Track question start time
    questionStartTimeRef.current = Date.now();

    // Start timer
    if (combatTimerIntervalRef.current) clearInterval(combatTimerIntervalRef.current);
    combatTimerIntervalRef.current = setInterval(() => {
      setCombatTimer(prev => {
        if (prev <= 1) {
          if (combatTimerIntervalRef.current) clearInterval(combatTimerIntervalRef.current);
          answerQuestion(-1);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const answerQuestion = async (selectedIndex: number) => {
    if (combatTimerIntervalRef.current) {
      clearInterval(combatTimerIntervalRef.current);
      combatTimerIntervalRef.current = null;
    }

    if (!combatQuestion || !currentEnemyRef.current) return;

    // Calculate answer time
    const answerTimeMs = Date.now() - questionStartTimeRef.current;
    const isTimeout = selectedIndex === -1;
    const isCorrect = selectedIndex === combatQuestion.correctIndex;

    // Track answer in database
    if (userId && combatQuestion.id) {
      try {
        await fetch('/api/answers', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            user_id: userId,
            question_id: combatQuestion.id,
            selected_answer_index: isTimeout ? -1 : selectedIndex,
            is_correct: isCorrect,
            answer_time_ms: answerTimeMs,
            timeout_occurred: isTimeout
          })
        });
      } catch (error) {
        console.error('Failed to track answer:', error);
        // Continue game even if tracking fails
      }
    }

    if (isCorrect) {
      setCombatFeedback('✓ Richtig!');
      currentEnemyRef.current.takeDamage(DAMAGE_CORRECT);
    } else {
      const correctAnswerText = combatQuestion.shuffledAnswers[combatQuestion.correctIndex];
      setCombatFeedback(
        isTimeout
          ? `✗ Zeit abgelaufen! Richtige Antwort: ${correctAnswerText}`
          : `✗ Falsch! Richtige Antwort: ${correctAnswerText}`
      );
      playerRef.current.hp -= DAMAGE_WRONG;
      if (playerRef.current.hp < 0) playerRef.current.hp = 0;
      setPlayerHp(playerRef.current.hp);
    }

    setEnemyHp(currentEnemyRef.current.hp);

    if (!currentEnemyRef.current.alive || playerRef.current.hp <= 0) {
      setTimeout(() => endCombat(), 1500);
    } else {
      setTimeout(() => askQuestion(), 1500);
    }
  };

  const endCombat = () => {
    if (combatTimerIntervalRef.current) {
      clearInterval(combatTimerIntervalRef.current);
      combatTimerIntervalRef.current = null;
    }

    setInCombat(false);
    inCombatRef.current = false;
    setCombatQuestion(null);
    setCombatFeedback('');

    if (playerRef.current.hp <= 0) {
      setTimeout(() => {
        alert('Du wurdest besiegt! Das Spiel wird neu gestartet.');
        generateNewDungeon();
      }, 500);
    }

    currentEnemyRef.current = null;
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
      { x: right, y: bottom }
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

    playerRef.current.isMoving = (dx !== 0 || dy !== 0);

    if (playerRef.current.isMoving) {
      const length = Math.sqrt(dx * dx + dy * dy);
      const currentSpeed = PLAYER_SPEED_TILES * tileSizeRef.current;
      dx = dx / length * currentSpeed * dt;
      dy = dy / length * currentSpeed * dt;

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
    const endCol = startCol + (canvas.width / tileSizeRef.current) + 1;
    const startRow = Math.floor(camY / tileSizeRef.current);
    const endRow = startRow + (canvas.height / tileSizeRef.current) + 1;

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
            ctx.fillRect(x * tileSizeRef.current, y * tileSizeRef.current, tileSizeRef.current, tileSizeRef.current);
            continue;
          }

          const coords = getTileCoords(x, y, tile);
          if (coords) {
            const srcX = coords.x * TILE_SOURCE_SIZE;
            const srcY = coords.y * TILE_SOURCE_SIZE;

            ctx.drawImage(
              tilesetImageRef.current,
              srcX, srcY, TILE_SOURCE_SIZE, TILE_SOURCE_SIZE,
              x * tileSizeRef.current, y * tileSizeRef.current, tileSizeRef.current, tileSizeRef.current
            );
          }
        } else {
          const wallCoords = TILESET_COORDS.WALL_TOP;
          const srcX = wallCoords.x * TILE_SOURCE_SIZE;
          const srcY = wallCoords.y * TILE_SOURCE_SIZE;

          ctx.drawImage(
            tilesetImageRef.current,
            srcX, srcY, TILE_SOURCE_SIZE, TILE_SOURCE_SIZE,
            x * tileSizeRef.current, y * tileSizeRef.current, tileSizeRef.current, tileSizeRef.current
          );
        }
      }
    }

    for (const enemy of enemiesRef.current) {
      enemy.draw(ctx, roomsRef.current, tileSizeRef.current);
    }

    playerSpriteRef.current?.draw(ctx, playerRef.current.x, playerRef.current.y, tileSizeRef.current, tileSizeRef.current);

    ctx.restore();

    renderMinimap();
  };

  const renderMinimap = () => {
    const minimap = minimapRef.current;
    const minimapCtx = minimap?.getContext('2d');
    if (!minimap || !minimapCtx) return;

    minimapCtx.fillStyle = '#000000';
    minimapCtx.fillRect(0, 0, minimap.width, minimap.height);

    const scaleX = minimap.width / DUNGEON_WIDTH;
    const scaleY = minimap.height / DUNGEON_HEIGHT;
    const scale = Math.min(scaleX, scaleY);

    const offsetX = (minimap.width - DUNGEON_WIDTH * scale) / 2;
    const offsetY = (minimap.height - DUNGEON_HEIGHT * scale) / 2;

    for (let y = 0; y < DUNGEON_HEIGHT; y++) {
      for (let x = 0; x < DUNGEON_WIDTH; x++) {
        const tile = dungeonRef.current[y][x];
        const roomId = roomMapRef.current[y][x];

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

        if (!isVisible) continue;

        if (tile === TILE.FLOOR) {
          if (roomId >= 0 && roomsRef.current[roomId]) {
            const roomType = roomsRef.current[roomId].type;
            if (roomType === 'treasure') {
              minimapCtx.fillStyle = '#FFD700';
            } else if (roomType === 'combat') {
              minimapCtx.fillStyle = '#FF4444';
            } else {
              minimapCtx.fillStyle = '#888888';
            }
          } else {
            minimapCtx.fillStyle = '#888888';
          }
        } else if (tile === TILE.WALL) {
          minimapCtx.fillStyle = '#444444';
        } else if (tile === TILE.DOOR) {
          minimapCtx.fillStyle = '#4CAF50';
        } else {
          continue;
        }

        minimapCtx.fillRect(
          offsetX + x * scale,
          offsetY + y * scale,
          Math.max(1, scale),
          Math.max(1, scale)
        );
      }
    }

    const playerTileX = Math.floor((playerRef.current.x + tileSizeRef.current / 2) / tileSizeRef.current);
    const playerTileY = Math.floor((playerRef.current.y + tileSizeRef.current / 2) / tileSizeRef.current);

    minimapCtx.fillStyle = '#00FFFF';
    minimapCtx.fillRect(
      offsetX + playerTileX * scale - scale,
      offsetY + playerTileY * scale - scale,
      Math.max(2, scale * 3),
      Math.max(2, scale * 3)
    );
  };

  const gameLoop = (timestamp: number) => {
    if (!gamePausedRef.current) {
      const dt = (timestamp - lastTimeRef.current) / 1000;
      lastTimeRef.current = timestamp;

      update(dt);
      render();
    }

    gameLoopIdRef.current = requestAnimationFrame(gameLoop);
  };

  return (
    <>
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Rajdhani:wght@300;400;500;600;700&display=swap');

        body {
          margin: 0;
          padding: 0;
          overflow: hidden;
          background-color: #000000;
          font-family: 'Rajdhani', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', sans-serif;
        }

        * {
          font-family: 'Rajdhani', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', sans-serif;
        }
      `}</style>

      {showLogin && <LoginModal onLogin={handleLogin} />}

      {!questionDatabase && !showLogin && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          backgroundColor: '#000000',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          color: 'white',
          fontSize: '24px',
          zIndex: 9999
        }}>
          Loading questions...
        </div>
      )}

      <div style={{ position: 'relative', width: '100vw', height: '100vh', backgroundColor: '#000000' }}>
        <div style={{ position: 'absolute', top: '10px', left: '10px', zIndex: 100, display: 'flex', gap: '10px', flexDirection: 'column' }}>
          <button
            onClick={() => generateNewDungeon()}
            style={{
              padding: '10px 20px',
              fontSize: '16px',
              backgroundColor: '#4CAF50',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              opacity: 0.8
            }}
            onMouseOver={(e) => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.backgroundColor = '#45a049'; }}
            onMouseOut={(e) => { e.currentTarget.style.opacity = '0.8'; e.currentTarget.style.backgroundColor = '#4CAF50'; }}
          >
            Neuen Dungeon generieren
          </button>
          {username && (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ color: 'white', fontSize: '14px', backgroundColor: 'rgba(0,0,0,0.7)', padding: '5px 10px', borderRadius: '4px' }}>
                  {username}
                </span>
              </div>
              <button
                onClick={handleOpenSkills}
                style={{
                  padding: '8px 20px',
                  fontSize: '14px',
                  backgroundColor: '#2196F3',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  opacity: 0.8
                }}
                onMouseOver={(e) => { e.currentTarget.style.opacity = '1'; }}
                onMouseOut={(e) => { e.currentTarget.style.opacity = '0.8'; }}
              >
                Skills
              </button>
              <button
                onClick={handleLogout}
                style={{
                  padding: '5px 15px',
                  fontSize: '14px',
                  backgroundColor: '#f44336',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  opacity: 0.8
                }}
                onMouseOver={(e) => { e.currentTarget.style.opacity = '1'; }}
                onMouseOut={(e) => { e.currentTarget.style.opacity = '0.8'; }}
              >
                Logout
              </button>
            </>
          )}
        </div>

        <canvas
          ref={canvasRef}
          style={{
            display: 'block',
            imageRendering: 'pixelated'
          } as React.CSSProperties}
        />

        <canvas
          ref={minimapRef}
          width={200}
          height={200}
          style={{
            position: 'absolute',
            top: '10px',
            right: '10px',
            border: '3px solid #4CAF50',
            borderRadius: '4px',
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            zIndex: 100,
            imageRendering: 'pixelated'
          } as React.CSSProperties}
        />

        {inCombat && (
          <div style={{
            display: 'block',
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            background: 'rgba(0, 0, 0, 0.95)',
            border: '4px solid #4CAF50',
            borderRadius: '12px',
            padding: '30px',
            maxWidth: '600px',
            zIndex: 200,
            color: 'white',
            fontFamily: 'Arial, sans-serif'
          }}>
            <h2 style={{ textAlign: 'center', color: '#4CAF50', marginTop: 0 }}>Kampf: {combatSubject}</h2>
            <div style={{ marginBottom: '20px', fontSize: '18px' }}>
              <div>Deine HP: <span style={{ color: '#4CAF50', fontWeight: 'bold' }}>{playerHp}</span>/{PLAYER_MAX_HP}</div>
              <div>Gegner HP: <span style={{ color: '#FF4444', fontWeight: 'bold' }}>{enemyHp}</span>/{currentEnemyRef.current?.maxHp ?? 0}</div>
            </div>
            <div style={{ textAlign: 'center', fontSize: '24px', color: '#FFD700', marginBottom: '20px' }}>
              Zeit: <span>{combatTimer}</span>s
            </div>
            {combatQuestion && (
              <>
                <div style={{ fontSize: '20px', marginBottom: '25px', lineHeight: 1.4 }}>
                  {combatQuestion.question}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {combatQuestion.shuffledAnswers.map((answer, index) => (
                    <button
                      key={index}
                      onClick={() => answerQuestion(index)}
                      style={{
                        padding: '15px',
                        fontSize: '16px',
                        backgroundColor: '#2196F3',
                        color: 'white',
                        border: 'none',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        transition: 'background-color 0.2s'
                      }}
                      onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#1976D2'}
                      onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#2196F3'}
                    >
                      {answer}
                    </button>
                  ))}
                </div>
              </>
            )}
            {combatFeedback && (
              <div style={{
                marginTop: '20px',
                textAlign: 'center',
                fontSize: '18px',
                minHeight: '30px',
                fontWeight: 'bold',
                color: combatFeedback.startsWith('✓') ? '#4CAF50' : '#FF4444'
              }}>
                {combatFeedback.split('<br>').map((line, i) => (
                  <div key={i} dangerouslySetInnerHTML={{ __html: line }} />
                ))}
              </div>
            )}
          </div>
        )}

        {showSkillDashboard && userId && (
          <SkillDashboard userId={userId} onClose={handleCloseSkills} />
        )}
      </div>
    </>
  );
}
