import { DIRECTIONS } from "./constants.js";

const KEY_DIRECTIONS = new Map([
  ["ArrowUp", DIRECTIONS.UP],
  ["w", DIRECTIONS.UP],
  ["W", DIRECTIONS.UP],
  ["z", DIRECTIONS.UP],
  ["Z", DIRECTIONS.UP],
  ["ArrowDown", DIRECTIONS.DOWN],
  ["s", DIRECTIONS.DOWN],
  ["S", DIRECTIONS.DOWN],
  ["ArrowLeft", DIRECTIONS.LEFT],
  ["a", DIRECTIONS.LEFT],
  ["A", DIRECTIONS.LEFT],
  ["q", DIRECTIONS.LEFT],
  ["Q", DIRECTIONS.LEFT],
  ["ArrowRight", DIRECTIONS.RIGHT],
  ["d", DIRECTIONS.RIGHT],
  ["D", DIRECTIONS.RIGHT]
]);

const SWIPE_THRESHOLD_PX = 24;

export function bindKeyboard(onDirection, options = {}) {
  const { shouldIgnore = () => false } = options;

  window.addEventListener("keydown", (event) => {
    if (shouldIgnore(event) || isInteractiveTarget(event.target)) {
      return;
    }

    const direction = KEY_DIRECTIONS.get(event.key);

    if (!direction) {
      return;
    }

    event.preventDefault();
    onDirection(direction);
  });
}

function isInteractiveTarget(target) {
  return target instanceof HTMLElement && (
    target.isContentEditable ||
    ["INPUT", "SELECT", "TEXTAREA"].includes(target.tagName)
  );
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
      onDirection(deltaX > 0 ? DIRECTIONS.RIGHT : DIRECTIONS.LEFT);
      return;
    }

    onDirection(deltaY > 0 ? DIRECTIONS.DOWN : DIRECTIONS.UP);
  });
}
