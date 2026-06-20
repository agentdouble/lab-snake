import { DIRECTIONS } from "./constants.js";

export const DEFAULT_MAP_ID = "classic";

export const MAPS = Object.freeze([
  createMap({
    id: "classic",
    label: "Classique",
    summary: "20 x 20",
    width: 20,
    height: 20,
    startSnake: [
      { x: 9, y: 10 },
      { x: 8, y: 10 },
      { x: 7, y: 10 }
    ],
    obstacles: []
  }),
  createMap({
    id: "canyon",
    label: "Canyon",
    summary: "20 x 20 + murs",
    width: 20,
    height: 20,
    startSnake: [
      { x: 9, y: 10 },
      { x: 8, y: 10 },
      { x: 7, y: 10 }
    ],
    obstacles: [
      ...verticalWall(6, 2, 17, [10]),
      ...verticalWall(13, 2, 17, [10])
    ]
  }),
  createMap({
    id: "wide",
    label: "Etendue",
    summary: "24 x 16",
    width: 24,
    height: 16,
    startSnake: [
      { x: 11, y: 8 },
      { x: 10, y: 8 },
      { x: 9, y: 8 }
    ],
    obstacles: [
      ...horizontalWall(3, 4, 5),
      ...horizontalWall(16, 4, 5),
      ...horizontalWall(3, 11, 5),
      ...horizontalWall(16, 11, 5)
    ]
  })
]);

export function getMapDefinition(mapId) {
  return (
    MAPS.find((map) => map.id === mapId) ??
    MAPS.find((map) => map.id === DEFAULT_MAP_ID) ??
    MAPS[0]
  );
}

function createMap(definition) {
  return Object.freeze({
    id: definition.id,
    label: definition.label,
    summary: definition.summary,
    width: definition.width,
    height: definition.height,
    startDirection: DIRECTIONS.RIGHT,
    startSnake: freezeCells(definition.startSnake),
    obstacles: freezeCells(definition.obstacles)
  });
}

function verticalWall(x, fromY, toY, gaps = []) {
  const gapSet = new Set(gaps);
  const cells = [];

  for (let y = fromY; y <= toY; y += 1) {
    if (!gapSet.has(y)) {
      cells.push({ x, y });
    }
  }

  return cells;
}

function horizontalWall(fromX, y, length) {
  return Array.from({ length }, (_, index) => ({ x: fromX + index, y }));
}

function freezeCells(cells) {
  return Object.freeze(cells.map((cell) => Object.freeze({ x: cell.x, y: cell.y })));
}
