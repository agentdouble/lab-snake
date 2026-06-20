import assert from "node:assert/strict";
import test from "node:test";

import { DIRECTIONS, STATUS } from "../src/constants.js";
import {
  loadBestScore,
  loadSavedGame,
  normalizeSavedGame,
  saveBestScore,
  saveGameState,
  scoreContextKey,
  serializeGameState,
  STORAGE_KEYS
} from "../src/storage.js";

const ACTIVE_SETTINGS = Object.freeze({
  mode: "quick",
  speed: "expert",
  color: "neon",
  showGrid: false,
  map: "wide",
  snakeColor: "violet",
  keepSnakeColorOnRestart: false
});

test("legacy global best score is ignored for segmented scores", (t) => {
  const localStorage = useMemoryStorage(t);
  localStorage.setItem(STORAGE_KEYS.legacyBestScore, "12");

  assert.equal(loadBestScore({ map: "classic", mode: "standard", speed: "normal" }), 0);
});

test("best scores are saved separately for map mode and effective speed context", (t) => {
  const localStorage = useMemoryStorage(t);
  const normalContext = { map: "classic", mode: "standard", speed: "normal" };
  const fastContext = { map: "classic", mode: "standard", speed: "fast" };
  const canyonQuickContext = { map: "canyon", mode: "quick", speed: "slow" };

  saveBestScore(normalContext, 4);
  saveBestScore(fastContext, 8);
  saveBestScore(canyonQuickContext, 3);
  saveBestScore(normalContext, 2);

  assert.equal(loadBestScore(normalContext), 4);
  assert.equal(loadBestScore(fastContext), 8);
  assert.equal(loadBestScore(canyonQuickContext), 3);

  const storedScores = JSON.parse(localStorage.getItem(STORAGE_KEYS.bestScoreSegments));
  assert.deepEqual(storedScores, {
    [scoreContextKey(normalContext)]: 4,
    [scoreContextKey(fastContext)]: 8,
    [scoreContextKey(canyonQuickContext)]: 3
  });
});

test("quick mode stores scores under its locked fast speed", (t) => {
  useMemoryStorage(t);
  const quickSlowContext = { map: "classic", mode: "quick", speed: "slow" };
  const quickFastContext = { map: "classic", mode: "quick", speed: "fast" };

  saveBestScore(quickSlowContext, 5);

  assert.equal(scoreContextKey(quickSlowContext), scoreContextKey(quickFastContext));
  assert.equal(loadBestScore(quickFastContext), 5);
});

test("invalid segmented score data is ignored cleanly", (t) => {
  const localStorage = useMemoryStorage(t);
  localStorage.setItem(STORAGE_KEYS.bestScoreSegments, "{bad-json");

  assert.equal(loadBestScore({ map: "classic", mode: "standard", speed: "normal" }), 0);
});

test("game snapshots include the playable state and active settings", () => {
  const snapshot = serializeGameState(createWideState({ status: STATUS.RUNNING }), ACTIVE_SETTINGS);

  assert.equal(snapshot.version, 2);
  assert.deepEqual(snapshot.engine, {
    startDelayMs: 145,
    minDelayMs: 62,
    delayStepMs: 5
  });
  assert.deepEqual(snapshot.settings, ACTIVE_SETTINGS);
  assert.deepEqual(snapshot.state, {
    map: "wide",
    snake: [
      { x: 11, y: 8 },
      { x: 10, y: 8 },
      { x: 9, y: 8 }
    ],
    direction: "right",
    directionQueue: ["down"],
    apple: { x: 12, y: 8 },
    score: 2,
    bestScore: 3,
    status: STATUS.RUNNING,
    ticks: 4
  });
});

test("obsolete or invalid saved games are ignored without clearing best score", (t) => {
  const localStorage = useMemoryStorage(t);

  saveBestScore(ACTIVE_SETTINGS, 12);
  localStorage.setItem(STORAGE_KEYS.savedGame, JSON.stringify({ version: 1 }));

  assert.equal(loadSavedGame(), null);
  assert.equal(loadBestScore(ACTIVE_SETTINGS), 12);
  assert.equal(localStorage.getItem(STORAGE_KEYS.savedGame), null);
});

test("valid saved games round-trip through localStorage", (t) => {
  useMemoryStorage(t);

  saveGameState(createWideState({ status: STATUS.PAUSED }), ACTIVE_SETTINGS);

  assert.deepEqual(loadSavedGame(), {
    settings: ACTIVE_SETTINGS,
    state: {
      map: "wide",
      snake: [
        { x: 11, y: 8 },
        { x: 10, y: 8 },
        { x: 9, y: 8 }
      ],
      direction: "right",
      directionQueue: ["down"],
      apple: { x: 12, y: 8 },
      score: 2,
      bestScore: 3,
      status: STATUS.PAUSED,
      ticks: 4
    }
  });
});

test("terminal saved games are not restored", () => {
  const snapshot = serializeGameState(createWideState({ status: STATUS.GAME_OVER }), ACTIVE_SETTINGS);

  assert.equal(normalizeSavedGame(snapshot), null);
});

test("saved games with stale settings are not restored", () => {
  const snapshot = serializeGameState(createWideState({ status: STATUS.PAUSED }), ACTIVE_SETTINGS);

  assert.equal(
    normalizeSavedGame({
      ...snapshot,
      settings: {
        ...snapshot.settings,
        map: "missing-map"
      }
    }),
    null
  );
});

test("saved games with a state map that does not match settings are not restored", () => {
  const snapshot = serializeGameState(createWideState({ status: STATUS.PAUSED }), ACTIVE_SETTINGS);

  assert.equal(
    normalizeSavedGame({
      ...snapshot,
      state: {
        ...snapshot.state,
        map: "classic"
      }
    }),
    null
  );
});

function createWideState(options = {}) {
  return {
    map: {
      id: "wide",
      width: 24,
      height: 16,
      obstacles: [
        { x: 3, y: 4 },
        { x: 4, y: 4 }
      ]
    },
    snake: [
      { x: 11, y: 8 },
      { x: 10, y: 8 },
      { x: 9, y: 8 }
    ],
    direction: DIRECTIONS.RIGHT,
    directionQueue: [DIRECTIONS.DOWN],
    apple: { x: 12, y: 8 },
    score: 2,
    bestScore: 3,
    status: options.status ?? STATUS.RUNNING,
    ticks: 4
  };
}

function useMemoryStorage(t) {
  const localStorage = createMemoryStorage();
  globalThis.window = { localStorage };
  t.after(() => {
    delete globalThis.window;
  });

  return localStorage;
}

function createMemoryStorage() {
  const values = new Map();

  return {
    getItem(key) {
      return values.has(key) ? values.get(key) : null;
    },
    setItem(key, value) {
      values.set(key, String(value));
    },
    removeItem(key) {
      values.delete(key);
    }
  };
}
