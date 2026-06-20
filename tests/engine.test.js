import assert from "node:assert/strict";
import test from "node:test";

import { DIRECTIONS, STATUS } from "../src/constants.js";
import {
  createInitialState,
  getTickDelay,
  pauseGame,
  queueDirection,
  resumeGame,
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

test("a paused game does not advance snake, apples, score, or collisions", () => {
  const runningState = startGame(
    createInitialState({
      apple: { x: 10, y: 10 }
    })
  );
  const pausedState = pauseGame(runningState);

  const nextState = stepState(pausedState, () => 0);

  assert.strictEqual(nextState, pausedState);
  assert.equal(nextState.status, STATUS.PAUSED);
  assert.equal(nextState.score, 0);
  assert.equal(nextState.ticks, 0);
  assert.deepEqual(nextState.snake, runningState.snake);
  assert.deepEqual(nextState.apple, { x: 10, y: 10 });
});

test("resuming keeps the snake position, direction, score, and speed state", () => {
  const runningState = stepState(
    startGame(
      createInitialState({
        apple: { x: 10, y: 10 }
      })
    ),
    () => 0.25
  );
  const pausedState = pauseGame(runningState);

  const resumedState = resumeGame(pausedState);

  assert.equal(resumedState.status, STATUS.RUNNING);
  assert.deepEqual(resumedState.snake, runningState.snake);
  assert.deepEqual(resumedState.direction, runningState.direction);
  assert.equal(resumedState.score, runningState.score);
  assert.equal(getTickDelay(resumedState.score), getTickDelay(runningState.score));
  assert.equal(getTickDelay(resumedState.score, 1.5), getTickDelay(runningState.score, 1.5));
  assert.equal(resumedState.ticks, runningState.ticks);
});

test("self collision ends the game", () => {
  const state = startGame(
    createInitialState({
      snake: [
        { x: 5, y: 5 },
        { x: 5, y: 6 },
        { x: 4, y: 6 },
        { x: 4, y: 5 },
        { x: 4, y: 4 }
      ],
      apple: { x: 0, y: 0 },
      direction: DIRECTIONS.DOWN
    })
  );

  const nextState = stepState(state);

  assert.equal(nextState.status, STATUS.GAME_OVER);
  assert.equal(nextState.ticks, 1);
  assert.deepEqual(nextState.snake, state.snake);
});

test("the game accelerates without passing the minimum delay", () => {
  assert.equal(getTickDelay(0), 145);
  assert.equal(getTickDelay(10), 95);
  assert.equal(getTickDelay(1000), 62);
});

test("the game speed multiplier changes tick delay without dropping below the minimum", () => {
  assert.equal(getTickDelay(0, 1.25), 116);
  assert.equal(getTickDelay(0, 1.5), 97);
  assert.equal(getTickDelay(10, 0.8), 119);
  assert.equal(getTickDelay(1000, 1.5), 62);
  assert.equal(getTickDelay(0, 0), 145);
});
