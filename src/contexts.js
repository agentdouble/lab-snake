import {
  DEFAULT_GAME_CONTEXT,
  GAME_MAPS,
  GAME_MODES,
  SPEED_PRESETS
} from "./constants.js";

export function createGameContext(context = {}) {
  return {
    mapId: knownId(GAME_MAPS, context.mapId, DEFAULT_GAME_CONTEXT.mapId),
    modeId: knownId(GAME_MODES, context.modeId, DEFAULT_GAME_CONTEXT.modeId),
    speedId: knownId(SPEED_PRESETS, context.speedId, DEFAULT_GAME_CONTEXT.speedId)
  };
}

export function getMapConfig(mapId) {
  return GAME_MAPS.find((map) => map.id === mapId) ?? getMapConfig(DEFAULT_GAME_CONTEXT.mapId);
}

export function getModeConfig(modeId) {
  return GAME_MODES.find((mode) => mode.id === modeId) ?? getModeConfig(DEFAULT_GAME_CONTEXT.modeId);
}

export function getSpeedConfig(speedId) {
  return SPEED_PRESETS.find((speed) => speed.id === speedId) ?? getSpeedConfig(DEFAULT_GAME_CONTEXT.speedId);
}

export function scoreContextKey(context) {
  const normalizedContext = createGameContext(context);

  return `map=${normalizedContext.mapId}|mode=${normalizedContext.modeId}|speed=${normalizedContext.speedId}`;
}

export function sameGameContext(firstContext, secondContext) {
  const first = createGameContext(firstContext);
  const second = createGameContext(secondContext);

  return first.mapId === second.mapId && first.modeId === second.modeId && first.speedId === second.speedId;
}

function knownId(options, candidateId, fallbackId) {
  return options.some((option) => option.id === candidateId) ? candidateId : fallbackId;
}
