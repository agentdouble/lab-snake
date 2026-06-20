import assert from "node:assert/strict";
import test from "node:test";

import {
  COLOR_THEMES,
  GAME_MODES,
  SPEED_OPTIONS,
  getColorTheme,
  getEffectiveSpeedOption,
  getGameMode,
  getSpeedOption,
  isSpeedLockedByMode,
  normalizeSettings
} from "../src/settings.js";

test("settings options expose clear labels for speed and color controls", () => {
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
});

test("settings normalization falls back to the default choices", () => {
  assert.deepEqual(
    normalizeSettings({ mode: "arcade", speed: "turbo", color: "unknown" }),
    {
      mode: "standard",
      speed: "normal",
      color: "classic"
    }
  );
  assert.equal(getGameMode("quick").label, "Mode rapide");
  assert.equal(getSpeedOption("fast").multiplier, 1.25);
  assert.equal(getSpeedOption("expert").multiplier, 1.5);
  assert.equal(getColorTheme("mint").colors.snakeBody, "#5ee6a8");
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
