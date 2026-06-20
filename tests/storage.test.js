import assert from "node:assert/strict";
import test from "node:test";

import { scoreContextKey } from "../src/contexts.js";
import { loadBestScore, saveBestScore, STORAGE_KEYS } from "../src/storage.js";

test("legacy global best score is ignored for segmented scores", () => {
  const localStorage = createLocalStorage();
  globalThis.window = { localStorage };
  localStorage.setItem(STORAGE_KEYS.legacyBestScore, "12");

  assert.equal(loadBestScore({ mapId: "classic", modeId: "walls", speedId: "normal" }), 0);
});

test("best scores are saved separately for map mode and speed context", () => {
  const localStorage = createLocalStorage();
  globalThis.window = { localStorage };
  const normalContext = { mapId: "classic", modeId: "walls", speedId: "normal" };
  const fastContext = { mapId: "classic", modeId: "walls", speedId: "fast" };
  const islandContext = { mapId: "islands", modeId: "wrap", speedId: "fast" };

  saveBestScore(normalContext, 4);
  saveBestScore(fastContext, 8);
  saveBestScore(islandContext, 3);
  saveBestScore(normalContext, 2);

  assert.equal(loadBestScore(normalContext), 4);
  assert.equal(loadBestScore(fastContext), 8);
  assert.equal(loadBestScore(islandContext), 3);

  const storedScores = JSON.parse(localStorage.getItem(STORAGE_KEYS.bestScoreSegments));
  assert.deepEqual(storedScores, {
    [scoreContextKey(normalContext)]: 4,
    [scoreContextKey(fastContext)]: 8,
    [scoreContextKey(islandContext)]: 3
  });
});

test("invalid segmented score data is ignored cleanly", () => {
  const localStorage = createLocalStorage();
  globalThis.window = { localStorage };
  localStorage.setItem(STORAGE_KEYS.bestScoreSegments, "{bad-json");

  assert.equal(loadBestScore({ mapId: "classic", modeId: "walls", speedId: "normal" }), 0);
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
