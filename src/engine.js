import {
  DELAY_STEP_MS,
  DIRECTIONS,
  GAME_MODES,
  GRID_SIZE,
  MIN_DELAY_MS,
  PLAYER_IDS,
  START_DELAY_MS,
  STATUS
} from "./constants.js";

const DEFAULT_PLAYER_ONE_SNAKE = Object.freeze([
  Object.freeze({ x: 9, y: 10 }),
  Object.freeze({ x: 8, y: 10 }),
  Object.freeze({ x: 7, y: 10 })
]);

const DEFAULT_PLAYER_TWO_SNAKE = Object.freeze([
  Object.freeze({ x: 10, y: 9 }),
  Object.freeze({ x: 11, y: 9 }),
  Object.freeze({ x: 12, y: 9 })
]);

export function createInitialState(options = {}) {
  const {
    bestScore = 0,
    randomizer = Math.random,
    mode = GAME_MODES.SOLO,
    players,
    snake = DEFAULT_PLAYER_ONE_SNAKE,
    direction = DIRECTIONS.RIGHT,
    apple
  } = options;

  const initialPlayers = createInitialPlayers({ mode, players, snake, direction });
  const occupiedCells = getOccupiedCells(initialPlayers);

  return withPlayerAliases({
    mode,
    players: initialPlayers,
    apple: apple ? copyCell(apple) : randomFreeCell(occupiedCells, randomizer),
    bestScore,
    status: STATUS.READY,
    ticks: 0
  });
}

export function startGame(state) {
  if (state.status === STATUS.RUNNING || state.status === STATUS.GAME_OVER || state.status === STATUS.WON) {
    return state;
  }

  return { ...state, status: STATUS.RUNNING };
}

export function pauseGame(state) {
  if (state.status !== STATUS.RUNNING) {
    return state;
  }

  return { ...state, status: STATUS.PAUSED };
}

export function resetGame(state, options = {}) {
  return createInitialState({
    bestScore: state.bestScore,
    mode: state.mode,
    ...options
  });
}

export function queueDirection(state, direction, playerId = PLAYER_IDS.ONE) {
  if (!direction || state.status === STATUS.GAME_OVER || state.status === STATUS.WON) {
    return state;
  }

  const effectivePlayerId = state.mode === GAME_MODES.LOCAL_MULTIPLAYER ? playerId : PLAYER_IDS.ONE;
  const playerIndex = state.players.findIndex((player) => player.id === effectivePlayerId);

  if (playerIndex < 0) {
    return state;
  }

  const player = state.players[playerIndex];
  const latestDirection = player.directionQueue.at(-1) ?? player.direction;

  if (sameDirection(direction, latestDirection) || isOpposite(direction, latestDirection)) {
    return state;
  }

  if (player.directionQueue.length >= 2) {
    return state;
  }

  const nextPlayers = replacePlayerAt(state.players, playerIndex, {
    ...player,
    directionQueue: [...player.directionQueue, direction]
  });

  return withPlayerAliases({ ...state, players: nextPlayers });
}

export function stepState(state, randomizer = Math.random) {
  if (state.status !== STATUS.RUNNING) {
    return state;
  }

  const turns = state.players.map((player) => {
    const [queuedDirection, ...remainingQueue] = player.directionQueue;
    const direction = queuedDirection ?? player.direction;
    const nextHead = addCells(player.snake[0], direction);

    return {
      player,
      direction,
      remainingQueue,
      nextHead,
      grows: Boolean(state.apple && sameCell(nextHead, state.apple))
    };
  });

  if (hasCollision(turns)) {
    const nextPlayers = turns.map(({ player, direction, remainingQueue }) => ({
      ...player,
      direction,
      directionQueue: remainingQueue
    }));

    return withPlayerAliases({
      ...state,
      players: nextPlayers,
      bestScore: Math.max(state.bestScore, getTotalScore(nextPlayers)),
      status: STATUS.GAME_OVER,
      ticks: state.ticks + 1
    });
  }

  const nextPlayers = turns.map(({ player, direction, remainingQueue, nextHead, grows }) => {
    const nextSnake = [nextHead, ...player.snake.map(copyCell)];

    if (!grows) {
      nextSnake.pop();
    }

    return {
      ...player,
      snake: nextSnake,
      direction,
      directionQueue: remainingQueue,
      score: grows ? player.score + 1 : player.score
    };
  });

  const hasEatenApple = turns.some((turn) => turn.grows);
  const nextApple = hasEatenApple ? randomFreeCell(getOccupiedCells(nextPlayers), randomizer) : state.apple;
  const nextScore = getTotalScore(nextPlayers);
  const hasWon = hasEatenApple && !nextApple;

  return withPlayerAliases({
    ...state,
    players: nextPlayers,
    apple: nextApple,
    bestScore: Math.max(state.bestScore, nextScore),
    status: hasWon ? STATUS.WON : STATUS.RUNNING,
    ticks: state.ticks + 1
  });
}

