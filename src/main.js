import { DIRECTIONS, START_DELAY_MS, STATUS } from "./constants.js";
import {
  createInitialState,
  getTickDelay,
  pauseGame,
  queueDirection,
  startGame,
  stepState
} from "./engine.js";
import { bindKeyboard, bindTouch } from "./input.js";
import { createRenderer } from "./renderer.js";
import { createSeededRandomizer, getDailyChallengeSeed, normalizeSeed } from "./seed.js";
import {
  loadBestScore,
  loadChallengeBestScore,
  saveBestScore,
  saveChallengeBestScore
} from "./storage.js";

const GAME_MODES = Object.freeze({
  CLASSIC: "classic",
  CHALLENGE: "challenge"
});

const canvas = document.querySelector("#game-canvas");
const scoreValue = document.querySelector("#score-value");
const bestLabel = document.querySelector("#best-label");
const bestValue = document.querySelector("#best-value");
const speedValue = document.querySelector("#speed-value");
const statusLabel = document.querySelector("#status-label");
const playButton = document.querySelector("#play-button");
const pauseButton = document.querySelector("#pause-button");
const restartButton = document.querySelector("#restart-button");
const classicModeButton = document.querySelector("#classic-mode-button");
const dailyChallengeButton = document.querySelector("#daily-challenge-button");
const challengeSeedInput = document.querySelector("#challenge-seed-input");
const seedChallengeButton = document.querySelector("#seed-challenge-button");
const copySeedButton = document.querySelector("#copy-seed-button");
const challengeNote = document.querySelector("#challenge-note");
const render = createRenderer(canvas);

let gameContext = readGameContextFromUrl();
let state = createGameState(gameContext);
let loopTimer = null;

function setState(nextState, options = {}) {
  state = nextState;

  if (options.persistBestScore) {
    saveCurrentBestScore();
  }

  render(state);
  updateHud();
}

function runTick() {
  loopTimer = null;

  if (state.status !== STATUS.RUNNING) {
    return;
  }

  setState(stepState(state), { persistBestScore: true });

  if (state.status === STATUS.RUNNING) {
    scheduleTick();
  }
}

function scheduleTick() {
  if (loopTimer || state.status !== STATUS.RUNNING) {
    return;
  }

  loopTimer = window.setTimeout(runTick, getTickDelay(state.score));
}

function clearTick() {
  if (!loopTimer) {
    return;
  }

  window.clearTimeout(loopTimer);
  loopTimer = null;
}

function play() {
  setState(startGame(state));
  scheduleTick();
  canvas.focus();
}

function pause() {
  setState(pauseGame(state));
  clearTick();
}

function restart() {
  clearTick();
  setState(createGameState(gameContext));
  canvas.focus();
}

function handleDirection(direction) {
  if (state.status === STATUS.READY || state.status === STATUS.PAUSED) {
    state = startGame(state);
  }

  setState(queueDirection(state, direction));
  scheduleTick();
}

function updateHud() {
  const challengeMode = isChallengeMode();

  scoreValue.textContent = String(state.score);
  bestLabel.textContent = challengeMode ? "Meilleur defi" : "Meilleur";
  bestValue.textContent = String(state.bestScore);
  speedValue.textContent = `${(START_DELAY_MS / getTickDelay(state.score)).toFixed(1)}x`;
  statusLabel.textContent = statusText(state.status);
  playButton.disabled = state.status === STATUS.RUNNING || state.status === STATUS.GAME_OVER || state.status === STATUS.WON;
  pauseButton.disabled = state.status !== STATUS.RUNNING;
  classicModeButton.setAttribute("aria-pressed", String(!challengeMode));
  dailyChallengeButton.setAttribute("aria-pressed", String(challengeMode && gameContext.seed === getDailyChallengeSeed()));
  copySeedButton.disabled = !challengeMode;
  challengeNote.textContent = challengeMode ? `Defi ${gameContext.seed}` : "Mode classique";
}

