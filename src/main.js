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
import {
  COLOR_THEMES,
  DEFAULT_GAME_SETTINGS,
  MAP_OPTIONS,
  SPEED_OPTIONS,
  getMapOption,
  getSpeedOption,
  normalizeSettings
} from "./settings.js";
import { loadBestScore, loadSettings, saveBestScore, saveSettings } from "./storage.js";

const canvas = document.querySelector("#game-canvas");
const scoreValue = document.querySelector("#score-value");
const bestValue = document.querySelector("#best-value");
const speedValue = document.querySelector("#speed-value");
const mapValue = document.querySelector("#map-value");
const statusLabel = document.querySelector("#status-label");
const playButton = document.querySelector("#play-button");
const pauseButton = document.querySelector("#pause-button");
const restartButton = document.querySelector("#restart-button");
const settingsButton = document.querySelector("#settings-button");
const settingsDialog = document.querySelector("#settings-dialog");
const settingsForm = document.querySelector("#settings-form");
const speedSetting = document.querySelector("#speed-setting");
const colorSetting = document.querySelector("#color-setting");
const mapSetting = document.querySelector("#map-setting");
const settingsResetButton = document.querySelector("#settings-reset-button");
const render = createRenderer(canvas);

let settings = loadSettings();
let state = createInitialState({ bestScore: loadBestScore(), mapId: settings.map });
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
  setState(resetGame(state, { mapId: settings.map }));
  canvas.focus();
}

function handleDirection(direction) {
  if (isSettingsOpen()) {
    return;
  }

  if (state.status === STATUS.READY || state.status === STATUS.PAUSED) {
    state = startGame(state);
  }

  setState(queueDirection(state, direction));
  scheduleTick();
}

function updateHud() {
  const speedOption = currentSpeedOption();
  const mapOption = currentMapOption();

  scoreValue.textContent = String(state.score);
  bestValue.textContent = String(state.bestScore);
  speedValue.textContent = `${speedOption.label} ${(START_DELAY_MS / getTickDelay(state.score, speedOption.multiplier)).toFixed(1)}x`;
  mapValue.textContent = mapOption.label;
  statusLabel.textContent = isSettingsOpen() ? "Reglages" : statusText(state.status);
  playButton.disabled = state.status === STATUS.RUNNING || state.status === STATUS.GAME_OVER || state.status === STATUS.WON;
  pauseButton.disabled = state.status !== STATUS.RUNNING;
}

function currentSpeedOption() {
  return getSpeedOption(settings.speed);
}

function currentMapOption() {
  return getMapOption(settings.map);
}

function populateSettingsControls() {
  speedSetting.replaceChildren(...SPEED_OPTIONS.map(createOptionElement));
  colorSetting.replaceChildren(...COLOR_THEMES.map(createOptionElement));
  mapSetting.replaceChildren(...MAP_OPTIONS.map(createMapOptionElement));
  syncSettingsControls();
}

function createOptionElement(option) {
  const element = document.createElement("option");

  element.value = option.id;
  element.textContent = option.label;

  return element;
}

function createMapOptionElement(option) {
  const element = createOptionElement(option);

  element.textContent = `${option.label} - ${option.summary}`;

  return element;
}

function syncSettingsControls() {
  speedSetting.value = settings.speed;
  colorSetting.value = settings.color;
  mapSetting.value = settings.map;
}

function setSettings(nextSettings) {
  const nextNormalizedSettings = normalizeSettings(nextSettings);
  const mapChanged = nextNormalizedSettings.map !== state.map.id;

  settings = nextNormalizedSettings;
  saveSettings(settings);
  syncSettingsControls();

  if (mapChanged) {
    resumeAfterSettings = false;
    clearTick();
    setState(resetGame(state, { mapId: settings.map }));
    return;
  }

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
    color: colorSetting.value,
    map: mapSetting.value
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
pauseButton.addEventListener("click", pause);
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
mapSetting.addEventListener("change", handleSettingsChange);
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
    pause();
  }
});

window.addEventListener("resize", () => render(state, settings));

setState(queueDirection(state, DIRECTIONS.RIGHT));
