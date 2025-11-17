export interface Question {
  question: string;
  options: string[];
  correctIndex: number;
}

export interface CombatEntity {
  name: string;
  currentHp: number;
  maxHp: number;
  damage: number;
}

export interface CombatState {
  player: CombatEntity;
  enemy: CombatEntity;
  currentQuestion: Question;
  isAnswerSelected: boolean;
}

// Mock data for testing
export const MOCK_QUESTION: Question = {
  question: "Was ist 5 + 3?",
  options: ["6", "7", "8", "9"],
  correctIndex: 2,
};

export const PLAYER_STATS = {
  name: "Player",
  maxHp: 25,
  damage: 10,
};

export const ENEMY_STATS = {
  name: "Goblin",
  maxHp: 20,
  damage: 7,
};
