import { scoreContextKey } from "./contexts.js";

export const STORAGE_KEYS = Object.freeze({
  legacyBestScore: "snake.bestScore",
  bestScoreSegments: "snake.bestScores.v2"
});

// The legacy value was global, so v2 ignores it instead of guessing a context.
export function loadBestScore(context) {
  const bestScores = loadBestScores();

  return bestScores[scoreContextKey(context)] ?? 0;
}

export function saveBestScore(context, bestScore) {
  const storage = getLocalStorage();

  if (!storage) {
    return 0;
  }

  const bestScores = loadBestScores();
  const key = scoreContextKey(context);
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

function sanitizeScore(value) {
  const parsedValue = Number.parseInt(value ?? "0", 10);

  return Number.isFinite(parsedValue) ? parsedValue : 0;
}

function getLocalStorage() {
  return globalThis.window?.localStorage ?? globalThis.localStorage ?? null;
}
