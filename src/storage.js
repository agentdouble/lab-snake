import { DELAY_STEP_MS, DIRECTIONS, GRID_SIZE, MIN_DELAY_MS, START_DELAY_MS, STATUS } from "./constants.js";

const BEST_SCORE_KEY = "snake.bestScore";
const SAVED_GAME_KEY = "snake.currentGame";
const SAVED_GAME_VERSION = 1;

const RESTORABLE_STATUSES = new Set([STATUS.READY, STATUS.RUNNING, STATUS.PAUSED]);
const DIRECTION_NAMES = new Set(Object.values(DIRECTIONS).map((direction) => direction.name));
const SETTINGS = Object.freeze({
  gridSize: GRID_SIZE,
  startDelayMs: START_DELAY_MS,
  minDelayMs: MIN_DELAY_MS,
  delayStepMs: DELAY_STEP_MS
});

export function loadBestScore() {
  const value = window.localStorage.getItem(BEST_SCORE_KEY);
  const parsedValue = Number.parseInt(value ?? "0", 10);

  return Number.isFinite(parsedValue) ? parsedValue : 0;
}

export function saveBestScore(bestScore) {
  window.localStorage.setItem(BEST_SCORE_KEY, String(bestScore));
}

export function loadSavedGame() {
  const value = window.localStorage.getItem(SAVED_GAME_KEY);

  if (!value) {
    return null;
  }

  try {
    const snapshot = normalizeSavedGame(JSON.parse(value));

    if (snapshot) {
      return snapshot;
    }
  } catch {
    // Invalid JSON is treated the same as an obsolete schema.
  }

  clearSavedGame();
  return null;
}

export function saveGameState(state) {
  window.localStorage.setItem(SAVED_GAME_KEY, JSON.stringify(serializeGameState(state)));
}

export function clearSavedGame() {
  window.localStorage.removeItem(SAVED_GAME_KEY);
}

export function serializeGameState(state) {
  return {
    version: SAVED_GAME_VERSION,
    settings: SETTINGS,
    state: {
      snake: state.snake.map(copyCell),
      direction: state.direction.name,
      directionQueue: state.directionQueue.map((direction) => direction.name),
      apple: state.apple ? copyCell(state.apple) : null,
      score: state.score,
      bestScore: state.bestScore,
      status: state.status,
      ticks: state.ticks
    }
  };
}

export function normalizeSavedGame(value) {
  if (!isRecord(value) || value.version !== SAVED_GAME_VERSION || !sameSettings(value.settings)) {
    return null;
  }

  const snapshot = value.state;

  if (!isRecord(snapshot) || !RESTORABLE_STATUSES.has(snapshot.status)) {
    return null;
  }

  if (!Array.isArray(snapshot.snake) || snapshot.snake.length === 0 || hasDuplicateCells(snapshot.snake)) {
    return null;
  }

  const snake = snapshot.snake.map(normalizeCell);

  if (snake.some((cell) => !cell)) {
    return null;
  }

  const apple = snapshot.apple === null ? null : normalizeCell(snapshot.apple);

  if (!apple || containsCell(snake, apple)) {
    return null;
  }

  if (
    !DIRECTION_NAMES.has(snapshot.direction) ||
    !Array.isArray(snapshot.directionQueue) ||
    snapshot.directionQueue.length > 2 ||
    !snapshot.directionQueue.every((direction) => DIRECTION_NAMES.has(direction)) ||
    !isNonNegativeInteger(snapshot.score) ||
    !isNonNegativeInteger(snapshot.bestScore) ||
    !isNonNegativeInteger(snapshot.ticks)
  ) {
    return null;
  }

  return {
    snake,
    direction: snapshot.direction,
    directionQueue: [...snapshot.directionQueue],
    apple,
    score: snapshot.score,
    bestScore: snapshot.bestScore,
    status: snapshot.status,
    ticks: snapshot.ticks
  };
}

function sameSettings(settings) {
  return (
    isRecord(settings) &&
    settings.gridSize === SETTINGS.gridSize &&
    settings.startDelayMs === SETTINGS.startDelayMs &&
    settings.minDelayMs === SETTINGS.minDelayMs &&
    settings.delayStepMs === SETTINGS.delayStepMs
  );
}

function normalizeCell(cell) {
  if (!isRecord(cell) || !Number.isInteger(cell.x) || !Number.isInteger(cell.y)) {
    return null;
  }

  if (cell.x < 0 || cell.y < 0 || cell.x >= GRID_SIZE || cell.y >= GRID_SIZE) {
    return null;
  }

  return copyCell(cell);
}

function containsCell(cells, target) {
  return cells.some((cell) => cell.x === target.x && cell.y === target.y);
}

function hasDuplicateCells(cells) {
  const seen = new Set();

  for (const cell of cells) {
    const normalizedCell = normalizeCell(cell);

    if (!normalizedCell) {
      return false;
    }

    const key = `${normalizedCell.x}:${normalizedCell.y}`;

    if (seen.has(key)) {
      return true;
    }

    seen.add(key);
  }

  return false;
}

function isNonNegativeInteger(value) {
  return Number.isInteger(value) && value >= 0;
}

function isRecord(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function copyCell(cell) {
  return { x: cell.x, y: cell.y };
}
