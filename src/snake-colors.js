export const DEFAULT_SNAKE_COLOR_ID = "green";

export const SNAKE_COLOR_OPTIONS = Object.freeze([
  Object.freeze({
    id: "green",
    label: "Vert",
    fill: "#63dc71",
    accent: "#245833"
  }),
  Object.freeze({
    id: "cyan",
    label: "Cyan",
    fill: "#4cc9f0",
    accent: "#176b84"
  }),
  Object.freeze({
    id: "violet",
    label: "Violet",
    fill: "#c084fc",
    accent: "#5b2f88"
  }),
  Object.freeze({
    id: "ivory",
    label: "Ivoire",
    fill: "#f4f7ef",
    accent: "#66705f"
  }),
  Object.freeze({
    id: "blue",
    label: "Bleu",
    fill: "#70a5ff",
    accent: "#254d8f"
  })
]);

export function getSnakeColor(colorId) {
  return SNAKE_COLOR_OPTIONS.find((option) => option.id === colorId) ?? getDefaultSnakeColor();
}

export function normalizeSnakeColorId(colorId) {
  return getSnakeColor(colorId).id;
}

export function getDefaultSnakeColor() {
  return SNAKE_COLOR_OPTIONS[0];
}
