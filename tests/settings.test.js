import assert from "node:assert/strict";
import test from "node:test";

import {
  COLOR_THEMES,
  DEFAULT_GAME_SETTINGS,
  GAME_MODES,
  MAP_OPTIONS,
  SPEED_OPTIONS,
  getColorTheme,
  getEffectiveSpeedOption,
  getGameMode,
  getMapOption,
  getSpeedOption,
  isSpeedLockedByMode,
  normalizeSettings
} from "../src/settings.js";

test("settings options expose clear labels for speed and theme controls", () => {
  assert.deepEqual(
    GAME_MODES.map((mode) => mode.label),
    ["Standard", "Mode rapide"]
  );
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
    normalizeSettings({
      mode: "arcade",
      speed: "turbo",
      color: "unknown",
      showGrid: "yes",
      map: "missing",
      snakeColor: "missing"
    }),
    DEFAULT_GAME_SETTINGS
  );
  assert.equal(getGameMode("quick").label, "Mode rapide");
  assert.equal(getSpeedOption("fast").multiplier, 1.25);
  assert.equal(getSpeedOption("expert").multiplier, 1.5);
  assert.equal(getColorTheme("mint").colors.apple, "#ff6b6b");
  assert.equal(getMapOption("wide").summary, "24 x 16");
});

test("settings normalization accepts snake color persistence choices", () => {
  assert.deepEqual(normalizeSettings({
    speed: "slow",
    color: "neon",
    showGrid: false,
    map: "wide",
    snakeColor: "cyan",
    keepSnakeColorOnRestart: false
  }), {
    mode: "standard",
    speed: "slow",
    color: "neon",
    showGrid: false,
    map: "wide",
    snakeColor: "cyan",
    keepSnakeColorOnRestart: false
  });
});

test("quick mode locks the effective speed without replacing the manual setting", () => {
  const settings = normalizeSettings({
    mode: "quick",
    speed: "slow",
    color: "classic"
  });

  assert.equal(settings.speed, "slow");
  assert.equal(isSpeedLockedByMode(settings.mode), true);
  assert.equal(getEffectiveSpeedOption(settings).id, "fast");
  assert.ok(
    getEffectiveSpeedOption(settings).multiplier > getSpeedOption(settings.speed).multiplier
  );
});

test("standard mode uses the saved manual speed option", () => {
  const settings = normalizeSettings({
    mode: "standard",
    speed: "expert",
    color: "classic"
  });

  assert.equal(isSpeedLockedByMode(settings.mode), false);
  assert.equal(getEffectiveSpeedOption(settings).id, "expert");
});
