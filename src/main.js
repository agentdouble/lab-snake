import { DIRECTIONS, STATUS } from "./constants.js";
import {
  createInitialState,
  getGameMode,
  getSpeedLevel,
  getSpeedMultiplier,
  getTickDelay,
  isSpeedLockedByMode,
  pauseGame,
  queueDirection,
  resetGame,
  setGameMode,
  setSpeedLevel,
  startGame,
  stepState
} from "./engine.js";
import { bindKeyboard, bindTouch } from "./input.js";
import { createRenderer } from "./renderer.js";
import { loadBestScore, saveBestScore } from "./storage.js";

const canvas = document.querySelector("#game-canvas");
const scoreValue = document.querySelector("#score-value");
const bestValue = document.querySelector("#best-value");
const speedValue = document.querySelector("#speed-value");
const modeValue = document.querySelector("#mode-value");
const statusLabel = document.querySelector("#status-label");
const playButton = document.querySelector("#play-button");
const pauseButton = document.querySelector("#pause-button");
const restartButton = document.querySelector("#restart-button");
const modeButtons = [...document.querySelectorAll("[data-mode-key]")];
const speedStripLabel = document.querySelector("#speed-strip-label");
const speedButtons = [...document.querySelectorAll("[data-speed-key]")];
const render = createRenderer(canvas);

let state = createInitialState({ bestScore: loadBestScore() });
let loopTimer = null;

function setState(nextState, options = {}) {
  state = nextState;

  if (options.persistBestScore) {
    saveBestScore(state.bestScore);
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

  loopTimer = window.setTimeout(runTick, getTickDelay(state.score, state.speedKey));
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
  setState(resetGame(state));
  canvas.focus();
}

function chooseSpeed(speedKey) {
  if (state.status === STATUS.RUNNING || isSpeedLockedByMode(state.modeKey)) {
    return;
  }

  setState(setSpeedLevel(state, speedKey));
  canvas.focus();
}

function chooseMode(modeKey) {
  if (state.status === STATUS.RUNNING) {
    return;
  }

  setState(setGameMode(state, modeKey));
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
  const gameMode = getGameMode(state.modeKey);
  const speedLevel = getSpeedLevel(state.speedKey);
  const isSpeedLocked = isSpeedLockedByMode(state.modeKey);

  scoreValue.textContent = String(state.score);
  bestValue.textContent = String(state.bestScore);
  modeValue.textContent = gameMode.label;
  speedValue.textContent = `${speedLevel.label} ${getSpeedMultiplier(state.score, state.speedKey).toFixed(1)}x`;
  speedStripLabel.textContent = isSpeedLocked ? "Vitesse du mode" : "Vitesse manuelle";
  statusLabel.textContent = statusText(state.status);
  playButton.disabled = state.status === STATUS.RUNNING || state.status === STATUS.GAME_OVER || state.status === STATUS.WON;
  pauseButton.disabled = state.status !== STATUS.RUNNING;

  modeButtons.forEach((button) => {
    const isSelected = button.dataset.modeKey === state.modeKey;

    button.disabled = state.status === STATUS.RUNNING;
    button.setAttribute("aria-pressed", String(isSelected));
    button.classList.toggle("selected", isSelected);
  });

  speedButtons.forEach((button) => {
    const isSelected = button.dataset.speedKey === state.speedKey;

    button.disabled = state.status === STATUS.RUNNING || isSpeedLocked;
    button.setAttribute("aria-pressed", String(isSelected));
    button.classList.toggle("selected", isSelected);
  });
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

modeButtons.forEach((button) => {
  button.addEventListener("click", () => chooseMode(button.dataset.modeKey));
});

speedButtons.forEach((button) => {
  button.addEventListener("click", () => chooseSpeed(button.dataset.speedKey));
});

bindKeyboard(handleDirection);
bindTouch(canvas, handleDirection);

window.addEventListener("blur", () => {
  if (state.status === STATUS.RUNNING) {
    pause();
  }
});

window.addEventListener("resize", () => render(state));

setState(queueDirection(state, DIRECTIONS.RIGHT));
