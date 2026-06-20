import assert from "node:assert/strict";
import test from "node:test";

import {
  COLOR_THEMES,
  MAP_OPTIONS,
  SPEED_OPTIONS,
  getColorTheme,
  getMapOption,
  getSpeedOption,
  normalizeSettings
} from "../src/settings.js";

test("settings options expose clear labels for speed and color controls", () => {
  assert.deepEqual(
    SPEED_OPTIONS.map((option) => option.label),
    ["Lente", "Normale", "Rapide", "Expert"]
  );
  assert.deepEqual(
    COLOR_THEMES.map((theme) => theme.label),
    ["Classique", "Menthe", "Neon"]
  );
  assert.deepEqual(
    MAP_OPTIONS.map((map) => map.label),
    ["Classique", "Canyon", "Etendue"]
  );
});

test("settings normalization falls back to the default choices", () => {
  assert.deepEqual(normalizeSettings({ speed: "turbo", color: "unknown", map: "missing" }), {
    speed: "normal",
    color: "classic",
    map: "classic"
  });
  assert.equal(getSpeedOption("fast").multiplier, 1.25);
  assert.equal(getSpeedOption("expert").multiplier, 1.5);
  assert.equal(getColorTheme("mint").colors.snakeBody, "#5ee6a8");
  assert.equal(getMapOption("wide").summary, "24 x 16");
});
