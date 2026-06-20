import {
  DIRECTIONS,
  DEFAULT_GAME_CONTEXT,
  GRID_SIZE,
  STATUS
} from "./constants.js";
import { createGameContext, getMapConfig, getModeConfig, getSpeedConfig } from "./contexts.js";

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
    context = DEFAULT_GAME_CONTEXT
  } = options;

  const gameContext = createGameContext(context);
  const mapConfig = getMapConfig(gameContext.mapId);
  const initialSnake = snake.map(copyCell);

  return {
    snake: initialSnake,
    direction,
    directionQueue: [],
    apple: apple ? copyCell(apple) : randomFreeCell(initialSnake, randomizer, mapConfig.obstacles),
    score: 0,
    bestScore,
    context: gameContext,
    status: STATUS.READY,
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
    ...options,
    bestScore: options.bestScore ?? state.bestScore,
    context: options.context ?? state.context
  });
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
  const context = createGameContext(state.context);
  const mapConfig = getMapConfig(context.mapId);
  const modeConfig = getModeConfig(context.modeId);
  const direction = queuedDirection ?? state.direction;
  const rawNextHead = addCells(state.snake[0], direction);
  const nextHead = modeConfig.wrap ? wrapCell(rawNextHead) : rawNextHead;
  const grows = state.apple && sameCell(nextHead, state.apple);
  const collisionBody = grows ? state.snake : state.snake.slice(0, -1);

  if (
    (!modeConfig.wrap && isOutsideGrid(rawNextHead)) ||
    containsCell(collisionBody, nextHead) ||
    containsCell(mapConfig.obstacles, nextHead)
  ) {
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

  const nextApple = grows ? randomFreeCell(nextSnake, randomizer, mapConfig.obstacles) : state.apple;
  const nextScore = grows ? state.score + 1 : state.score;
  const hasWon = grows && !nextApple;

  return {
    ...state,
    snake: nextSnake,
    direction,
    directionQueue: remainingQueue,
    apple: nextApple,
    score: nextScore,
    context,
    bestScore: Math.max(state.bestScore, nextScore),
    status: hasWon ? STATUS.WON : STATUS.RUNNING,
    ticks: state.ticks + 1
  };
}

export function getTickDelay(score, speedId = DEFAULT_GAME_CONTEXT.speedId) {
  const speedConfig = getSpeedConfig(speedId);

  return Math.max(speedConfig.minDelayMs, speedConfig.startDelayMs - score * speedConfig.delayStepMs);
}

export function randomFreeCell(occupiedCells, randomizer = Math.random, blockedCells = []) {
  const occupied = new Set([...occupiedCells, ...blockedCells].map(cellKey));
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

function wrapCell(cell) {
  return {
    x: (cell.x + GRID_SIZE) % GRID_SIZE,
    y: (cell.y + GRID_SIZE) % GRID_SIZE
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
