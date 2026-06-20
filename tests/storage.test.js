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

test("game state snapshots include the playable state and active settings", () => {
  const snapshot = serializeGameState({
    snake: [
      { x: 9, y: 10 },
      { x: 8, y: 10 },
      { x: 7, y: 10 }
    ],
    direction: DIRECTIONS.RIGHT,
    directionQueue: [DIRECTIONS.DOWN],
    apple: { x: 5, y: 6 },
    score: 2,
    bestScore: 3,
    status: STATUS.RUNNING,
    ticks: 4
  });

  assert.equal(snapshot.version, 1);
  assert.deepEqual(snapshot.settings, {
    gridSize: 20,
    startDelayMs: 145,
    minDelayMs: 62,
    delayStepMs: 5
  });
  assert.deepEqual(snapshot.state, {
    snake: [
      { x: 9, y: 10 },
      { x: 8, y: 10 },
      { x: 7, y: 10 }
    ],
    direction: "right",
    directionQueue: ["down"],
    apple: { x: 5, y: 6 },
    score: 2,
    bestScore: 3,
    status: STATUS.RUNNING,
    ticks: 4
  });
});

test("obsolete or invalid saved games are ignored without clearing best score", () => {
  const localStorage = createMemoryStorage();
  global.window = { localStorage };

  saveBestScore(12);
  localStorage.setItem("snake.currentGame", JSON.stringify({ version: 0 }));

  assert.equal(loadSavedGame(), null);
  assert.equal(loadBestScore(), 12);
  assert.equal(localStorage.getItem("snake.currentGame"), null);

  delete global.window;
});

test("valid saved games round-trip through localStorage", () => {
  const localStorage = createMemoryStorage();
  global.window = { localStorage };

  saveGameState({
    snake: [
      { x: 9, y: 10 },
      { x: 8, y: 10 },
      { x: 7, y: 10 }
    ],
    direction: DIRECTIONS.RIGHT,
    directionQueue: [],
    apple: { x: 2, y: 2 },
    score: 0,
    bestScore: 5,
    status: STATUS.PAUSED,
    ticks: 3
  });

  assert.deepEqual(loadSavedGame(), {
    snake: [
      { x: 9, y: 10 },
      { x: 8, y: 10 },
      { x: 7, y: 10 }
    ],
    direction: "right",
    directionQueue: [],
    apple: { x: 2, y: 2 },
    score: 0,
    bestScore: 5,
    status: STATUS.PAUSED,
    ticks: 3
  });

  delete global.window;
});

test("terminal saved games are not restored", () => {
  const snapshot = serializeGameState({
    snake: [
      { x: 9, y: 10 },
      { x: 8, y: 10 },
      { x: 7, y: 10 }
    ],
    direction: DIRECTIONS.RIGHT,
    directionQueue: [],
    apple: { x: 2, y: 2 },
    score: 0,
    bestScore: 5,
    status: STATUS.GAME_OVER,
    ticks: 3
  });

  assert.equal(normalizeSavedGame(snapshot), null);
});

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
