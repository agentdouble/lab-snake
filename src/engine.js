import {
  DELAY_STEP_MS,
  DEFAULT_SPEED_KEY,
  DIRECTIONS,
  GRID_SIZE,
  MIN_DELAY_MS,
  SPEED_LEVELS,
  START_DELAY_MS,
  STATUS
} from "./constants.js";

const SPEED_LEVEL_BY_KEY = Object.freeze(Object.fromEntries(SPEED_LEVELS.map((level) => [level.key, level])));

const DEFAULT_SNAKE = Object.freeze([
  Object.freeze({ x: 9, y: 10 }),
  Object.freeze({ x: 8, y: 10 }),
  Object.freeze({ x: 7, y: 10 })
]);

export function createInitialState(options = {}) {
  const {
    bestScore = 0,
    randomizer = Math.random,
    snake = DEFAULT_SNAKE,
    direction = DIRECTIONS.RIGHT,
    apple,
    speedKey = DEFAULT_SPEED_KEY
  } = options;

  const initialSnake = snake.map(copyCell);
  const speedLevel = getSpeedLevel(speedKey);

  return {
    snake: initialSnake,
    direction,
    directionQueue: [],
    apple: apple ? copyCell(apple) : randomFreeCell(initialSnake, randomizer),
    score: 0,
    bestScore,
    status: STATUS.READY,
    speedKey: speedLevel.key,
    ticks: 0
  };
}

export function startGame(state) {
  if (state.status === STATUS.RUNNING || state.status === STATUS.GAME_OVER || state.status === STATUS.WON) {
    return state;
  }

  return { ...state, status: STATUS.RUNNING };
}

export function pauseGame(state) {
  if (state.status !== STATUS.RUNNING) {
    return state;
  }

  return { ...state, status: STATUS.PAUSED };
}

export function resetGame(state, options = {}) {
  return createInitialState({
    bestScore: state.bestScore,
    speedKey: state.speedKey,
    ...options
  });
}

export function setSpeedLevel(state, speedKey) {
  const speedLevel = getSpeedLevel(speedKey);

  if (state.speedKey === speedLevel.key) {
    return state;
  }

  return {
    ...state,
    speedKey: speedLevel.key
  };
}

export function queueDirection(state, direction) {
  if (!direction || state.status === STATUS.GAME_OVER || state.status === STATUS.WON) {
    return state;
  }

  const latestDirection = state.directionQueue.at(-1) ?? state.direction;

  if (sameDirection(direction, latestDirection) || isOpposite(direction, latestDirection)) {
    return state;
  }

  if (state.directionQueue.length >= 2) {
    return state;
  }

  return {
    ...state,
    directionQueue: [...state.directionQueue, direction]
  };
}

export function stepState(state, randomizer = Math.random) {
  if (state.status !== STATUS.RUNNING) {
    return state;
  }

  const [queuedDirection, ...remainingQueue] = state.directionQueue;
  const direction = queuedDirection ?? state.direction;
  const nextHead = addCells(state.snake[0], direction);
  const grows = state.apple && sameCell(nextHead, state.apple);
  const collisionBody = grows ? state.snake : state.snake.slice(0, -1);

  if (isOutsideGrid(nextHead) || containsCell(collisionBody, nextHead)) {
    return {
      ...state,
      direction,
      directionQueue: remainingQueue,
      bestScore: Math.max(state.bestScore, state.score),
      status: STATUS.GAME_OVER,
      ticks: state.ticks + 1
    };
  }

  const nextSnake = [nextHead, ...state.snake.map(copyCell)];

  if (!grows) {
    nextSnake.pop();
  }

  const nextApple = grows ? randomFreeCell(nextSnake, randomizer) : state.apple;
  const nextScore = grows ? state.score + 1 : state.score;
  const hasWon = grows && !nextApple;

  return {
    ...state,
    snake: nextSnake,
    direction,
    directionQueue: remainingQueue,
    apple: nextApple,
    score: nextScore,
    bestScore: Math.max(state.bestScore, nextScore),
    status: hasWon ? STATUS.WON : STATUS.RUNNING,
    ticks: state.ticks + 1
  };
}

export function getTickDelay(score, speedKey = DEFAULT_SPEED_KEY) {
  const baseDelay = Math.max(MIN_DELAY_MS, START_DELAY_MS - score * DELAY_STEP_MS);
  const speedLevel = getSpeedLevel(speedKey);

  return Math.max(MIN_DELAY_MS, Math.round(baseDelay / speedLevel.multiplier));
}

export function getSpeedLevel(speedKey) {
  return SPEED_LEVEL_BY_KEY[speedKey] ?? SPEED_LEVEL_BY_KEY[DEFAULT_SPEED_KEY];
}

export function getSpeedMultiplier(score, speedKey = DEFAULT_SPEED_KEY) {
  return START_DELAY_MS / getTickDelay(score, speedKey);
}

export function randomFreeCell(occupiedCells, randomizer = Math.random) {
  const occupied = new Set(occupiedCells.map(cellKey));
  const freeCellsCount = GRID_SIZE * GRID_SIZE - occupied.size;

  if (freeCellsCount <= 0) {
    return null;
  }

  let targetIndex = Math.floor(randomizer() * freeCellsCount);

  for (let y = 0; y < GRID_SIZE; y += 1) {
    for (let x = 0; x < GRID_SIZE; x += 1) {
      if (occupied.has(cellKey({ x, y }))) {
        continue;
      }

      if (targetIndex === 0) {
        return { x, y };
      }

      targetIndex -= 1;
    }
  }

  return null;
}

function addCells(cell, direction) {
  return {
    x: cell.x + direction.x,
    y: cell.y + direction.y
  };
}

function isOutsideGrid(cell) {
  return cell.x < 0 || cell.y < 0 || cell.x >= GRID_SIZE || cell.y >= GRID_SIZE;
}

function containsCell(cells, target) {
  return cells.some((cell) => sameCell(cell, target));
}

function sameCell(first, second) {
  return first.x === second.x && first.y === second.y;
}

function sameDirection(first, second) {
  return first.x === second.x && first.y === second.y;
}

function isOpposite(first, second) {
  return first.x + second.x === 0 && first.y + second.y === 0;
}

function cellKey(cell) {
  return `${cell.x}:${cell.y}`;
}

function copyCell(cell) {
  return { x: cell.x, y: cell.y };
}
