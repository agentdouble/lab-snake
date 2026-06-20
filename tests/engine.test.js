import assert from "node:assert/strict";
import test from "node:test";

import { DIRECTIONS, STATUS } from "../src/constants.js";
import {
  createInitialState,
  getTickDelay,
  queueDirection,
  startGame,
  stepState
} from "../src/engine.js";
import { createSeededRandomizer, getDailyChallengeSeed } from "../src/seed.js";

test("the snake grows and scores when it eats an apple", () => {
  const state = startGame(
    createInitialState({
      apple: { x: 10, y: 10 }
    })
  );

  const nextState = stepState(state, () => 0);

  assert.equal(nextState.score, 1);
  assert.equal(nextState.snake.length, 4);
  assert.deepEqual(nextState.snake[0], { x: 10, y: 10 });
  assert.equal(nextState.bestScore, 1);
});

test("the direction queue blocks immediate reversal", () => {
  let state = createInitialState();

  state = queueDirection(state, DIRECTIONS.LEFT);
  assert.equal(state.directionQueue.length, 0);

  state = queueDirection(state, DIRECTIONS.UP);
  state = queueDirection(state, DIRECTIONS.LEFT);

  assert.deepEqual(
    state.directionQueue.map((direction) => direction.name),
    ["up", "left"]
  );
});

test("wall collision ends the game", () => {
  const state = startGame(
    createInitialState({
      snake: [{ x: 19, y: 10 }],
      apple: { x: 0, y: 0 },
      direction: DIRECTIONS.RIGHT
    })
  );

  const nextState = stepState(state);

  assert.equal(nextState.status, STATUS.GAME_OVER);
  assert.equal(nextState.bestScore, 0);
});

test("the game accelerates without passing the minimum delay", () => {
  assert.equal(getTickDelay(0), 145);
  assert.equal(getTickDelay(10), 95);
  assert.equal(getTickDelay(1000), 62);
});

test("daily challenge seeds are derived from the local calendar day", () => {
  const seed = getDailyChallengeSeed(new Date(2026, 5, 20, 12));

  assert.equal(seed, "daily-2026-06-20");
});

test("a shared seed reproduces the initial apple placement", () => {
  const seed = "shared-seed-42";
  const firstState = createInitialState({ randomizer: createSeededRandomizer(seed) });
  const secondState = createInitialState({ randomizer: createSeededRandomizer(seed) });

  assert.deepEqual(firstState.apple, secondState.apple);
});

test("a shared seed reproduces future apple placement", () => {
  const seed = "shared-seed-future";
  const firstState = startGame(
    createInitialState({
      apple: { x: 10, y: 10 },
      randomizer: createSeededRandomizer(seed)
    })
  );
  const secondState = startGame(
    createInitialState({
      apple: { x: 10, y: 10 },
      randomizer: createSeededRandomizer(seed)
    })
  );

  const firstNextState = stepState(firstState);
  const secondNextState = stepState(secondState);

  assert.equal(firstNextState.score, 1);
  assert.deepEqual(firstNextState.apple, secondNextState.apple);
});
