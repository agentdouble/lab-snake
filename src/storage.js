import { normalizeSettings } from "./settings.js";

const BEST_SCORE_KEY = "snake.bestScore";
const CHALLENGE_BEST_SCORE_PREFIX = "snake.challengeBestScore.";
const SETTINGS_KEY = "snake.settings";

export function loadBestScore() {
  return loadStoredScore(BEST_SCORE_KEY);
}

export function saveBestScore(bestScore) {
  saveStoredScore(BEST_SCORE_KEY, bestScore);
}

export function loadChallengeBestScore(seed) {
  return loadStoredScore(challengeBestScoreKey(seed));
}

export function saveChallengeBestScore(seed, bestScore) {
  saveStoredScore(challengeBestScoreKey(seed), bestScore);
}

export function loadSettings() {
  const value = window.localStorage.getItem(SETTINGS_KEY);

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
  window.localStorage.setItem(SETTINGS_KEY, JSON.stringify(normalizeSettings(settings)));
}

function loadStoredScore(key) {
  const value = window.localStorage.getItem(key);
  const parsedValue = Number.parseInt(value ?? "0", 10);

  return Number.isFinite(parsedValue) ? parsedValue : 0;
}

function saveStoredScore(key, bestScore) {
  window.localStorage.setItem(key, String(bestScore));
}

function challengeBestScoreKey(seed) {
  return `${CHALLENGE_BEST_SCORE_PREFIX}${encodeURIComponent(seed)}`;
}
