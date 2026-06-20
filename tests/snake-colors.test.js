import assert from "node:assert/strict";
import test from "node:test";

import {
  DEFAULT_SNAKE_COLOR_ID,
  SNAKE_COLOR_OPTIONS,
  getDefaultSnakeColor,
  getSnakeColor,
  normalizeSnakeColorId
} from "../src/snake-colors.js";

test("snake color ids are normalized to a valid option", () => {
  assert.equal(normalizeSnakeColorId("cyan"), "cyan");
  assert.equal(normalizeSnakeColorId("unknown"), DEFAULT_SNAKE_COLOR_ID);
  assert.equal(getSnakeColor("missing"), getDefaultSnakeColor());
});

test("snake color options are unique readable colors", () => {
  const ids = new Set();
  const appleColor = "#ef476f";
  const boardColor = "#111714";

  for (const option of SNAKE_COLOR_OPTIONS) {
    assert.match(option.id, /^[a-z]+$/);
    assert.match(option.fill, /^#[0-9a-f]{6}$/i);
    assert.match(option.accent, /^#[0-9a-f]{6}$/i);
    assert.ok(!ids.has(option.id), `duplicate color id: ${option.id}`);
    assert.notEqual(option.fill.toLowerCase(), appleColor);
    assert.notEqual(option.fill.toLowerCase(), boardColor);
    ids.add(option.id);
  }
});
