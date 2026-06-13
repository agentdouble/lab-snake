import assert from "node:assert/strict";
import test from "node:test";

import { DIRECTIONS, STATUS } from "../src/constants.js";
import {
  createInitialState,
  getTickDelay,
  queueDirection,
  resetGame,
  setSpeedLevel,
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

test("a faster speed level shortens the movement delay", () => {
  assert.equal(getTickDelay(0, "fast"), 112);
  assert.equal(getTickDelay(0, "turbo"), 91);
  assert.ok(getTickDelay(5, "turbo") < getTickDelay(5, "normal"));
  assert.equal(getTickDelay(1000, "turbo"), 62);
});

test("restart preserves the selected speed level", () => {
  let state = createInitialState();

  state = setSpeedLevel(state, "turbo");
  const restartedState = resetGame(state);

  assert.equal(restartedState.speedKey, "turbo");
  assert.equal(restartedState.score, 0);
  assert.equal(restartedState.status, STATUS.READY);
});
