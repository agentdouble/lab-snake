import { CANVAS_SIZE, GRID_SIZE, STATUS } from "./constants.js";

const COLORS = Object.freeze({
  board: "#111714",
  grid: "rgba(214, 236, 218, 0.08)",
  apple: "#ef476f",
  appleCore: "#ffd166",
  overlay: "rgba(11, 13, 12, 0.58)",
  text: "#f3f7ee"
});

export const SNAKE_RAINBOW_COLORS = Object.freeze([
  "#ff4d4d",
  "#ff9f1c",
  "#ffd166",
  "#2ec4b6",
  "#3a86ff",
  "#8338ec"
]);

export function createRenderer(canvas) {
  const context = canvas.getContext("2d");

  return function render(state) {
    context.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
    drawBoard(context);
    drawSnake(context, state.snake);
    drawApple(context, state.apple);
    drawStatus(context, state.status);
  };
}

function drawBoard(context) {
  context.fillStyle = COLORS.board;
  context.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
  context.strokeStyle = COLORS.grid;
  context.lineWidth = 1;

  const cellSize = CANVAS_SIZE / GRID_SIZE;

  for (let index = 1; index < GRID_SIZE; index += 1) {
    const position = Math.round(index * cellSize) + 0.5;

    context.beginPath();
    context.moveTo(position, 0);
    context.lineTo(position, CANVAS_SIZE);
    context.stroke();

    context.beginPath();
    context.moveTo(0, position);
    context.lineTo(CANVAS_SIZE, position);
    context.stroke();
  }
}

function drawSnake(context, snake) {
  snake.forEach((cell, index) => {
    const isHead = index === 0;
    drawRoundedCell(context, cell, getSnakeSegmentColor(index, snake.length), isHead ? 4 : 5);
  });
}

export function getSnakeSegmentColor(index, segmentCount) {
  if (segmentCount <= 1) {
    return SNAKE_RAINBOW_COLORS[0];
  }

  const colorIndex = Math.round((index / (segmentCount - 1)) * (SNAKE_RAINBOW_COLORS.length - 1));
  return SNAKE_RAINBOW_COLORS[colorIndex];
}

function drawApple(context, apple) {
  if (!apple) {
    return;
  }

  const cellSize = CANVAS_SIZE / GRID_SIZE;
  const centerX = apple.x * cellSize + cellSize / 2;
  const centerY = apple.y * cellSize + cellSize / 2;

  context.fillStyle = COLORS.apple;
  context.beginPath();
  context.arc(centerX, centerY, cellSize * 0.33, 0, Math.PI * 2);
  context.fill();

  context.fillStyle = COLORS.appleCore;
  context.beginPath();
  context.arc(centerX + cellSize * 0.12, centerY - cellSize * 0.12, cellSize * 0.08, 0, Math.PI * 2);
  context.fill();
}

function drawRoundedCell(context, cell, color, inset) {
  const cellSize = CANVAS_SIZE / GRID_SIZE;
  const x = cell.x * cellSize + inset;
  const y = cell.y * cellSize + inset;
  const size = cellSize - inset * 2;
  const radius = Math.max(3, size * 0.22);

  context.fillStyle = color;
  context.beginPath();
  context.roundRect(x, y, size, size, radius);
  context.fill();
}

function drawStatus(context, status) {
  if (status === STATUS.RUNNING) {
    return;
  }

  const label = statusLabel(status);

  context.fillStyle = COLORS.overlay;
  context.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
  context.fillStyle = COLORS.text;
  context.font = "700 44px Inter, ui-sans-serif, system-ui, sans-serif";
  context.textAlign = "center";
  context.textBaseline = "middle";
  context.fillText(label, CANVAS_SIZE / 2, CANVAS_SIZE / 2);
}

function statusLabel(status) {
  switch (status) {
    case STATUS.PAUSED:
      return "Pause";
    case STATUS.GAME_OVER:
      return "Perdu";
    case STATUS.WON:
      return "Gagne";
    case STATUS.READY:
    default:
      return "Snake";
  }
}
