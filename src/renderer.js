import { CANVAS_SIZE, GRID_SIZE, STATUS } from "./constants.js";
import { getColorTheme } from "./settings.js";

export function createRenderer(canvas) {
  const context = canvas.getContext("2d");

  return function render(state, settings) {
    const colors = getColorTheme(settings?.color).colors;

    context.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
    drawBoard(context, colors);
    drawApple(context, state.apple, colors);
    drawSnake(context, state.snake, colors);
    drawStatus(context, state.status, colors);
  };
}

function drawBoard(context, colors) {
  context.fillStyle = colors.board;
  context.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
  context.strokeStyle = colors.grid;
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

function drawSnake(context, snake, colors) {
  snake.forEach((cell, index) => {
    const isHead = index === 0;
    drawRoundedCell(context, cell, isHead ? colors.snakeHead : colors.snakeBody, isHead ? 4 : 5);

    if (isHead) {
      drawRoundedCell(context, cell, colors.snakeShadow, 11);
    }
  });
}

function drawApple(context, apple, colors) {
  if (!apple) {
    return;
  }

  const cellSize = CANVAS_SIZE / GRID_SIZE;
  const centerX = apple.x * cellSize + cellSize / 2;
  const centerY = apple.y * cellSize + cellSize / 2;

  context.fillStyle = colors.apple;
  context.beginPath();
  context.arc(centerX, centerY, cellSize * 0.33, 0, Math.PI * 2);
  context.fill();

  context.fillStyle = colors.appleCore;
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

function drawStatus(context, status, colors) {
  if (status === STATUS.RUNNING) {
    return;
  }

  const label = statusLabel(status);

  context.fillStyle = colors.overlay;
  context.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
  context.fillStyle = colors.text;
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