export function getTickDelay(score) {
  return Math.max(MIN_DELAY_MS, START_DELAY_MS - score * DELAY_STEP_MS);
}

export function randomFreeCell(occupiedCells, randomizer = Math.random) {
  const occupied = new Set(occupiedCells.map(cellKey));
  const freeCellsCount = GRID_SIZE * GRID_SIZE - occupied.size;

  if (freeCellsCount <= 0) {
    return null;
  }

  let targetIndex = Math.floor(randomizer() * freeCellsCount);

  for (let y = 0; y < GRID_SIZE; y += 1) {
    for (let x = 0; x < GRID_SIZE; x += 1) {
      if (occupied.has(cellKey({ x, y }))) {
        continue;
      }

      if (targetIndex === 0) {
        return { x, y };
      }

      targetIndex -= 1;
    }
  }

  return null;
}

function addCells(cell, direction) {
  return {
    x: cell.x + direction.x,
    y: cell.y + direction.y
  };
}

function isOutsideGrid(cell) {
  return cell.x < 0 || cell.y < 0 || cell.x >= GRID_SIZE || cell.y >= GRID_SIZE;
}

function containsCell(cells, target) {
  return cells.some((cell) => sameCell(cell, target));
}

function hasCollision(turns) {
  const collisionBodies = turns.flatMap(({ player, grows }) => (grows ? player.snake : player.snake.slice(0, -1)));

  if (turns.some(({ nextHead }) => isOutsideGrid(nextHead) || containsCell(collisionBodies, nextHead))) {
    return true;
  }

  for (let index = 0; index < turns.length; index += 1) {
    for (let otherIndex = index + 1; otherIndex < turns.length; otherIndex += 1) {
      if (sameCell(turns[index].nextHead, turns[otherIndex].nextHead)) {
        return true;
      }

      if (
        sameCell(turns[index].nextHead, turns[otherIndex].player.snake[0]) &&
        sameCell(turns[otherIndex].nextHead, turns[index].player.snake[0])
      ) {
        return true;
      }
    }
  }

  return false;
}

function sameCell(first, second) {
  return first.x === second.x && first.y === second.y;
}

function sameDirection(first, second) {
  return first.x === second.x && first.y === second.y;
}

function isOpposite(first, second) {
  return first.x + second.x === 0 && first.y + second.y === 0;
}

function cellKey(cell) {
  return `${cell.x}:${cell.y}`;
}

function copyCell(cell) {
  return { x: cell.x, y: cell.y };
}

function createInitialPlayers({ mode, players, snake, direction }) {
  if (players) {
    return players.map((player, index) =>
      createPlayer({
        id: player.id ?? (index === 0 ? PLAYER_IDS.ONE : PLAYER_IDS.TWO),
        label: player.label ?? `Joueur ${index + 1}`,
        snake: player.snake ?? (index === 0 ? DEFAULT_PLAYER_ONE_SNAKE : DEFAULT_PLAYER_TWO_SNAKE),
        direction: player.direction ?? (index === 0 ? DIRECTIONS.RIGHT : DIRECTIONS.LEFT),
        directionQueue: player.directionQueue,
        score: player.score
      })
    );
  }

  const playerOne = createPlayer({
    id: PLAYER_IDS.ONE,
    label: "Joueur 1",
    snake,
    direction
  });

  if (mode !== GAME_MODES.LOCAL_MULTIPLAYER) {
    return [playerOne];
  }

  return [
    playerOne,
    createPlayer({
      id: PLAYER_IDS.TWO,
      label: "Joueur 2",
      snake: DEFAULT_PLAYER_TWO_SNAKE,
      direction: DIRECTIONS.LEFT
    })
  ];
}

function createPlayer({ id, label, snake, direction = DIRECTIONS.RIGHT, directionQueue = [], score = 0 }) {
  return {
    id,
    label,
    snake: snake.map(copyCell),
    direction,
    directionQueue: directionQueue.map(copyDirection),
    score
  };
}

function replacePlayerAt(players, index, nextPlayer) {
  return players.map((player, playerIndex) => (playerIndex === index ? nextPlayer : player));
}

function getOccupiedCells(players) {
  return players.flatMap((player) => player.snake.map(copyCell));
}

function getTotalScore(players) {
  return players.reduce((total, player) => total + player.score, 0);
}

function withPlayerAliases(state) {
  const [primaryPlayer] = state.players;

  return {
    ...state,
    snake: primaryPlayer.snake,
    direction: primaryPlayer.direction,
    directionQueue: primaryPlayer.directionQueue,
    score: getTotalScore(state.players)
  };
}

function copyDirection(direction) {
  return direction;
}
