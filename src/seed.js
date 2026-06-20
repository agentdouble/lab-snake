const DAILY_PREFIX = "daily";

export function normalizeSeed(seed) {
  return String(seed ?? "").trim();
}

export function getDailyChallengeSeed(date = new Date()) {
  const year = date.getFullYear();
  const month = padDatePart(date.getMonth() + 1);
  const day = padDatePart(date.getDate());

  return `${DAILY_PREFIX}-${year}-${month}-${day}`;
}

export function createSeededRandomizer(seed) {
  const normalizedSeed = normalizeSeed(seed);

  if (!normalizedSeed) {
    throw new Error("A non-empty seed is required.");
  }

  let state = hashSeed(normalizedSeed);

  return function seededRandom() {
    state = (state + 0x6d2b79f5) >>> 0;

    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);

    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

function hashSeed(seed) {
  let hash = 2166136261;

  for (let index = 0; index < seed.length; index += 1) {
    hash ^= seed.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }

  return hash >>> 0;
}

function padDatePart(value) {
  return String(value).padStart(2, "0");
}
