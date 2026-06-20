const BEST_SCORE_KEY = "snake.bestScore";
const SETTINGS_KEY = "snake.settings";

export const DEFAULT_SETTINGS = Object.freeze({
  showGrid: true
});

export function loadBestScore() {
  const value = window.localStorage.getItem(BEST_SCORE_KEY);
  const parsedValue = Number.parseInt(value ?? "0", 10);

  return Number.isFinite(parsedValue) ? parsedValue : 0;
}

export function saveBestScore(bestScore) {
  window.localStorage.setItem(BEST_SCORE_KEY, String(bestScore));
}

export function loadSettings() {
  const value = window.localStorage.getItem(SETTINGS_KEY);

  if (!value) {
    return { ...DEFAULT_SETTINGS };
  }

  try {
    const parsedValue = JSON.parse(value);

    return normalizeSettings(parsedValue);
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

export function saveSettings(settings) {
  window.localStorage.setItem(SETTINGS_KEY, JSON.stringify(normalizeSettings(settings)));
}

function normalizeSettings(settings) {
  return {
    showGrid: typeof settings?.showGrid === "boolean" ? settings.showGrid : DEFAULT_SETTINGS.showGrid
  };
}
