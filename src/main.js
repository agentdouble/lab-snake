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
import { getSnakeColorOption, SNAKE_COLORS } from "./snake-colors.js";
import { loadBestScore, loadSnakeColorId, saveBestScore, saveSnakeColorId } from "./storage.js";

const canvas = document.querySelector("#game-canvas");
const scoreValue = document.querySelector("#score-value");
const bestValue = document.querySelector("#best-value");
const speedValue = document.querySelector("#speed-value");
const statusLabel = document.querySelector("#status-label");
const playButton = document.querySelector("#play-button");
const pauseButton = document.querySelector("#pause-button");
const restartButton = document.querySelector("#restart-button");
const colorOptions = document.querySelector("#snake-color-options");
const snakeColorLabel = document.querySelector("#snake-color-label");
const render = createRenderer(canvas);
const colorButtons = new Map();

let state = createInitialState({ bestScore: loadBestScore() });
let selectedSnakeColorId = loadSnakeColorId();
let loopTimer = null;

function setState(nextState, options = {}) {
  state = nextState;

  if (options.persistBestScore) {
    saveBestScore(state.bestScore);
  }

  render(state, { snakeColorId: selectedSnakeColorId });
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
  setState(resetGame(state));
  canvas.focus();
}

function setupColorOptions() {
  SNAKE_COLORS.forEach((color) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "color-swatch";
    button.title = color.label;
    button.setAttribute("aria-label", `Couleur ${color.label}`);
    button.style.setProperty("--swatch-color", color.value);
    button.addEventListener("click", () => selectSnakeColor(color.id));

    colorButtons.set(color.id, button);
    colorOptions.append(button);
  });
}

function selectSnakeColor(colorId) {
  if (state.status === STATUS.RUNNING) {
    return;
  }

  selectedSnakeColorId = getSnakeColorOption(colorId).id;
  saveSnakeColorId(selectedSnakeColorId);
  render(state, { snakeColorId: selectedSnakeColorId });
  updateHud();
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

  const selectedColor = getSnakeColorOption(selectedSnakeColorId);
  snakeColorLabel.textContent = selectedColor.label;

  colorButtons.forEach((button, colorId) => {
    button.disabled = state.status === STATUS.RUNNING;
    button.setAttribute("aria-pressed", String(colorId === selectedColor.id));
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

bindKeyboard(handleDirection);
bindTouch(canvas, handleDirection);

window.addEventListener("blur", () => {
  if (state.status === STATUS.RUNNING) {
    pause();
  }
});

window.addEventListener("resize", () => render(state, { snakeColorId: selectedSnakeColorId }));

setupColorOptions();
setState(queueDirection(state, DIRECTIONS.RIGHT));
