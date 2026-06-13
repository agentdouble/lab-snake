import { getSnakeColorOption } from "./snake-colors.js";

const BEST_SCORE_KEY = "snake.bestScore";
const SNAKE_COLOR_KEY = "snake.color";

export function loadBestScore() {
  const value = window.localStorage.getItem(BEST_SCORE_KEY);
  const parsedValue = Number.parseInt(value ?? "0", 10);

  return Number.isFinite(parsedValue) ? parsedValue : 0;
}

export function saveBestScore(bestScore) {
  window.localStorage.setItem(BEST_SCORE_KEY, String(bestScore));
}

export function loadSnakeColorId() {
  return getSnakeColorOption(window.localStorage.getItem(SNAKE_COLOR_KEY)).id;
}

export function saveSnakeColorId(colorId) {
  window.localStorage.setItem(SNAKE_COLOR_KEY, getSnakeColorOption(colorId).id);
}
