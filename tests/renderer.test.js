import assert from "node:assert/strict";
import test from "node:test";

import { STATUS } from "../src/constants.js";
import { getMapDefinition } from "../src/maps.js";
import { createRenderer } from "../src/renderer.js";

test("the renderer applies the selected snake color to snake segments", () => {
  const { canvas, fills } = createCanvasSpy();
  const render = createRenderer(canvas);
  const map = getMapDefinition("classic");

  render(
    {
      map,
      snake: [
        { x: 2, y: 2 },
        { x: 1, y: 2 },
        { x: 0, y: 2 }
      ],
      apple: null,
      status: STATUS.RUNNING
    },
    { color: "mint", snakeColor: "cyan" }
  );

  const snakeFills = fills.filter((fill) => fill.shape === "roundRect");

  assert.deepEqual(
    snakeFills.map((fill) => fill.color),
    ["#4cc9f0", "#176b84", "#4cc9f0", "#4cc9f0"]
  );
});

test("the renderer draws map obstacles as wall cells", () => {
  const { canvas, fills } = createCanvasSpy();
  const render = createRenderer(canvas);
  const map = getMapDefinition("canyon");

  render(
    {
      map,
      snake: map.startSnake,
      apple: null,
      status: STATUS.RUNNING
    },
    { color: "classic" }
  );

  const wallFills = fills.filter((fill) => fill.shape === "roundRect" && fill.color === "#7b8490");

  assert.equal(wallFills.length, map.obstacles.length);
});

function createCanvasSpy() {
  const fills = [];
  const context = {
    fillStyle: "",
    strokeStyle: "",
    lineWidth: 1,
    activeShape: null,
    clearRect() {},
    fillRect() {
      fills.push({ shape: "rect", color: this.fillStyle });
    },
    beginPath() {
      this.activeShape = null;
    },
    moveTo() {},
    lineTo() {},
    arc() {
      this.activeShape = "arc";
    },
    roundRect() {
      this.activeShape = "roundRect";
    },
    fill() {
      fills.push({ shape: this.activeShape, color: this.fillStyle });
    },
    stroke() {},
    fillText() {}
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
