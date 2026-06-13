import assert from "node:assert/strict";
import test from "node:test";

import { STATUS } from "../src/constants.js";
import { createRenderer } from "../src/renderer.js";

test("the renderer applies the selected color to every snake segment", () => {
  const { canvas, fills } = createCanvasSpy();
  const render = createRenderer(canvas);

  render(
    {
      snake: [
        { x: 2, y: 2 },
        { x: 1, y: 2 },
        { x: 0, y: 2 }
      ],
      apple: null,
      status: STATUS.RUNNING
    },
    { snakeColorId: "violet" }
  );

  const snakeFills = fills.filter((fill) => fill.shape === "roundRect");

  assert.deepEqual(
    snakeFills.map((fill) => fill.color),
    ["#b8a1ff", "#b8a1ff", "#b8a1ff"]
  );
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
