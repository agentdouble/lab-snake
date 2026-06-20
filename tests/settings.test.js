import assert from "node:assert/strict";
import test from "node:test";

import {
  COLOR_THEMES,
  DEFAULT_GAME_SETTINGS,
  MAP_OPTIONS,
  SPEED_OPTIONS,
  getColorTheme,
  getMapOption,
  getSpeedOption,
  normalizeSettings
} from "../src/settings.js";

test("settings options expose clear labels for speed and theme controls", () => {
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
  assert.deepEqual(
    normalizeSettings({ speed: "turbo", color: "unknown", map: "missing", snakeColor: "missing" }),
    DEFAULT_GAME_SETTINGS
  );
  assert.equal(getSpeedOption("fast").multiplier, 1.25);
  assert.equal(getSpeedOption("expert").multiplier, 1.5);
  assert.equal(getColorTheme("mint").colors.apple, "#ff6b6b");
  assert.equal(getMapOption("wide").summary, "24 x 16");
});

test("settings normalization accepts snake color persistence choices", () => {
  assert.deepEqual(normalizeSettings({
    speed: "slow",
    color: "neon",
    map: "wide",
    snakeColor: "cyan",
    keepSnakeColorOnRestart: false
  }), {
    speed: "slow",
    color: "neon",
    map: "wide",
    snakeColor: "cyan",
    keepSnakeColorOnRestart: false
  });
});
