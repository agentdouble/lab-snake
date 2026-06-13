import { GAME_MODES, PLAYER_IDS, START_DELAY_MS, STATUS } from "./constants.js";
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
const playerOneScoreLabel = document.querySelector("#player-one-score-label");
const playerOneScoreValue = document.querySelector("#player-one-score-value");
const playerTwoScoreBlock = document.querySelector("#player-two-score-block");
const playerTwoScoreValue = document.querySelector("#player-two-score-value");
const bestValue = document.querySelector("#best-value");
const speedValue = document.querySelector("#speed-value");
const statusLabel = document.querySelector("#status-label");
const playButton = document.querySelector("#play-button");
const pauseButton = document.querySelector("#pause-button");
const restartButton = document.querySelector("#restart-button");
const playerTwoControls = document.querySelector("#player-two-controls");
const modeButtons = [...document.querySelectorAll("[data-mode]")];
const render = createRenderer(canvas);

let state = createInitialState({ bestScore: loadBestScore(), mode: GAME_MODES.SOLO });
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

function changeMode(mode) {
  if (state.mode === mode) {
    return;
  }

  clearTick();
  setState(resetGame(state, { mode }));
  canvas.focus();
}

function handleDirection(direction, playerId = PLAYER_IDS.ONE) {
  if (state.status === STATUS.READY || state.status === STATUS.PAUSED) {
    state = startGame(state);
  }

  const targetPlayerId = state.mode === GAME_MODES.LOCAL_MULTIPLAYER ? playerId : PLAYER_IDS.ONE;

  setState(queueDirection(state, direction, targetPlayerId));
  scheduleTick();
}

function updateHud() {
  const [playerOne, playerTwo] = state.players;
  const isMultiplayer = state.mode === GAME_MODES.LOCAL_MULTIPLAYER;

  playerOneScoreLabel.textContent = isMultiplayer ? "Joueur 1" : "Score";
  playerOneScoreValue.textContent = String(playerOne.score);
  playerTwoScoreBlock.hidden = !isMultiplayer;
  playerTwoScoreValue.textContent = String(playerTwo?.score ?? 0);
  bestValue.textContent = String(state.bestScore);
  speedValue.textContent = `${(START_DELAY_MS / getTickDelay(state.score)).toFixed(1)}x`;
  statusLabel.textContent = statusText(state.status);
  playButton.disabled = state.status === STATUS.RUNNING || state.status === STATUS.GAME_OVER || state.status === STATUS.WON;
  pauseButton.disabled = state.status !== STATUS.RUNNING;
  playerTwoControls.hidden = !isMultiplayer;

  modeButtons.forEach((button) => {
    const isActive = button.dataset.mode === state.mode;

    button.classList.toggle("is-active", isActive);
    button.setAttribute("aria-pressed", String(isActive));
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
  button.addEventListener("click", () => changeMode(button.dataset.mode));
});

bindKeyboard(handleDirection);
bindTouch(canvas, handleDirection);

window.addEventListener("blur", () => {
  if (state.status === STATUS.RUNNING) {
    pause();
  }
});

window.addEventListener("resize", () => render(state));

setState(state);
