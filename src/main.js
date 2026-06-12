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
import { loadBestScore, saveBestScore } from "./storage.js";

const canvas = document.querySelector("#game-canvas");
const scoreValue = document.querySelector("#score-value");
const applesValue = document.querySelector("#apples-value");
const bestValue = document.querySelector("#best-value");
const speedValue = document.querySelector("#speed-value");
const statusLabel = document.querySelector("#status-label");
const playButton = document.querySelector("#play-button");
const pauseButton = document.querySelector("#pause-button");
const restartButton = document.querySelector("#restart-button");
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

function handleDirection(direction) {
  if (state.status === STATUS.READY || state.status === STATUS.PAUSED) {
    state = startGame(state);
  }

  setState(queueDirection(state, direction));
  scheduleTick();
}

function updateHud() {
  scoreValue.textContent = String(state.score);
  applesValue.textContent = String(state.score);
  bestValue.textContent = String(state.bestScore);
  speedValue.textContent = `${(START_DELAY_MS / getTickDelay(state.score)).toFixed(1)}x`;
  statusLabel.textContent = statusText(state.status);
  playButton.disabled = state.status === STATUS.RUNNING || state.status === STATUS.GAME_OVER || state.status === STATUS.WON;
  pauseButton.disabled = state.status !== STATUS.RUNNING;
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

window.addEventListener("resize", () => render(state));

setState(queueDirection(state, DIRECTIONS.RIGHT));
