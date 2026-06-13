import assert from "node:assert/strict";
import test from "node:test";

import { DIRECTIONS, GAME_MODES, PLAYER_IDS, STATUS } from "../src/constants.js";
import {
  createInitialState,
  getTickDelay,
  queueDirection,
  resetGame,
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

test("local multiplayer starts with two separate snakes", () => {
  const state = createInitialState({
    mode: GAME_MODES.LOCAL_MULTIPLAYER,
    randomizer: () => 0
  });

  assert.equal(state.players.length, 2);
  assert.equal(state.mode, GAME_MODES.LOCAL_MULTIPLAYER);
  assert.equal(state.players[0].id, PLAYER_IDS.ONE);
  assert.equal(state.players[1].id, PLAYER_IDS.TWO);
  assert.equal(state.score, 0);
  assert.ok(!state.players.flatMap((player) => player.snake).some((cell) => cell.x === state.apple.x && cell.y === state.apple.y));
});

test("local multiplayer queues directions for the addressed player", () => {
  let state = createInitialState({
    mode: GAME_MODES.LOCAL_MULTIPLAYER
  });

  state = queueDirection(state, DIRECTIONS.UP, PLAYER_IDS.TWO);

  assert.deepEqual(
    state.players[0].directionQueue.map((direction) => direction.name),
    []
  );
  assert.deepEqual(
    state.players[1].directionQueue.map((direction) => direction.name),
    ["up"]
  );
});

test("local multiplayer moves both snakes and scores only the eater", () => {
  const state = startGame(
    createInitialState({
      mode: GAME_MODES.LOCAL_MULTIPLAYER,
      players: [
        {
          id: PLAYER_IDS.ONE,
          snake: [
            { x: 4, y: 4 },
            { x: 3, y: 4 }
          ],
          direction: DIRECTIONS.RIGHT
        },
        {
          id: PLAYER_IDS.TWO,
          snake: [
            { x: 14, y: 14 },
            { x: 15, y: 14 }
          ],
          direction: DIRECTIONS.LEFT
        }
      ],
      apple: { x: 5, y: 4 }
    })
  );

  const nextState = stepState(state, () => 0);

  assert.equal(nextState.status, STATUS.RUNNING);
  assert.deepEqual(nextState.players[0].snake[0], { x: 5, y: 4 });
  assert.deepEqual(nextState.players[1].snake[0], { x: 13, y: 14 });
  assert.equal(nextState.players[0].score, 1);
  assert.equal(nextState.players[1].score, 0);
  assert.equal(nextState.score, 1);
});

test("local multiplayer snake collision ends the game", () => {
  const state = startGame(
    createInitialState({
      mode: GAME_MODES.LOCAL_MULTIPLAYER,
      players: [
        {
          id: PLAYER_IDS.ONE,
          snake: [
            { x: 5, y: 5 },
            { x: 4, y: 5 }
          ],
          direction: DIRECTIONS.RIGHT
        },
        {
          id: PLAYER_IDS.TWO,
          snake: [
            { x: 7, y: 5 },
            { x: 8, y: 5 }
          ],
          direction: DIRECTIONS.LEFT
        }
      ],
      apple: { x: 1, y: 1 }
    })
  );

  const nextState = stepState(state);

  assert.equal(nextState.status, STATUS.GAME_OVER);
  assert.equal(nextState.score, 0);
});

test("resetting local multiplayer restores both snakes and scores", () => {
  const runningState = startGame(
    createInitialState({
      mode: GAME_MODES.LOCAL_MULTIPLAYER,
      players: [
        {
          id: PLAYER_IDS.ONE,
          snake: [
            { x: 4, y: 4 },
            { x: 3, y: 4 }
          ],
          direction: DIRECTIONS.RIGHT
        },
        {
          id: PLAYER_IDS.TWO,
          snake: [
            { x: 14, y: 14 },
            { x: 15, y: 14 }
          ],
          direction: DIRECTIONS.LEFT
        }
      ],
      apple: { x: 5, y: 4 }
    })
  );
  const scoredState = stepState(runningState, () => 0);
  const resetState = resetGame(scoredState, { randomizer: () => 0 });
  const occupiedCells = resetState.players.flatMap((player) => player.snake);

  assert.equal(resetState.mode, GAME_MODES.LOCAL_MULTIPLAYER);
  assert.equal(resetState.status, STATUS.READY);
  assert.deepEqual(
    resetState.players.map((player) => player.score),
    [0, 0]
  );
  assert.equal(resetState.score, 0);
  assert.equal(resetState.players.length, 2);
  assert.ok(!occupiedCells.some((cell) => cell.x === resetState.apple.x && cell.y === resetState.apple.y));
});
