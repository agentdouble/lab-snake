import assert from "node:assert/strict";
import test from "node:test";

import { STATUS } from "../src/constants.js";
import { createRenderer, SNAKE_RAINBOW_COLORS } from "../src/renderer.js";

test("renders every snake segment with rainbow colors", () => {
  const { canvas, fills } = createCanvasProbe();
  const render = createRenderer(canvas);
  const snake = SNAKE_RAINBOW_COLORS.map((_, index) => ({ x: index, y: 3 }));

  render({
    snake,
    apple: { x: 10, y: 10 },
    status: STATUS.RUNNING
  });

  const segmentFills = fills.filter((fill) => fill.shape === "roundRect");

  assert.equal(segmentFills.length, snake.length);
  assert.deepEqual(
    segmentFills.map((fill) => fill.color),
    SNAKE_RAINBOW_COLORS
  );
});

test("renders the apple after the snake so rainbow segments do not cover it", () => {
  const { canvas, fills } = createCanvasProbe();
  const render = createRenderer(canvas);

  render({
    snake: [{ x: 5, y: 5 }],
    apple: { x: 5, y: 5 },
    status: STATUS.RUNNING
  });

  const snakeFillIndex = fills.findIndex((fill) => fill.shape === "roundRect");
  const appleFillIndex = fills.findIndex((fill) => fill.shape === "arc");

  assert.ok(snakeFillIndex >= 0);
  assert.ok(appleFillIndex > snakeFillIndex);
});

function createCanvasProbe() {
  const fills = [];
  let currentFillStyle = "";
  let currentPath = null;

  const context = {
    get fillStyle() {
      return currentFillStyle;
    },
    set fillStyle(value) {
      currentFillStyle = value;
    },
    clearRect() {},
    fillRect(x, y, width, height) {
      fills.push({
        shape: "rect",
        color: currentFillStyle,
        x,
        y,
        width,
        height
      });
    },
    beginPath() {
      currentPath = null;
    },
    moveTo() {},
    lineTo() {},
    stroke() {},
    fillText() {},
    arc(x, y, radius) {
      currentPath = {
        shape: "arc",
        x,
        y,
        radius
      };
    },
    roundRect(x, y, width, height, radius) {
      currentPath = {
        shape: "roundRect",
        x,
        y,
        width,
        height,
        radius
      };
    },
    fill() {
      fills.push({
        ...(currentPath ?? { shape: "path" }),
        color: currentFillStyle
      });
    }
  };

  return {
    canvas: {
      getContext() {
        return context;
      }
    },
    fills
  };
}
