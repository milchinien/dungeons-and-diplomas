import { Floor, Room, RoomType } from '../types/game';

export function generateFloor(level: number): Floor {
  const rooms: Room[] = [];

  // Fixed structure based on Karte.png
  // Row 0: Entrance
  const entrance: Room = {
    id: 'entrance',
    type: RoomType.ENTRANCE,
    position: { x: 0, y: 0 },
    connections: ['combat1'],
    cleared: false,
  };
  rooms.push(entrance);

  // Row 1: First combat
  const combat1: Room = {
    id: 'combat1',
    type: RoomType.COMBAT,
    position: { x: 1, y: 0 },
    connections: ['combat2'],
    cleared: false,
  };
  rooms.push(combat1);

  // Row 2: Second combat (before fork)
  const combat2: Room = {
    id: 'combat2',
    type: RoomType.COMBAT,
    position: { x: 2, y: 0 },
    connections: ['fork'],
    cleared: false,
  };
  rooms.push(combat2);

  // Row 3: Fork point (invisible room)
  const fork: Room = {
    id: 'fork',
    type: RoomType.COMBAT, // Placeholder, this is where path choice happens
    position: { x: 3, y: 0 },
    connections: ['combat3-top', 'combat3-bottom'],
    cleared: false,
  };
  rooms.push(fork);

  // Row 4a: Top path - Combat
  const combat3Top: Room = {
    id: 'combat3-top',
    type: RoomType.COMBAT,
    position: { x: 4, y: -1 },
    connections: ['treasure'],
    cleared: false,
  };
  rooms.push(combat3Top);

  // Row 4b: Bottom path - Combat
  const combat3Bottom: Room = {
    id: 'combat3-bottom',
    type: RoomType.COMBAT,
    position: { x: 4, y: 1 },
    connections: ['boss'],
    cleared: false,
  };
  rooms.push(combat3Bottom);

  // Row 5a: Treasure room (top path)
  const treasure: Room = {
    id: 'treasure',
    type: RoomType.TREASURE,
    position: { x: 5, y: -1 },
    connections: ['shop'],
    cleared: false,
  };
  rooms.push(treasure);

  // Row 5b: Boss room (bottom path)
  const boss: Room = {
    id: 'boss',
    type: RoomType.BOSS,
    position: { x: 5, y: 1 },
    connections: ['shop'],
    cleared: false,
  };
  rooms.push(boss);

  // Row 6: Shop (paths merge)
  const shop: Room = {
    id: 'shop',
    type: RoomType.SHOP,
    position: { x: 6, y: 0 },
    connections: ['exit'],
    cleared: false,
  };
  rooms.push(shop);

  // Row 7: Exit
  const exit: Room = {
    id: 'exit',
    type: RoomType.EXIT,
    position: { x: 7, y: 0 },
    connections: [],
    cleared: false,
  };
  rooms.push(exit);

  return {
    level,
    rooms,
    currentRoomId: 'entrance',
  };
}
