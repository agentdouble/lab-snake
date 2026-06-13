export const DEFAULT_SNAKE_COLOR_ID = "lime";

export const SNAKE_COLORS = Object.freeze([
  Object.freeze({ id: "lime", label: "Lime", value: "#63dc71" }),
  Object.freeze({ id: "cyan", label: "Cyan", value: "#4cc9f0" }),
  Object.freeze({ id: "violet", label: "Violet", value: "#b8a1ff" }),
  Object.freeze({ id: "amber", label: "Ambre", value: "#f59e0b" })
]);

export function getSnakeColorOption(colorId) {
  return (
    SNAKE_COLORS.find((option) => option.id === colorId) ??
    SNAKE_COLORS.find((option) => option.id === DEFAULT_SNAKE_COLOR_ID) ??
    SNAKE_COLORS[0]
  );
}
