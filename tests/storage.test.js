import assert from "node:assert/strict";
import test from "node:test";

import { loadBestScore, saveBestScore, scoreContextKey, STORAGE_KEYS } from "../src/storage.js";

test("legacy global best score is ignored for segmented scores", () => {
  const localStorage = createLocalStorage();
  globalThis.window = { localStorage };
  localStorage.setItem(STORAGE_KEYS.legacyBestScore, "12");

  assert.equal(loadBestScore({ map: "classic", mode: "standard", speed: "normal" }), 0);
});

test("best scores are saved separately for map mode and effective speed context", () => {
  const localStorage = createLocalStorage();
  globalThis.window = { localStorage };
  const normalContext = { map: "classic", mode: "standard", speed: "normal" };
  const fastContext = { map: "classic", mode: "standard", speed: "fast" };
  const canyonQuickContext = { map: "canyon", mode: "quick", speed: "slow" };

  saveBestScore(normalContext, 4);
  saveBestScore(fastContext, 8);
  saveBestScore(canyonQuickContext, 3);
  saveBestScore(normalContext, 2);

  assert.equal(loadBestScore(normalContext), 4);
  assert.equal(loadBestScore(fastContext), 8);
  assert.equal(loadBestScore(canyonQuickContext), 3);

  const storedScores = JSON.parse(localStorage.getItem(STORAGE_KEYS.bestScoreSegments));
  assert.deepEqual(storedScores, {
    [scoreContextKey(normalContext)]: 4,
    [scoreContextKey(fastContext)]: 8,
    [scoreContextKey(canyonQuickContext)]: 3
  });
});

test("quick mode stores scores under its locked fast speed", () => {
  const localStorage = createLocalStorage();
  globalThis.window = { localStorage };
  const quickSlowContext = { map: "classic", mode: "quick", speed: "slow" };
  const quickFastContext = { map: "classic", mode: "quick", speed: "fast" };

  saveBestScore(quickSlowContext, 5);

  assert.equal(scoreContextKey(quickSlowContext), scoreContextKey(quickFastContext));
  assert.equal(loadBestScore(quickFastContext), 5);
});

test("invalid segmented score data is ignored cleanly", () => {
  const localStorage = createLocalStorage();
  globalThis.window = { localStorage };
  localStorage.setItem(STORAGE_KEYS.bestScoreSegments, "{bad-json");

  assert.equal(loadBestScore({ map: "classic", mode: "standard", speed: "normal" }), 0);
});

function createLocalStorage() {
  const store = new Map();

  return {
    getItem(key) {
      return store.has(key) ? store.get(key) : null;
    },
    setItem(key, value) {
      store.set(key, String(value));
    }
  };
}
