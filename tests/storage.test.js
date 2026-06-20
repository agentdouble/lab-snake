import assert from "node:assert/strict";
import test from "node:test";

import { DIRECTIONS, STATUS } from "../src/constants.js";
import {
  loadBestScore,
  loadSavedGame,
  normalizeSavedGame,
  saveBestScore,
  saveGameState,
  serializeGameState
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
  const localStorage = createMemoryStorage();
  global.window = { localStorage };
  t.after(() => {
    delete global.window;
  });

  saveBestScore(12);
  localStorage.setItem("snake.currentGame", JSON.stringify({ version: 1 }));

  assert.equal(loadSavedGame(), null);
  assert.equal(loadBestScore(), 12);
  assert.equal(localStorage.getItem("snake.currentGame"), null);
});

test("valid saved games round-trip through localStorage", (t) => {
  const localStorage = createMemoryStorage();
  global.window = { localStorage };
  t.after(() => {
    delete global.window;
  });

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
