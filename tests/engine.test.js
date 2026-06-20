import assert from "node:assert/strict";
import test from "node:test";

import { DIRECTIONS, STATUS } from "../src/constants.js";
import {
  createInitialState,
  getTickDelay,
  isValidMapCell,
  queueDirection,
  randomFreeCell,
  startGame,
  stepState
} from "../src/engine.js";
import { getMapDefinition } from "../src/maps.js";

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

test("a selected map changes the board dimensions and starting cells", () => {
  const state = createInitialState({ mapId: "wide", randomizer: () => 0 });

  assert.equal(state.map.width, 24);
  assert.equal(state.map.height, 16);
  assert.deepEqual(state.snake[0], { x: 11, y: 8 });
  assert.equal(isValidMapCell(state.apple, state.map), true);
});

test("map obstacle collision ends the game", () => {
  const state = startGame(
    createInitialState({
      mapId: "canyon",
      snake: [{ x: 5, y: 5 }],
      apple: { x: 0, y: 0 },
      direction: DIRECTIONS.RIGHT
    })
  );

  const nextState = stepState(state);

  assert.equal(nextState.status, STATUS.GAME_OVER);
});

test("random apples avoid occupied cells and map obstacles", () => {
  const map = getMapDefinition("canyon");
  const target = { x: 7, y: 2 };
  const occupiedCells = allCells(map).filter((cell) => {
    return !sameCell(cell, target) && isValidMapCell(cell, map);
  });

  const apple = randomFreeCell(occupiedCells, () => 0.99, map);

  assert.deepEqual(apple, target);
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

function allCells(map) {
  const cells = [];

  for (let y = 0; y < map.height; y += 1) {
    for (let x = 0; x < map.width; x += 1) {
      cells.push({ x, y });
    }
  }

  return cells;
}

function sameCell(first, second) {
  return first.x === second.x && first.y === second.y;
}
