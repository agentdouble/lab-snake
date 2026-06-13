import { DIRECTIONS, PLAYER_IDS } from "./constants.js";

const KEY_BINDINGS = new Map([
  ["ArrowUp", { playerId: PLAYER_IDS.ONE, direction: DIRECTIONS.UP }],
  ["ArrowDown", { playerId: PLAYER_IDS.ONE, direction: DIRECTIONS.DOWN }],
  ["ArrowLeft", { playerId: PLAYER_IDS.ONE, direction: DIRECTIONS.LEFT }],
  ["ArrowRight", { playerId: PLAYER_IDS.ONE, direction: DIRECTIONS.RIGHT }],
  ["w", { playerId: PLAYER_IDS.TWO, direction: DIRECTIONS.UP }],
  ["W", { playerId: PLAYER_IDS.TWO, direction: DIRECTIONS.UP }],
  ["z", { playerId: PLAYER_IDS.TWO, direction: DIRECTIONS.UP }],
  ["Z", { playerId: PLAYER_IDS.TWO, direction: DIRECTIONS.UP }],
  ["s", { playerId: PLAYER_IDS.TWO, direction: DIRECTIONS.DOWN }],
  ["S", { playerId: PLAYER_IDS.TWO, direction: DIRECTIONS.DOWN }],
  ["a", { playerId: PLAYER_IDS.TWO, direction: DIRECTIONS.LEFT }],
  ["A", { playerId: PLAYER_IDS.TWO, direction: DIRECTIONS.LEFT }],
  ["q", { playerId: PLAYER_IDS.TWO, direction: DIRECTIONS.LEFT }],
  ["Q", { playerId: PLAYER_IDS.TWO, direction: DIRECTIONS.LEFT }],
  ["d", { playerId: PLAYER_IDS.TWO, direction: DIRECTIONS.RIGHT }],
  ["D", { playerId: PLAYER_IDS.TWO, direction: DIRECTIONS.RIGHT }]
]);

const SWIPE_THRESHOLD_PX = 24;

export function bindKeyboard(onDirection) {
  window.addEventListener("keydown", (event) => {
    const binding = KEY_BINDINGS.get(event.key);

    if (!binding) {
      return;
    }

    event.preventDefault();
    onDirection(binding.direction, binding.playerId);
  });
}

export function bindTouch(target, onDirection) {
  let startPoint = null;

  target.addEventListener("pointerdown", (event) => {
    startPoint = {
      x: event.clientX,
      y: event.clientY
    };
    target.setPointerCapture(event.pointerId);
  });

  target.addEventListener("pointerup", (event) => {
    if (!startPoint) {
      return;
    }

    const deltaX = event.clientX - startPoint.x;
    const deltaY = event.clientY - startPoint.y;
    startPoint = null;

    if (Math.max(Math.abs(deltaX), Math.abs(deltaY)) < SWIPE_THRESHOLD_PX) {
      return;
    }

    if (Math.abs(deltaX) > Math.abs(deltaY)) {
      onDirection(deltaX > 0 ? DIRECTIONS.RIGHT : DIRECTIONS.LEFT, PLAYER_IDS.ONE);
      return;
    }

    onDirection(deltaY > 0 ? DIRECTIONS.DOWN : DIRECTIONS.UP, PLAYER_IDS.ONE);
  });
}