function createGameState(context) {
  if (context.mode !== GAME_MODES.CHALLENGE) {
    return createInitialState({ bestScore: loadBestScore() });
  }

  return createInitialState({
    bestScore: loadChallengeBestScore(context.seed),
    randomizer: createSeededRandomizer(context.seed)
  });
}

function saveCurrentBestScore() {
  if (isChallengeMode()) {
    saveChallengeBestScore(gameContext.seed, state.bestScore);
    return;
  }

  saveBestScore(state.bestScore);
}

function readGameContextFromUrl() {
  const params = new URLSearchParams(window.location.search);
  const seed = normalizeSeed(params.get("challenge"));

  if (!seed) {
    return { mode: GAME_MODES.CLASSIC };
  }

  return { mode: GAME_MODES.CHALLENGE, seed };
}

function switchToClassic() {
  replaceUrl(null);
  startContext({ mode: GAME_MODES.CLASSIC });
}

function startDailyChallenge() {
  const seed = getDailyChallengeSeed();
  replaceUrl(seed);
  startContext({ mode: GAME_MODES.CHALLENGE, seed });
}

function startSeedChallenge() {
  const seed = normalizeSeed(challengeSeedInput.value);

  if (!seed) {
    return;
  }

  replaceUrl(seed);
  startContext({ mode: GAME_MODES.CHALLENGE, seed });
}

function startContext(nextContext) {
  clearTick();
  gameContext = nextContext;
  syncChallengeSeedInput();
  setState(createGameState(gameContext));
  canvas.focus();
}

async function copyChallengeLink() {
  if (!isChallengeMode()) {
    return;
  }

  const shareUrl = buildChallengeUrl(gameContext.seed).toString();

  try {
    await navigator.clipboard.writeText(shareUrl);
    showTemporaryCopyLabel("Copie");
  } catch {
    challengeSeedInput.value = gameContext.seed;
    challengeSeedInput.select();
    showTemporaryCopyLabel("Selectionne");
  }
}

function showTemporaryCopyLabel(label) {
  const initialLabel = copySeedButton.textContent;
  copySeedButton.textContent = label;
  window.setTimeout(() => {
    copySeedButton.textContent = initialLabel;
  }, 1200);
}

function syncChallengeSeedInput() {
  challengeSeedInput.value = isChallengeMode() ? gameContext.seed : getDailyChallengeSeed();
}

function replaceUrl(seed) {
  const nextUrl = seed ? buildChallengeUrl(seed) : new URL(window.location.href);

  if (!seed) {
    nextUrl.searchParams.delete("challenge");
  }

  window.history.replaceState(null, "", nextUrl);
}

function buildChallengeUrl(seed) {
  const url = new URL(window.location.href);
  url.searchParams.set("challenge", seed);

  return url;
}

function isChallengeMode() {
  return gameContext.mode === GAME_MODES.CHALLENGE;
}

function statusText(status) {
  switch (status) {
    case STATUS.RUNNING:
      return "En jeu";
    case STATUS.PAUSED:
      return "Pause";
    case STATUS.GAME_OVER:
      return "Perdu";
    case STATUS.WON:
      return "Gagne";
    case STATUS.READY:
    default:
      return "Pret";
  }
}

playButton.addEventListener("click", play);
pauseButton.addEventListener("click", pause);
restartButton.addEventListener("click", restart);
classicModeButton.addEventListener("click", switchToClassic);
dailyChallengeButton.addEventListener("click", startDailyChallenge);
seedChallengeButton.addEventListener("click", startSeedChallenge);
copySeedButton.addEventListener("click", copyChallengeLink);
challengeSeedInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    startSeedChallenge();
  }
});

bindKeyboard(handleDirection);
bindTouch(canvas, handleDirection);

window.addEventListener("blur", () => {
  if (state.status === STATUS.RUNNING) {
    pause();
  }
});

window.addEventListener("resize", () => render(state));

syncChallengeSeedInput();
setState(queueDirection(state, DIRECTIONS.RIGHT));
