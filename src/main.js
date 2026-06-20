import { START_DELAY_MS, STATUS } from "./constants.js";
import {
  createInitialState,
  getTickDelay,
  pauseGame,
  queueDirection,
  resetGame,
  restoreState,
  resumeGame,
  startGame,
  stepState
} from "./engine.js";
import { bindKeyboard, bindTouch } from "./input.js";
import { createRenderer } from "./renderer.js";
import {
  COLOR_THEMES,
  DEFAULT_GAME_SETTINGS,
  GAME_MODES,
  MAP_OPTIONS,
  SPEED_OPTIONS,
  getEffectiveSpeedOption,
  getGameMode,
  getMapOption,
  isSpeedLockedByMode,
  normalizeSettings
} from "./settings.js";
import { DEFAULT_SNAKE_COLOR_ID, SNAKE_COLOR_OPTIONS } from "./snake-colors.js";
import {
  clearSavedGame,
  loadBestScore,
  loadSavedGame,
  loadSettings,
  saveBestScore,
  saveGameState,
  saveSettings
} from "./storage.js";

const canvas = document.querySelector("#game-canvas");
const scoreValue = document.querySelector("#score-value");
const bestValue = document.querySelector("#best-value");
const speedValue = document.querySelector("#speed-value");
const modeValue = document.querySelector("#mode-value");
const mapValue = document.querySelector("#map-value");
const statusLabel = document.querySelector("#status-label");
const playButton = document.querySelector("#play-button");
const pauseButton = document.querySelector("#pause-button");
const restartButton = document.querySelector("#restart-button");
const settingsButton = document.querySelector("#settings-button");
const settingsDialog = document.querySelector("#settings-dialog");
const settingsForm = document.querySelector("#settings-form");
const modeSetting = document.querySelector("#mode-setting");
const speedSetting = document.querySelector("#speed-setting");
const speedSettingLabel = document.querySelector("#speed-setting-label");
const colorSetting = document.querySelector("#color-setting");
const gridSetting = document.querySelector("#grid-setting");
const mapSetting = document.querySelector("#map-setting");
const snakeColorOptions = document.querySelector("#snake-color-options");
const keepColorToggle = document.querySelector("#keep-color-toggle");
const settingsResetButton = document.querySelector("#settings-reset-button");
const render = createRenderer(canvas);

const bestScore = loadBestScore();
const savedGame = loadSavedGame();

let settings = savedGame?.settings ?? loadSettings();
let state = savedGame
  ? restoreState(savedGame.state, { bestScore, mapId: settings.map })
  : createInitialState({ bestScore, mapId: settings.map });
let loopTimer = null;
let resumeAfterSettings = false;

function setState(nextState, options = {}) {
  state = nextState;

  if (options.persistBestScore) {
    saveBestScore(state.bestScore);
  }

  syncSavedGame(options);
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

  if (!settings.keepSnakeColorOnRestart) {
    setSettings({ ...settings, snakeColor: DEFAULT_SNAKE_COLOR_ID }, { reschedule: false });
  }

  setState(resetGame(state, { mapId: settings.map }), { clearSavedGame: true });
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
  const mode = getGameMode(settings.mode);
  const mapOption = currentMapOption();

  scoreValue.textContent = String(state.score);
  bestValue.textContent = String(state.bestScore);
  modeValue.textContent = mode.label;
  speedValue.textContent = `${speedOption.label} ${(START_DELAY_MS / getTickDelay(state.score, speedOption.multiplier)).toFixed(1)}x`;
  mapValue.textContent = mapOption.label;
  statusLabel.textContent = isSettingsOpen() ? "Reglages" : statusText(state.status);
  playButton.disabled = state.status !== STATUS.READY;
  pauseButton.disabled = state.status !== STATUS.RUNNING && state.status !== STATUS.PAUSED;
  pauseButton.textContent = state.status === STATUS.PAUSED ? "Reprendre" : "Pause";
  pauseButton.setAttribute("aria-pressed", String(state.status === STATUS.PAUSED));
}

