import assert from "node:assert/strict";
import test from "node:test";

import {
  COLOR_THEMES,
  SPEED_OPTIONS,
  getColorTheme,
  getSpeedOption,
  normalizeSettings
} from "../src/settings.js";

test("settings options expose clear labels for speed and color controls", () => {
  assert.deepEqual(
    SPEED_OPTIONS.map((option) => option.label),
    ["Lente", "Normale", "Rapide"]
  );
  assert.deepEqual(
    COLOR_THEMES.map((theme) => theme.label),
    ["Classique", "Menthe", "Neon"]
  );
});

test("settings normalization falls back to the default choices", () => {
  assert.deepEqual(normalizeSettings({ speed: "turbo", color: "unknown" }), {
    speed: "normal",
    color: "classic"
  });
  assert.equal(getSpeedOption("fast").multiplier, 1.25);
  assert.equal(getColorTheme("mint").colors.snakeBody, "#5ee6a8");
});
