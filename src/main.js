import { DIRECTIONS, START_DELAY_MS, STATUS } from "./constants.js";
import {
  createInitialState,
  getTickDelay,
  pauseGame,
  queueDirection,
  resetGame,
  resumeGame,
  startGame,
  stepState
} from "./engine.js";
import { bindKeyboard, bindTouch } from "./input.js";
import { createRenderer } from "./renderer.js";
import {
  COLOR_THEMES,
  DEFAULT_GAME_SETTINGS,
  SPEED_OPTIONS,
  getSpeedOption,
  normalizeSettings
} from "./settings.js";
import { loadBestScore, loadSettings, saveBestScore, saveSettings } from "./storage.js";

const canvas = document.querySelector("#game-canvas");
const scoreValue = document.querySelector("#score-value");
const bestValue = document.querySelector("#best-value");
const speedValue = document.querySelector("#speed-value");
const statusLabel = document.querySelector("#status-label");
const playButton = document.querySelector("#play-button");
const pauseButton = document.querySelector("#pause-button");
const restartButton = document.querySelector("#restart-button");
const settingsButton = document.querySelector("#settings-button");
const settingsDialog = document.querySelector("#settings-dialog");
const settingsForm = document.querySelector("#settings-form");
const speedSetting = document.querySelector("#speed-setting");
const colorSetting = document.querySelector("#color-setting");
const settingsResetButton = document.querySelector("#settings-reset-button");
const render = createRenderer(canvas);

let state = createInitialState({ bestScore: loadBestScore() });
let settings = loadSettings();
let loopTimer = null;
let resumeAfterSettings = false;

function setState(nextState, options = {}) {
  state = nextState;

  if (options.persistBestScore) {
    saveBestScore(state.bestScore);
  }

  render(state, settings);
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

  loopTimer = window.setTimeout(runTick, getTickDelay(state.score, currentSpeedOption().multiplier));
}

function clearTick() {
  if (!loopTimer) {
    return;
  }

  window.clearTimeout(loopTimer);
  loopTimer = null;
}

function play() {
  if (state.status !== STATUS.READY) {
    return;
  }

  setState(startGame(state));
  scheduleTick();
  canvas.focus();
}

function togglePause(options = {}) {
  const { focusCanvas = true } = options;

  if (state.status === STATUS.RUNNING) {
    clearTick();
    setState(pauseGame(state));
    if (focusCanvas) {
      canvas.focus();
    }
    return;
  }

  if (state.status === STATUS.PAUSED) {
    setState(resumeGame(state));
    scheduleTick();
    if (focusCanvas) {
      canvas.focus();
    }
  }
}

function restart() {
  clearTick();
  setState(resetGame(state));
  canvas.focus();
}

function handleDirection(direction) {
  if (isSettingsOpen()) {
    return;
  }

  if (state.status === STATUS.READY) {
    state = startGame(state);
  }

  setState(queueDirection(state, direction));
  scheduleTick();
}

function updateHud() {
  const speedOption = currentSpeedOption();

  scoreValue.textContent = String(state.score);
  bestValue.textContent = String(state.bestScore);
  speedValue.textContent = `${speedOption.label} ${(START_DELAY_MS / getTickDelay(state.score, speedOption.multiplier)).toFixed(1)}x`;
  statusLabel.textContent = isSettingsOpen() ? "Reglages" : statusText(state.status);
  playButton.disabled = state.status !== STATUS.READY;
  pauseButton.disabled = state.status !== STATUS.RUNNING && state.status !== STATUS.PAUSED;
  pauseButton.textContent = state.status === STATUS.PAUSED ? "Reprendre" : "Pause";
  pauseButton.setAttribute("aria-pressed", String(state.status === STATUS.PAUSED));
}

function currentSpeedOption() {
  return getSpeedOption(settings.speed);
}

function populateSettingsControls() {
  speedSetting.replaceChildren(...SPEED_OPTIONS.map(createOptionElement));
  colorSetting.replaceChildren(...COLOR_THEMES.map(createOptionElement));
  syncSettingsControls();
}

function createOptionElement(option) {
  const element = document.createElement("option");

  element.value = option.id;
  element.textContent = option.label;

  return element;
}

function syncSettingsControls() {
  speedSetting.value = settings.speed;
  colorSetting.value = settings.color;
}

function setSettings(nextSettings) {
  settings = normalizeSettings(nextSettings);
  saveSettings(settings);
  syncSettingsControls();
  render(state, settings);
  updateHud();

  if (state.status === STATUS.RUNNING && !isSettingsOpen()) {
    clearTick();
    scheduleTick();
  }
}

function handleSettingsChange() {
  setSettings({
    speed: speedSetting.value,
    color: colorSetting.value
  });
}

function openSettings() {
  if (isSettingsOpen()) {
    return;
  }

  resumeAfterSettings = state.status === STATUS.RUNNING;
  clearTick();
  syncSettingsControls();
  showSettingsDialog();
  updateHud();
  speedSetting.focus();
}

function showSettingsDialog() {
  if (typeof settingsDialog.showModal === "function") {
    settingsDialog.showModal();
    return;
  }

  settingsDialog.setAttribute("open", "");
}

function closeSettingsDialog() {
  if (!isSettingsOpen()) {
    return;
  }

  if (typeof settingsDialog.close === "function") {
    settingsDialog.close();
    return;
  }

  settingsDialog.removeAttribute("open");
  handleSettingsClosed();
}

function isSettingsOpen() {
  return settingsDialog.open || settingsDialog.hasAttribute("open");
}

function handleSettingsClosed() {
  const shouldResume = resumeAfterSettings && state.status === STATUS.RUNNING;

  resumeAfterSettings = false;
  updateHud();

  if (shouldResume) {
    scheduleTick();
  }

  settingsButton.focus();
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
pauseButton.addEventListener("click", togglePause);
restartButton.addEventListener("click", restart);
settingsButton.addEventListener("click", openSettings);
settingsForm.addEventListener("submit", (event) => {
  if (typeof settingsDialog.close !== "function") {
    event.preventDefault();
    closeSettingsDialog();
  }
});
speedSetting.addEventListener("change", handleSettingsChange);
colorSetting.addEventListener("change", handleSettingsChange);
settingsResetButton.addEventListener("click", () => setSettings(DEFAULT_GAME_SETTINGS));
settingsDialog.addEventListener("close", handleSettingsClosed);
settingsDialog.addEventListener("click", (event) => {
  if (event.target === settingsDialog) {
    closeSettingsDialog();
  }
});

populateSettingsControls();

bindKeyboard(handleDirection, {
  shouldIgnore: isSettingsOpen
});
bindTouch(canvas, handleDirection);

window.addEventListener("blur", () => {
  if (state.status === STATUS.RUNNING) {
    togglePause({ focusCanvas: false });
  }
});

window.addEventListener("resize", () => render(state, settings));

setState(queueDirection(state, DIRECTIONS.RIGHT));
