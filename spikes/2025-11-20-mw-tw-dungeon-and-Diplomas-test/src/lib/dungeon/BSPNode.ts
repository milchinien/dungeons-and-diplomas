import { MIN_ROOM_SIZE, MAX_ROOM_SIZE, TILE,  } from '../constants';
import type { TileType, Room } from '../constants';

export class BSPNode {
  x: number;
  y: number;
  width: number;
  height: number;
  leftChild: BSPNode | null = null;
  rightChild: BSPNode | null = null;
  splitDirection: 'horizontal' | 'vertical' | null = null;
  splitPosition: number | null = null;
  roomId: number | null = null;

  constructor(x: number, y: number, width: number, height: number) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
  }

  split() {
    // Stop splitting if too small
    if (this.width < MIN_ROOM_SIZE * 2 + 1 || this.height < MIN_ROOM_SIZE * 2 + 1) {
      return;
    }

    // Randomly stop splitting to create varied room sizes
    if (this.width <= MAX_ROOM_SIZE && this.height <= MAX_ROOM_SIZE && Math.random() < 0.25) {
      return;
    }

    // Decide split direction based on dimensions
    let splitHorizontally: boolean;
    if (this.height < MIN_ROOM_SIZE * 2 + 1) {
      splitHorizontally = false;
    } else if (this.width < MIN_ROOM_SIZE * 2 + 1) {
      splitHorizontally = true;
    } else if (this.height > this.width * 1.25) {
      splitHorizontally = true;
    } else if (this.width > this.height * 1.25) {
      splitHorizontally = false;
    } else {
      splitHorizontally = Math.random() > 0.5;
    }

    if (splitHorizontally) {
      const minSplit = MIN_ROOM_SIZE;
      const maxSplit = this.height - MIN_ROOM_SIZE - 1;
      const splitPos = Math.floor(Math.random() * (maxSplit - minSplit) + minSplit);

      this.splitDirection = 'horizontal';
      this.splitPosition = splitPos;

      this.leftChild = new BSPNode(this.x, this.y, this.width, splitPos);
      this.rightChild = new BSPNode(this.x, this.y + splitPos + 1, this.width, this.height - splitPos - 1);
    } else {
      const minSplit = MIN_ROOM_SIZE;
      const maxSplit = this.width - MIN_ROOM_SIZE - 1;
      const splitPos = Math.floor(Math.random() * (maxSplit - minSplit) + minSplit);

      this.splitDirection = 'vertical';
      this.splitPosition = splitPos;

      this.leftChild = new BSPNode(this.x, this.y, splitPos, this.height);
      this.rightChild = new BSPNode(this.x + splitPos + 1, this.y, this.width - splitPos - 1, this.height);
    }

    // Recursively split children
    this.leftChild.split();
    this.rightChild.split();
  }

  fillRooms(dungeon: TileType[][], roomMap: number[][], rooms: Room[]) {
    if (!this.leftChild && !this.rightChild) {
      // Leaf node - create a room and register it
      this.roomId = rooms.length;

      // Assign room type with weighted random selection
      const typeRoll = Math.random() * 10;
      let roomType: 'empty' | 'treasure' | 'combat';
      if (typeRoll < 2) {
        roomType = 'treasure';
      } else if (typeRoll < 3) {
        roomType = 'combat';
      } else {
        roomType = 'empty';
      }

      rooms.push({
        id: this.roomId,
        x: this.x,
        y: this.y,
        width: this.width,
        height: this.height,
        visible: false,
        neighbors: [],
        type: roomType
      });

      // Fill entire partition with floor and mark tiles with room ID
      for (let y = this.y; y < this.y + this.height; y++) {
        for (let x = this.x; x < this.x + this.width; x++) {
          dungeon[y][x] = TILE.FLOOR;
          roomMap[y][x] = this.roomId;
        }
      }
    } else {
      // Not a leaf - fill children and add wall between them
      if (this.leftChild) this.leftChild.fillRooms(dungeon, roomMap, rooms);
      if (this.rightChild) this.rightChild.fillRooms(dungeon, roomMap, rooms);

      // Add wall between children
      if (this.splitDirection === 'horizontal' && this.splitPosition !== null) {
        const wallY = this.y + this.splitPosition;
        for (let x = this.x; x < this.x + this.width; x++) {
          dungeon[wallY][x] = TILE.WALL;
          roomMap[wallY][x] = -1; // -1 for walls
        }
      } else if (this.splitDirection === 'vertical' && this.splitPosition !== null) {
        const wallX = this.x + this.splitPosition;
        for (let y = this.y; y < this.y + this.height; y++) {
          dungeon[y][wallX] = TILE.WALL;
          roomMap[y][wallX] = -1; // -1 for walls
        }
      }
    }
  }
}
