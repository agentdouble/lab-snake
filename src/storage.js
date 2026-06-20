import { getEffectiveSpeedOption, normalizeSettings } from "./settings.js";

const SETTINGS_KEY = "snake.settings";

export const STORAGE_KEYS = Object.freeze({
  legacyBestScore: "snake.bestScore",
  bestScoreSegments: "snake.bestScores.v2"
});

// The legacy value was global, so v2 ignores it instead of guessing a context.
export function loadBestScore(settings) {
  const bestScores = loadBestScores();

  return bestScores[scoreContextKey(settings)] ?? 0;
}

export function saveBestScore(settings, bestScore) {
  const storage = getLocalStorage();

  if (!storage) {
    return 0;
  }

  const bestScores = loadBestScores();
  const key = scoreContextKey(settings);
  const previousBestScore = bestScores[key] ?? 0;
  const nextBestScore = Math.max(previousBestScore, sanitizeScore(bestScore));

  bestScores[key] = nextBestScore;
  storage.setItem(STORAGE_KEYS.bestScoreSegments, JSON.stringify(bestScores));

  return nextBestScore;
}

export function loadBestScores() {
  const storage = getLocalStorage();

  if (!storage) {
    return {};
  }

  const value = storage.getItem(STORAGE_KEYS.bestScoreSegments);

  if (!value) {
    return {};
  }

  try {
    const parsedValue = JSON.parse(value);

    if (!parsedValue || typeof parsedValue !== "object" || Array.isArray(parsedValue)) {
      return {};
    }

    return Object.fromEntries(
      Object.entries(parsedValue)
        .map(([key, score]) => [key, sanitizeScore(score)])
        .filter(([, score]) => score > 0)
    );
  } catch {
    return {};
  }
}

export function scoreContextKey(settings = {}) {
  const normalizedSettings = normalizeSettings(settings);
  const effectiveSpeed = getEffectiveSpeedOption(normalizedSettings);

  return `map=${normalizedSettings.map}|mode=${normalizedSettings.mode}|speed=${effectiveSpeed.id}`;
}

function sanitizeScore(value) {
  const parsedValue = Number.parseInt(value ?? "0", 10);

  return Number.isFinite(parsedValue) ? parsedValue : 0;
}

function getLocalStorage() {
  return globalThis.window?.localStorage ?? globalThis.localStorage ?? null;
}

export function loadSettings() {
  const storage = getLocalStorage();

  if (!storage) {
    return normalizeSettings();
  }

  const value = storage.getItem(SETTINGS_KEY);

  if (!value) {
    return normalizeSettings();
  }

  try {
    return normalizeSettings(JSON.parse(value));
  } catch {
    return normalizeSettings();
  }
}

export function saveSettings(settings) {
  const storage = getLocalStorage();

  if (!storage) {
    return;
  }

  storage.setItem(SETTINGS_KEY, JSON.stringify(normalizeSettings(settings)));
}
