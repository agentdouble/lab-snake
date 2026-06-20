import { CANVAS_SIZE, STATUS } from "./constants.js";
import { getMapDefinition } from "./maps.js";
import { getColorTheme } from "./settings.js";

const MAP_COLORS = Object.freeze({
  outside: "#0a0d0b",
  wall: "#7b8490",
  cellStroke: "rgba(6, 10, 8, 0.38)"
});

export function createRenderer(canvas) {
  const context = canvas.getContext("2d");

  return function render(state, settings) {
    const colors = getColorTheme(settings?.color).colors;
    const map = getMapDefinition(state.map?.id);
    const metrics = getBoardMetrics(map);

    context.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
    drawBoard(context, map, metrics, colors);
    drawObstacles(context, map.obstacles, metrics);
    drawApple(context, state.apple, metrics, colors);
    drawSnake(context, state.snake, metrics, colors);
    drawStatus(context, state.status, colors);
  };
}

function drawBoard(context, map, metrics, colors) {
  context.fillStyle = MAP_COLORS.outside;
  context.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

  context.fillStyle = colors.board;
  context.fillRect(metrics.offsetX, metrics.offsetY, metrics.width, metrics.height);
  context.strokeStyle = colors.grid;
  context.lineWidth = 1;

  for (let index = 1; index < map.width; index += 1) {
    const position = Math.round(metrics.offsetX + index * metrics.cellSize) + 0.5;

    context.beginPath();
    context.moveTo(position, metrics.offsetY);
    context.lineTo(position, metrics.offsetY + metrics.height);
    context.stroke();
  }

  for (let index = 1; index < map.height; index += 1) {
    const position = Math.round(metrics.offsetY + index * metrics.cellSize) + 0.5;

    context.beginPath();
    context.moveTo(metrics.offsetX, position);
    context.lineTo(metrics.offsetX + metrics.width, position);
    context.stroke();
  }
}

function drawObstacles(context, obstacles, metrics) {
  obstacles.forEach((cell) => {
    drawRoundedCell(context, cell, MAP_COLORS.wall, 4, metrics, true);
  });
}

function drawSnake(context, snake, metrics, colors) {
  snake.forEach((cell, index) => {
    const isHead = index === 0;
    drawRoundedCell(context, cell, isHead ? colors.snakeHead : colors.snakeBody, isHead ? 4 : 5, metrics);

    if (isHead) {
      drawRoundedCell(context, cell, colors.snakeShadow, 11, metrics);
    }
  });
}

function drawApple(context, apple, metrics, colors) {
  if (!apple) {
    return;
  }

  const centerX = metrics.offsetX + apple.x * metrics.cellSize + metrics.cellSize / 2;
  const centerY = metrics.offsetY + apple.y * metrics.cellSize + metrics.cellSize / 2;

  context.fillStyle = colors.apple;
  context.beginPath();
  context.arc(centerX, centerY, metrics.cellSize * 0.33, 0, Math.PI * 2);
  context.fill();

  context.fillStyle = colors.appleCore;
  context.beginPath();
  context.arc(
    centerX + metrics.cellSize * 0.12,
    centerY - metrics.cellSize * 0.12,
    metrics.cellSize * 0.08,
    0,
    Math.PI * 2
  );
  context.fill();
}

function drawRoundedCell(context, cell, color, inset, metrics, withStroke = false) {
  const x = metrics.offsetX + cell.x * metrics.cellSize + inset;
  const y = metrics.offsetY + cell.y * metrics.cellSize + inset;
  const size = metrics.cellSize - inset * 2;
  const radius = Math.max(3, size * 0.22);

  context.fillStyle = color;
  context.beginPath();
  context.roundRect(x, y, size, size, radius);
  context.fill();

  if (withStroke) {
    context.strokeStyle = MAP_COLORS.cellStroke;
    context.lineWidth = 2;
    context.stroke();
  }
}

function getBoardMetrics(map) {
  const cellSize = Math.floor(Math.min(CANVAS_SIZE / map.width, CANVAS_SIZE / map.height));
  const width = cellSize * map.width;
  const height = cellSize * map.height;

  return {
    cellSize,
    width,
    height,
    offsetX: (CANVAS_SIZE - width) / 2,
    offsetY: (CANVAS_SIZE - height) / 2
  };
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