function currentSpeedOption() {
  return getEffectiveSpeedOption(settings);
}

function currentMapOption() {
  return getMapOption(settings.map);
}

function populateSettingsControls() {
  modeSetting.replaceChildren(...GAME_MODES.map(createOptionElement));
  speedSetting.replaceChildren(...SPEED_OPTIONS.map(createOptionElement));
  colorSetting.replaceChildren(...COLOR_THEMES.map(createOptionElement));
  mapSetting.replaceChildren(...MAP_OPTIONS.map(createMapOptionElement));
  snakeColorOptions.replaceChildren(...SNAKE_COLOR_OPTIONS.map(createColorButton));
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

function syncSettingsControls() {
  const speedLocked = isSpeedLockedByMode(settings.mode);

  modeSetting.value = settings.mode;
  speedSetting.value = currentSpeedOption().id;
  speedSetting.disabled = speedLocked;
  speedSettingLabel.textContent = speedLocked ? "Vitesse du mode" : "Vitesse";
  colorSetting.value = settings.color;
  gridSetting.checked = settings.showGrid;
  mapSetting.value = settings.map;
  keepColorToggle.checked = settings.keepSnakeColorOnRestart;
  updateColorControls();
}

function updateColorControls() {
  for (const button of snakeColorOptions.querySelectorAll("[data-color-id]")) {
    button.setAttribute("aria-pressed", String(button.dataset.colorId === settings.snakeColor));
  }
}

function setSettings(nextSettings, options = {}) {
  const { reschedule = true } = options;
  const nextNormalizedSettings = normalizeSettings(nextSettings);
  const mapChanged = nextNormalizedSettings.map !== state.map.id;

  settings = nextNormalizedSettings;
  savePersistableSettings();
  syncSettingsControls();

  if (mapChanged) {
    resumeAfterSettings = false;
    clearTick();
    setState(resetGame(state, { mapId: settings.map }), { clearSavedGame: true });
    return;
  }

  render(state, settings);
  updateHud();
  syncSavedGame();

  if (reschedule && state.status === STATUS.RUNNING && !isSettingsOpen()) {
    clearTick();
    scheduleTick();
  }
}

function handleSettingsChange(event) {
  setSettings({
    ...settings,
    mode: modeSetting.value,
    speed: event.target === speedSetting ? speedSetting.value : settings.speed,
    color: colorSetting.value,
    showGrid: gridSetting.checked,
    map: mapSetting.value
  });
}

function savePersistableSettings() {
  const settingsToSave = settings.keepSnakeColorOnRestart
    ? settings
    : { ...settings, snakeColor: DEFAULT_SNAKE_COLOR_ID };

  saveSettings(settingsToSave);
}

function setSnakeColor(colorId) {
  setSettings({
    ...settings,
    snakeColor: colorId
  });
}

function setKeepColorOnRestart(keepColor) {
  setSettings({
    ...settings,
    keepSnakeColorOnRestart: keepColor
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
  settingsButton.setAttribute("aria-expanded", "true");
  updateHud();
  modeSetting.focus();
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
  settingsButton.setAttribute("aria-expanded", "false");
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

function syncSavedGame(options = {}) {
  if (options.clearSavedGame || state.status === STATUS.GAME_OVER || state.status === STATUS.WON) {
    clearSavedGame();
    return;
  }

  if (state.status === STATUS.RUNNING || state.status === STATUS.PAUSED) {
    saveGameState(state, settings);
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
modeSetting.addEventListener("change", handleSettingsChange);
speedSetting.addEventListener("change", handleSettingsChange);
colorSetting.addEventListener("change", handleSettingsChange);
gridSetting.addEventListener("change", handleSettingsChange);
mapSetting.addEventListener("change", handleSettingsChange);
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

setState(state);
scheduleTick();
