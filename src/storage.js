import { DELAY_STEP_MS, DIRECTIONS, MIN_DELAY_MS, START_DELAY_MS, STATUS } from "./constants.js";
import { getMapDefinition } from "./maps.js";
import { getEffectiveSpeedOption, normalizeSettings } from "./settings.js";

const CHALLENGE_BEST_SCORE_PREFIX = "snake.challengeBestScore.";
const SETTINGS_KEY = "snake.settings";
const SAVED_GAME_VERSION = 2;

export const STORAGE_KEYS = Object.freeze({
  legacyBestScore: "snake.bestScore",
  bestScoreSegments: "snake.bestScores.v2",
  savedGame: "snake.currentGame"
});

const RESTORABLE_STATUSES = new Set([STATUS.READY, STATUS.RUNNING, STATUS.PAUSED]);
const ENGINE_SETTINGS = Object.freeze({
  startDelayMs: START_DELAY_MS,
  minDelayMs: MIN_DELAY_MS,
  delayStepMs: DELAY_STEP_MS
});

// The legacy value was global, so v2 ignores it instead of guessing a context.
export function loadBestScore(settings = {}) {
  const bestScores = loadBestScores();

  return bestScores[scoreContextKey(settings)] ?? 0;
}

export function saveBestScore(settings, bestScore) {
  const storage = getLocalStorage();

  if (!storage) {
    return 0;
  }

  const bestScores = loadBestScores();
  const key = scoreContextKey(settings);
  const previousBestScore = bestScores[key] ?? 0;
  const nextBestScore = Math.max(previousBestScore, sanitizeScore(bestScore));

  bestScores[key] = nextBestScore;
  storage.setItem(STORAGE_KEYS.bestScoreSegments, JSON.stringify(bestScores));

  return nextBestScore;
}

export function loadBestScores() {
  const storage = getLocalStorage();

  if (!storage) {
    return {};
  }

  const value = storage.getItem(STORAGE_KEYS.bestScoreSegments);

  if (!value) {
    return {};
  }

  try {
    const parsedValue = JSON.parse(value);

    if (!parsedValue || typeof parsedValue !== "object" || Array.isArray(parsedValue)) {
      return {};
    }

    return Object.fromEntries(
      Object.entries(parsedValue)
        .map(([key, score]) => [key, sanitizeScore(score)])
        .filter(([, score]) => score > 0)
    );
  } catch {
    return {};
  }
}

export function scoreContextKey(settings = {}) {
  const normalizedSettings = normalizeSettings(settings);
  const effectiveSpeed = getEffectiveSpeedOption(normalizedSettings);

  return `map=${normalizedSettings.map}|mode=${normalizedSettings.mode}|speed=${effectiveSpeed.id}`;
}

export function loadChallengeBestScore(seed) {
  return loadStoredScore(challengeBestScoreKey(seed));
}

export function saveChallengeBestScore(seed, bestScore) {
  return saveStoredScore(challengeBestScoreKey(seed), bestScore);
}

export function loadSettings() {
  const storage = getLocalStorage();

  if (!storage) {
    return normalizeSettings();
  }

  const value = storage.getItem(SETTINGS_KEY);

  if (!value) {
    return normalizeSettings();
  }

  try {
    return normalizeSettings(JSON.parse(value));
  } catch {
    return normalizeSettings();
  }
}

export function saveSettings(settings) {
  const storage = getLocalStorage();

  if (!storage) {
    return;
  }

  storage.setItem(SETTINGS_KEY, JSON.stringify(normalizeSettings(settings)));
}

