import { create } from 'zustand';
import {
  GameState,
  GameScene,
  CombatState,
  Player,
  Floor,
  Enemy,
  MathQuestion,
  Item,
} from '../types/game';
import { applyItemEffect, canUseItem } from '../utils/itemEffects';

interface GameStore extends GameState {
  // Actions
  setScene: (scene: GameScene) => void;
  moveToRoom: (roomId: string) => void;
  enterRoom: (roomId: string) => void;
  setCurrentQuestion: (question: MathQuestion | null) => void;
  answerQuestion: (answer: number) => void;
  damageEnemy: (damage: number) => void;
  damagePlayer: (damage: number) => void;
  collectLoot: (gold: number, items: Item[]) => void;
  buyItem: (item: Item) => void;
  useItem: (item: Item) => void;
  nextFloor: (floor: Floor) => void;
  resetGame: () => void;
  setCombatState: (state: CombatState) => void;
  setCurrentEnemy: (enemy: Enemy | null) => void;
}

const initialPlayer: Player = {
  maxHp: 100,
  currentHp: 100,
  gold: 0,
  inventory: [],
};

export const useGameStore = create<GameStore>((set, get) => ({
  // Initial state
  scene: GameScene.MAP,
  player: initialPlayer,
  currentFloor: null,
  currentEnemy: null,
  currentQuestion: null,
  combatState: CombatState.QUESTION_ACTIVE,

  // Actions
  setScene: (scene) => set({ scene }),

  moveToRoom: (roomId) => {
    const { currentFloor } = get();
    if (!currentFloor) return;

    set({
      currentFloor: {
        ...currentFloor,
        currentRoomId: roomId,
      },
    });
  },

  enterRoom: (roomId) => {
    const { currentFloor } = get();
    if (!currentFloor) return;

    const room = currentFloor.rooms.find((r) => r.id === roomId);
    if (!room) return;

    // Update current room
    set({
      currentFloor: {
        ...currentFloor,
        currentRoomId: roomId,
      },
    });

    // Handle room entry based on type
    // This will be expanded when we implement room-specific logic
  },

  setCurrentQuestion: (question) => set({ currentQuestion: question }),

  answerQuestion: (answer) => {
    const { currentQuestion, currentEnemy } = get();
    if (!currentQuestion || !currentEnemy) return;

    if (answer === currentQuestion.correctAnswer) {
      // Correct answer - damage enemy
      get().damageEnemy(20);
      get().setCombatState(CombatState.PLAYER_ATTACK);
    } else {
      // Wrong answer - damage player
      get().damagePlayer(10);
      get().setCombatState(CombatState.ENEMY_ATTACK);
    }
  },

  damageEnemy: (damage) => {
    const { currentEnemy } = get();
    if (!currentEnemy) return;

    const newHp = Math.max(0, currentEnemy.currentHp - damage);

    set({
      currentEnemy: {
        ...currentEnemy,
        currentHp: newHp,
      },
    });

    if (newHp === 0) {
      get().setCombatState(CombatState.VICTORY);
    }
  },

  damagePlayer: (damage) => {
    const { player } = get();
    const newHp = Math.max(0, player.currentHp - damage);

    set({
      player: {
        ...player,
        currentHp: newHp,
      },
    });

    if (newHp === 0) {
      get().setCombatState(CombatState.DEFEAT);
      get().setScene(GameScene.DEFEAT);
    }
  },

  collectLoot: (gold, items) => {
    const { player } = get();
    set({
      player: {
        ...player,
        gold: player.gold + gold,
        inventory: [...player.inventory, ...items],
      },
    });
  },

  buyItem: (item) => {
    const { player } = get();
    if (player.gold < item.price) return;

    set({
      player: {
        ...player,
        gold: player.gold - item.price,
        inventory: [...player.inventory, item],
      },
    });
  },

  useItem: (item) => {
    const { player } = get();

    // Check if item can be used
    if (!canUseItem(player, item)) {
      console.warn('Cannot use item at this time');
      return;
    }

    // Apply item effect
    const updatedPlayer = applyItemEffect(player, item);

    // Remove item from inventory
    const itemIndex = player.inventory.findIndex((i) => i.id === item.id);
    if (itemIndex === -1) return;

    const newInventory = [...player.inventory];
    newInventory.splice(itemIndex, 1);

    set({
      player: {
        ...updatedPlayer,
        inventory: newInventory,
      },
    });
  },

  nextFloor: (floor) => {
    set({ currentFloor: floor });
  },

  resetGame: () => {
    set({
      scene: GameScene.MAP,
      player: initialPlayer,
      currentFloor: null,
      currentEnemy: null,
      currentQuestion: null,
      combatState: CombatState.QUESTION_ACTIVE,
    });
  },

  setCombatState: (state) => set({ combatState: state }),

  setCurrentEnemy: (enemy) => set({ currentEnemy: enemy }),
}));
