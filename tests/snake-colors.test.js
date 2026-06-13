import assert from "node:assert/strict";
import test from "node:test";

import { DEFAULT_SNAKE_COLOR_ID, getSnakeColorOption, SNAKE_COLORS } from "../src/snake-colors.js";

test("the snake color palette exposes readable non-food colors", () => {
  assert.ok(SNAKE_COLORS.length >= 4);
  assert.equal(new Set(SNAKE_COLORS.map((color) => color.id)).size, SNAKE_COLORS.length);
  assert.equal(SNAKE_COLORS.some((color) => color.value === "#ef476f"), false);
  assert.equal(SNAKE_COLORS.some((color) => color.value === "#ffd166"), false);
});

test("invalid snake colors fall back to the default option", () => {
  assert.equal(getSnakeColorOption("missing").id, DEFAULT_SNAKE_COLOR_ID);
  assert.equal(getSnakeColorOption(null).id, DEFAULT_SNAKE_COLOR_ID);
});
