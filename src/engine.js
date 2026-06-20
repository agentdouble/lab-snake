import {
  DELAY_STEP_MS,
  DIRECTIONS,
  MIN_DELAY_MS,
  START_DELAY_MS,
  STATUS
} from "./constants.js";
import { getMapDefinition } from "./maps.js";

export function createInitialState(options = {}) {
  const {
    bestScore = 0,
    randomizer = Math.random,
    apple
  } = options;

  const map = getMapDefinition(options.mapId ?? options.map?.id);
  const snake = options.snake ?? map.startSnake;
  const direction = options.direction ?? map.startDirection ?? DIRECTIONS.RIGHT;
  const initialSnake = snake.map(copyCell);
  const initialApple =
    apple && isFreeCell(apple, initialSnake, map)
      ? copyCell(apple)
      : randomFreeCell(initialSnake, randomizer, map);

  return {
    map,
    snake: initialSnake,
    direction,
    directionQueue: [],
    apple: initialApple,
    score: 0,
    bestScore,
    status: STATUS.READY,
    ticks: 0
  };
}

export function restoreState(snapshot, options = {}) {
  const map = getMapDefinition(snapshot.map ?? options.mapId);
  const bestScore = Math.max(options.bestScore ?? 0, snapshot.bestScore ?? 0, snapshot.score);

  return {
    map,
    snake: snapshot.snake.map(copyCell),
    direction: directionFromName(snapshot.direction),
    directionQueue: snapshot.directionQueue.map(directionFromName),
    apple: snapshot.apple ? copyCell(snapshot.apple) : null,
    score: snapshot.score,
    bestScore,
    status: snapshot.status,
    ticks: snapshot.ticks
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

export function resumeGame(state) {
  if (state.status !== STATUS.PAUSED) {
    return state;
  }

  return { ...state, status: STATUS.RUNNING };
}

export function resetGame(state, options = {}) {
  return createInitialState({
    bestScore: state.bestScore,
    mapId: state.map.id,
    ...options
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
  const direction = queuedDirection ?? state.direction;
  const nextHead = addCells(state.snake[0], direction);
  const grows = state.apple && sameCell(nextHead, state.apple);
  const collisionBody = grows ? state.snake : state.snake.slice(0, -1);

  if (!isValidMapCell(nextHead, state.map) || containsCell(collisionBody, nextHead)) {
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

  const nextApple = grows ? randomFreeCell(nextSnake, randomizer, state.map) : state.apple;
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

export function getTickDelay(score, speedMultiplier = 1) {
  const normalizedMultiplier = Number.isFinite(speedMultiplier) && speedMultiplier > 0 ? speedMultiplier : 1;
  const scaledDelay = Math.round((START_DELAY_MS - score * DELAY_STEP_MS) / normalizedMultiplier);

  return Math.max(MIN_DELAY_MS, scaledDelay);
}

export function randomFreeCell(occupiedCells, randomizer = Math.random, mapDefinition) {
  const map = getMapDefinition(mapDefinition?.id ?? mapDefinition);
  const occupied = new Set(map.obstacles.map(cellKey));

  occupiedCells.forEach((cell) => {
    if (isInsideMap(cell, map)) {
      occupied.add(cellKey(cell));
    }
  });

  const freeCellsCount = map.width * map.height - occupied.size;

  if (freeCellsCount <= 0) {
    return null;
  }

  let targetIndex = Math.floor(randomizer() * freeCellsCount);

  for (let y = 0; y < map.height; y += 1) {
    for (let x = 0; x < map.width; x += 1) {
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

export function isValidMapCell(cell, mapDefinition) {
  const map = getMapDefinition(mapDefinition?.id ?? mapDefinition);

  return isInsideMap(cell, map) && !containsCell(map.obstacles, cell);
}

function addCells(cell, direction) {
  return {
    x: cell.x + direction.x,
    y: cell.y + direction.y
  };
}

function copyCell(cell) {
  return { x: cell.x, y: cell.y };
}

function isFreeCell(cell, occupiedCells, map) {
  return isValidMapCell(cell, map) && !containsCell(occupiedCells, cell);
}

function isInsideMap(cell, map) {
  return cell.x >= 0 && cell.y >= 0 && cell.x < map.width && cell.y < map.height;
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

function directionFromName(name) {
  const direction = Object.values(DIRECTIONS).find((candidate) => candidate.name === name);

  if (!direction) {
    throw new Error(`Unknown direction: ${name}`);
  }

  return direction;
}
