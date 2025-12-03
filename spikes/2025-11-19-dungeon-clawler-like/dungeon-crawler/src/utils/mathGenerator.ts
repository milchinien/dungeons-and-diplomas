import { Difficulty, MathQuestion } from '../types/game';

// Generate random integer between min and max (inclusive)
function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function generateQuestion(difficulty: Difficulty): MathQuestion {
  switch (difficulty) {
    case Difficulty.EASY:
      return generateEasyQuestion();
    case Difficulty.MEDIUM:
      return generateMediumQuestion();
    case Difficulty.HARD:
      return generateHardQuestion();
    default:
      return generateEasyQuestion();
  }
}

function generateEasyQuestion(): MathQuestion {
  const operation = Math.random() > 0.5 ? 'add' : 'subtract';

  if (operation === 'add') {
    const a = randomInt(1, 20);
    const b = randomInt(1, 20);
    return {
      question: `${a} + ${b}`,
      correctAnswer: a + b,
    };
  } else {
    const a = randomInt(10, 30);
    const b = randomInt(1, 10);
    return {
      question: `${a} - ${b}`,
      correctAnswer: a - b,
    };
  }
}

function generateMediumQuestion(): MathQuestion {
  const operation = Math.random() > 0.5 ? 'multiply' : 'add';

  if (operation === 'multiply') {
    const a = randomInt(2, 10);
    const b = randomInt(2, 10);
    return {
      question: `${a} × ${b}`,
      correctAnswer: a * b,
    };
  } else {
    const a = randomInt(10, 50);
    const b = randomInt(10, 50);
    return {
      question: `${a} + ${b}`,
      correctAnswer: a + b,
    };
  }
}

function generateHardQuestion(): MathQuestion {
  const operations = ['multiply', 'divide', 'mixed'];
  const operation = operations[randomInt(0, operations.length - 1)];

  if (operation === 'multiply') {
    const a = randomInt(5, 15);
    const b = randomInt(5, 15);
    return {
      question: `${a} × ${b}`,
      correctAnswer: a * b,
    };
  } else if (operation === 'divide') {
    const b = randomInt(2, 10);
    const result = randomInt(5, 20);
    const a = b * result;
    return {
      question: `${a} ÷ ${b}`,
      correctAnswer: result,
    };
  } else {
    // Mixed operation: (a + b) × c
    const a = randomInt(5, 15);
    const b = randomInt(5, 15);
    const c = randomInt(2, 5);
    return {
      question: `(${a} + ${b}) × ${c}`,
      correctAnswer: (a + b) * c,
    };
  }
}

// Get difficulty based on floor level
export function getDifficultyForFloor(floorLevel: number): Difficulty {
  if (floorLevel <= 2) return Difficulty.EASY;
  if (floorLevel <= 4) return Difficulty.MEDIUM;
  return Difficulty.HARD;
}
