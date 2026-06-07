export const GRID_SIZE = 20;
export const CANVAS_SIZE = 480;
export const START_DELAY_MS = 145;
export const MIN_DELAY_MS = 62;
export const DELAY_STEP_MS = 5;

export const STATUS = Object.freeze({
  READY: "ready",
  RUNNING: "running",
  PAUSED: "paused",
  GAME_OVER: "gameover",
  WON: "won"
});

export const DIRECTIONS = Object.freeze({
  UP: Object.freeze({ x: 0, y: -1, name: "up" }),
  DOWN: Object.freeze({ x: 0, y: 1, name: "down" }),
  LEFT: Object.freeze({ x: -1, y: 0, name: "left" }),
  RIGHT: Object.freeze({ x: 1, y: 0, name: "right" })
});
