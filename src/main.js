import { DIRECTIONS, START_DELAY_MS, STATUS } from "./constants.js";
import {
  createInitialState,
  getTickDelay,
  pauseGame,
  queueDirection,
  resetGame,
  startGame,
  stepState
} from "./engine.js";
import { bindKeyboard, bindTouch } from "./input.js";
import { createRenderer } from "./renderer.js";
import { DEFAULT_SNAKE_COLOR_ID, SNAKE_COLOR_OPTIONS, normalizeSnakeColorId } from "./snake-colors.js";
import {
  loadBestScore,
  loadKeepSnakeColorOnRestart,
  loadSnakeColorId,
  saveBestScore,
  saveKeepSnakeColorOnRestart,
  saveSnakeColorId
} from "./storage.js";

const canvas = document.querySelector("#game-canvas");
const scoreValue = document.querySelector("#score-value");
const bestValue = document.querySelector("#best-value");
const speedValue = document.querySelector("#speed-value");
const statusLabel = document.querySelector("#status-label");
const snakeColorOptions = document.querySelector("#snake-color-options");
const keepColorToggle = document.querySelector("#keep-color-toggle");
const playButton = document.querySelector("#play-button");
const pauseButton = document.querySelector("#pause-button");
const restartButton = document.querySelector("#restart-button");
const render = createRenderer(canvas);

let keepColorOnRestart = loadKeepSnakeColorOnRestart();
let snakeColorId = keepColorOnRestart ? loadSnakeColorId() : DEFAULT_SNAKE_COLOR_ID;
let state = createInitialState({ bestScore: loadBestScore() });
let loopTimer = null;

function setState(nextState, options = {}) {
  state = nextState;

  if (options.persistBestScore) {
    saveBestScore(state.bestScore);
  }

  render(state, { snakeColorId });
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

  if (!keepColorOnRestart) {
    snakeColorId = DEFAULT_SNAKE_COLOR_ID;
    updateColorControls();
  }

  setState(resetGame(state));
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
  scoreValue.textContent = String(state.score);
  bestValue.textContent = String(state.bestScore);
  speedValue.textContent = `${(START_DELAY_MS / getTickDelay(state.score)).toFixed(1)}x`;
  statusLabel.textContent = statusText(state.status);
  playButton.disabled = state.status === STATUS.RUNNING || state.status === STATUS.GAME_OVER || state.status === STATUS.WON;
  pauseButton.disabled = state.status !== STATUS.RUNNING;
}

function buildColorControls() {
  snakeColorOptions.replaceChildren(...SNAKE_COLOR_OPTIONS.map(createColorButton));
  keepColorToggle.checked = keepColorOnRestart;
  updateColorControls();
}

function createColorButton(option) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "color-choice";
  button.dataset.colorId = option.id;
  button.style.setProperty("--snake-color", option.fill);
  button.style.setProperty("--snake-accent", option.accent);
  button.textContent = option.label;
  button.setAttribute("aria-pressed", "false");

  return button;
}

function updateColorControls() {
  for (const button of snakeColorOptions.querySelectorAll("[data-color-id]")) {
    button.setAttribute("aria-pressed", String(button.dataset.colorId === snakeColorId));
  }
}

function setSnakeColor(colorId, options = {}) {
  const { persist = true } = options;

  snakeColorId = normalizeSnakeColorId(colorId);

  if (persist && keepColorOnRestart) {
    saveSnakeColorId(snakeColorId);
  }

  updateColorControls();
  render(state, { snakeColorId });
}

function setKeepColorOnRestart(keepColor) {
  keepColorOnRestart = keepColor;
  saveKeepSnakeColorOnRestart(keepColorOnRestart);

  if (keepColorOnRestart) {
    saveSnakeColorId(snakeColorId);
  }
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

snakeColorOptions.addEventListener("click", (event) => {
  if (!(event.target instanceof Element)) {
    return;
  }

  const colorButton = event.target.closest("[data-color-id]");

  if (!colorButton) {
    return;
  }

  setSnakeColor(colorButton.dataset.colorId);
});

keepColorToggle.addEventListener("change", () => {
  setKeepColorOnRestart(keepColorToggle.checked);
});

bindKeyboard(handleDirection);
bindTouch(canvas, handleDirection);

window.addEventListener("blur", () => {
  if (state.status === STATUS.RUNNING) {
    pause();
  }
});

window.addEventListener("resize", () => render(state, { snakeColorId }));

buildColorControls();
setState(queueDirection(state, DIRECTIONS.RIGHT));
