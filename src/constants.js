export const GRID_SIZE = 20;
export const CANVAS_SIZE = 480;
export const START_DELAY_MS = 145;
export const MIN_DELAY_MS = 62;
export const DELAY_STEP_MS = 5;

export const GAME_MAPS = Object.freeze([
  Object.freeze({
    id: "classic",
    label: "Classique",
    obstacles: Object.freeze([])
  }),
  Object.freeze({
    id: "islands",
    label: "Iles",
    obstacles: Object.freeze([
      Object.freeze({ x: 5, y: 5 }),
      Object.freeze({ x: 6, y: 5 }),
      Object.freeze({ x: 5, y: 6 }),
      Object.freeze({ x: 14, y: 5 }),
      Object.freeze({ x: 13, y: 5 }),
      Object.freeze({ x: 14, y: 6 }),
      Object.freeze({ x: 5, y: 14 }),
      Object.freeze({ x: 6, y: 14 }),
      Object.freeze({ x: 5, y: 13 }),
      Object.freeze({ x: 14, y: 14 }),
      Object.freeze({ x: 13, y: 14 }),
      Object.freeze({ x: 14, y: 13 })
    ])
  })
]);

export const GAME_MODES = Object.freeze([
  Object.freeze({
    id: "walls",
    label: "Murs",
    wrap: false
  }),
  Object.freeze({
    id: "wrap",
    label: "Libre",
    wrap: true
  })
]);

export const SPEED_PRESETS = Object.freeze([
  Object.freeze({
    id: "steady",
    label: "Detendu",
    startDelayMs: 180,
    minDelayMs: 80,
    delayStepMs: 4
  }),
  Object.freeze({
    id: "normal",
    label: "Normal",
    startDelayMs: START_DELAY_MS,
    minDelayMs: MIN_DELAY_MS,
    delayStepMs: DELAY_STEP_MS
  }),
  Object.freeze({
    id: "fast",
    label: "Rapide",
    startDelayMs: 100,
    minDelayMs: 48,
    delayStepMs: 6
  })
]);

export const DEFAULT_GAME_CONTEXT = Object.freeze({
  mapId: "classic",
  modeId: "walls",
  speedId: "normal"
});

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