export function loadSavedGame() {
  const storage = getLocalStorage();

  if (!storage) {
    return null;
  }

  const value = storage.getItem(STORAGE_KEYS.savedGame);

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

export function saveGameState(state, settings) {
  const storage = getLocalStorage();

  if (!storage) {
    return;
  }

  storage.setItem(STORAGE_KEYS.savedGame, JSON.stringify(serializeGameState(state, settings)));
}

export function clearSavedGame() {
  const storage = getLocalStorage();

  if (!storage) {
    return;
  }

  storage.removeItem(STORAGE_KEYS.savedGame);
}

export function serializeGameState(state, settings) {
  return {
    version: SAVED_GAME_VERSION,
    engine: ENGINE_SETTINGS,
    settings: normalizeSettings(settings),
    state: {
      map: state.map.id,
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
  if (!isRecord(value) || value.version !== SAVED_GAME_VERSION || !sameEngineSettings(value.engine)) {
    return null;
  }

  const settings = normalizeStrictSettings(value.settings);
  const snapshot = value.state;

  if (!settings || !isRecord(snapshot) || snapshot.map !== settings.map || !RESTORABLE_STATUSES.has(snapshot.status)) {
    return null;
  }

  const map = getMapDefinition(snapshot.map);
  const snake = normalizeCells(snapshot.snake, map);
  const direction = directionFromName(snapshot.direction);

  if (!direction) {
    return null;
  }

  const directionQueue = normalizeDirectionQueue(snapshot.directionQueue, direction);
  const apple = snapshot.apple === null ? null : normalizeCell(snapshot.apple, map);

  if (!snake || !directionQueue || !apple || containsCell(snake, apple)) {
    return null;
  }

  if (
    !isNonNegativeInteger(snapshot.score) ||
    !isNonNegativeInteger(snapshot.bestScore) ||
    !isNonNegativeInteger(snapshot.ticks)
  ) {
    return null;
  }

  return {
    settings,
    state: {
      map: map.id,
      snake,
      direction: direction.name,
      directionQueue,
      apple,
      score: snapshot.score,
      bestScore: snapshot.bestScore,
      status: snapshot.status,
      ticks: snapshot.ticks
    }
  };
}

function loadStoredScore(key) {
  const storage = getLocalStorage();

  if (!storage) {
    return 0;
  }

  return sanitizeScore(storage.getItem(key));
}

function saveStoredScore(key, bestScore) {
  const storage = getLocalStorage();

  if (!storage) {
    return 0;
  }

  const nextBestScore = Math.max(loadStoredScore(key), sanitizeScore(bestScore));
  storage.setItem(key, String(nextBestScore));

  return nextBestScore;
}

function challengeBestScoreKey(seed) {
  return `${CHALLENGE_BEST_SCORE_PREFIX}${encodeURIComponent(seed)}`;
}

function sanitizeScore(value) {
  const parsedValue = Number.parseInt(value ?? "0", 10);

  return Number.isFinite(parsedValue) ? Math.max(0, parsedValue) : 0;
}

function getLocalStorage() {
  return globalThis.window?.localStorage ?? globalThis.localStorage ?? null;
}

function sameEngineSettings(settings) {
  return (
    isRecord(settings) &&
    settings.startDelayMs === ENGINE_SETTINGS.startDelayMs &&
    settings.minDelayMs === ENGINE_SETTINGS.minDelayMs &&
    settings.delayStepMs === ENGINE_SETTINGS.delayStepMs
  );
}

function normalizeStrictSettings(settings) {
  if (!isRecord(settings)) {
    return null;
  }

  const normalizedSettings = normalizeSettings(settings);

  return Object.entries(normalizedSettings).every(([key, value]) => settings[key] === value)
    ? normalizedSettings
    : null;
}

function normalizeCells(cells, map) {
  if (!Array.isArray(cells) || cells.length === 0) {
    return null;
  }

  const normalizedCells = [];
  const seen = new Set();

  for (const cell of cells) {
    const normalizedCell = normalizeCell(cell, map);

    if (!normalizedCell) {
      return null;
    }

    const key = cellKey(normalizedCell);

    if (seen.has(key)) {
      return null;
    }

    seen.add(key);
    normalizedCells.push(normalizedCell);
  }

  return normalizedCells;
}

function normalizeCell(cell, map) {
  if (!isRecord(cell) || !Number.isInteger(cell.x) || !Number.isInteger(cell.y)) {
    return null;
  }

  if (cell.x < 0 || cell.y < 0 || cell.x >= map.width || cell.y >= map.height) {
    return null;
  }

  if (containsCell(map.obstacles, cell)) {
    return null;
  }

  return copyCell(cell);
}

function normalizeDirectionQueue(queue, currentDirection) {
  if (!Array.isArray(queue) || queue.length > 2) {
    return null;
  }

  const directionQueue = [];
  let latestDirection = currentDirection;

  for (const directionName of queue) {
    const direction = directionFromName(directionName);

    if (!direction || sameDirection(direction, latestDirection) || isOpposite(direction, latestDirection)) {
      return null;
    }

    directionQueue.push(direction.name);
    latestDirection = direction;
  }

  return directionQueue;
}

function directionFromName(name) {
  return Object.values(DIRECTIONS).find((direction) => direction.name === name) ?? null;
}

function containsCell(cells, target) {
  return cells.some((cell) => cell.x === target.x && cell.y === target.y);
}

function sameDirection(first, second) {
  return first.x === second.x && first.y === second.y;
}

function isOpposite(first, second) {
  return first.x + second.x === 0 && first.y + second.y === 0;
}

function isNonNegativeInteger(value) {
  return Number.isInteger(value) && value >= 0;
}

function isRecord(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function cellKey(cell) {
  return `${cell.x}:${cell.y}`;
}

function copyCell(cell) {
  return { x: cell.x, y: cell.y };
}
