export const DEFAULT_GAME_SETTINGS = Object.freeze({
  speed: "normal",
  color: "classic"
});

export const SPEED_OPTIONS = Object.freeze([
  Object.freeze({
    id: "slow",
    label: "Lente",
    multiplier: 0.8
  }),
  Object.freeze({
    id: "normal",
    label: "Normale",
    multiplier: 1
  }),
  Object.freeze({
    id: "fast",
    label: "Rapide",
    multiplier: 1.25
  }),
  Object.freeze({
    id: "expert",
    label: "Expert",
    multiplier: 1.5
  })
]);

export const COLOR_THEMES = Object.freeze([
  Object.freeze({
    id: "classic",
    label: "Classique",
    colors: Object.freeze({
      board: "#111714",
      grid: "rgba(214, 236, 218, 0.08)",
      snakeHead: "#d8f75c",
      snakeBody: "#4fd06b",
      snakeShadow: "#19724d",
      apple: "#ef476f",
      appleCore: "#ffd166",
      overlay: "rgba(11, 13, 12, 0.58)",
      text: "#f3f7ee"
    })
  }),
  Object.freeze({
    id: "mint",
    label: "Menthe",
    colors: Object.freeze({
      board: "#0d1b1e",
      grid: "rgba(170, 226, 214, 0.1)",
      snakeHead: "#f2ff9f",
      snakeBody: "#5ee6a8",
      snakeShadow: "#177767",
      apple: "#ff6b6b",
      appleCore: "#ffe66d",
      overlay: "rgba(7, 18, 21, 0.62)",
      text: "#f6fff8"
    })
  }),
  Object.freeze({
    id: "neon",
    label: "Neon",
    colors: Object.freeze({
      board: "#171423",
      grid: "rgba(255, 255, 255, 0.08)",
      snakeHead: "#f9f871",
      snakeBody: "#00d4ff",
      snakeShadow: "#5b4dff",
      apple: "#ff4fa3",
      appleCore: "#ffffff",
      overlay: "rgba(13, 10, 28, 0.62)",
      text: "#fff7fb"
    })
  })
]);

export function normalizeSettings(settings = {}) {
  return {
    speed: getSpeedOption(settings.speed).id,
    color: getColorTheme(settings.color).id
  };
}

export function getSpeedOption(speedId) {
  return SPEED_OPTIONS.find((option) => option.id === speedId) ?? SPEED_OPTIONS[1];
}

export function getColorTheme(colorId) {
  return COLOR_THEMES.find((theme) => theme.id === colorId) ?? COLOR_THEMES[0];
}
