import { DEFAULT_SNAKE_COLOR_ID, normalizeSnakeColorId } from "./snake-colors.js";

const BEST_SCORE_KEY = "snake.bestScore";
const SNAKE_COLOR_KEY = "snake.color";
const KEEP_SNAKE_COLOR_KEY = "snake.keepColorOnRestart";

export function loadBestScore() {
  const value = window.localStorage.getItem(BEST_SCORE_KEY);
  const parsedValue = Number.parseInt(value ?? "0", 10);

  return Number.isFinite(parsedValue) ? parsedValue : 0;
}

export function saveBestScore(bestScore) {
  window.localStorage.setItem(BEST_SCORE_KEY, String(bestScore));
}

export function loadSnakeColorId() {
  return normalizeSnakeColorId(window.localStorage.getItem(SNAKE_COLOR_KEY));
}

export function saveSnakeColorId(colorId) {
  window.localStorage.setItem(SNAKE_COLOR_KEY, normalizeSnakeColorId(colorId));
}

export function loadKeepSnakeColorOnRestart() {
  return window.localStorage.getItem(KEEP_SNAKE_COLOR_KEY) !== "false";
}

export function saveKeepSnakeColorOnRestart(keepColorOnRestart) {
  window.localStorage.setItem(KEEP_SNAKE_COLOR_KEY, keepColorOnRestart ? "true" : "false");

  if (!keepColorOnRestart) {
    saveSnakeColorId(DEFAULT_SNAKE_COLOR_ID);
  }
}
