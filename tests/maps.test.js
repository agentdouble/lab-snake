import assert from "node:assert/strict";
import test from "node:test";

import { isValidMapCell } from "../src/engine.js";
import { DEFAULT_MAP_ID, getMapDefinition, MAPS } from "../src/maps.js";

test("map definitions are distinct and playable", () => {
  const signatures = new Set();

  MAPS.forEach((map) => {
    assert.equal(getMapDefinition(map.id), map);
    assert.ok(map.width > 0);
    assert.ok(map.height > 0);
    assert.ok(map.startSnake.length > 0);
    assert.ok(map.startSnake.every((cell) => isValidMapCell(cell, map)));
    assert.ok(map.obstacles.every((cell) => cell.x >= 0 && cell.y >= 0));
    assert.ok(map.obstacles.every((cell) => cell.x < map.width && cell.y < map.height));

    signatures.add(`${map.width}x${map.height}:${map.obstacles.length}`);
  });

  assert.equal(signatures.size, MAPS.length);
});

test("invalid map ids fall back to the default map", () => {
  assert.equal(getMapDefinition("missing").id, DEFAULT_MAP_ID);
  assert.equal(getMapDefinition(null).id, DEFAULT_MAP_ID);
});
