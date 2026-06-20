import assert from "node:assert/strict";
import test from "node:test";

import { DIRECTIONS, QUICK_MODE_SPEED_KEY, STATUS } from "../src/constants.js";
import {
  createInitialState,
  getGameMode,
  getTickDelay,
  isSpeedLockedByMode,
  queueDirection,
  resetGame,
  setGameMode,
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

test("quick mode configures a faster game without manual speed changes", () => {
  let state = createInitialState();

  state = setGameMode(state, "quick");

  assert.equal(state.modeKey, "quick");
  assert.equal(getGameMode(state.modeKey).label, "Mode rapide");
  assert.equal(state.speedKey, QUICK_MODE_SPEED_KEY);
  assert.ok(isSpeedLockedByMode(state.modeKey));
  assert.ok(getTickDelay(0, state.speedKey) < getTickDelay(0, "normal"));
});

test("manual speed selection leaves quick mode to avoid conflicting settings", () => {
  let state = createInitialState({ modeKey: "quick" });

  state = setSpeedLevel(state, "turbo");

  assert.equal(state.modeKey, "standard");
  assert.equal(state.speedKey, "turbo");
  assert.equal(isSpeedLockedByMode(state.modeKey), false);
});

test("restart preserves quick mode and its locked speed", () => {
  const state = setGameMode(createInitialState(), "quick");
  const restartedState = resetGame(state);

  assert.equal(restartedState.modeKey, "quick");
  assert.equal(restartedState.speedKey, QUICK_MODE_SPEED_KEY);
  assert.equal(restartedState.score, 0);
  assert.equal(restartedState.status, STATUS.READY);
});
