import assert from "node:assert/strict";
import test from "node:test";

import { DIRECTIONS, STATUS } from "../src/constants.js";
import {
  createInitialState,
  getTickDelay,
  queueDirection,
  restoreState,
  startGame,
  stepState
} from "../src/engine.js";

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

test("a saved state can be restored without losing the existing best score", () => {
  const state = restoreState(
    {
      snake: [
        { x: 10, y: 10 },
        { x: 9, y: 10 },
        { x: 8, y: 10 },
        { x: 7, y: 10 }
      ],
      direction: "right",
      directionQueue: ["down"],
      apple: { x: 12, y: 12 },
      score: 1,
      bestScore: 4,
      status: STATUS.PAUSED,
      ticks: 9
    },
    { bestScore: 8 }
  );

  assert.deepEqual(state.snake[0], { x: 10, y: 10 });
  assert.equal(state.direction, DIRECTIONS.RIGHT);
  assert.deepEqual(state.directionQueue, [DIRECTIONS.DOWN]);
  assert.equal(state.score, 1);
  assert.equal(state.bestScore, 8);
  assert.equal(state.status, STATUS.PAUSED);
  assert.equal(state.ticks, 9);
});
