export const DAILY_KEY = 'neon-vectors:daily:v1';

const VERSION = 1;

const toInteger = (value, fallback = 0) => {
  const number = Number(value);
  return Number.isFinite(number) && number >= 0 ? Math.floor(number) : fallback;
};

export function localDateKey(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function formatDailyDate(dateKey) {
  return typeof dateKey === 'string' && dateKey.length >= 10 ? dateKey.slice(5) : '--';
}

export function hashSeed(value) {
  let hash = 2166136261;
  for (let i = 0; i < value.length; i += 1) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

export function createSeededRandom(seed) {
  let state = seed >>> 0;
  return function random() {
    state = (state + 0x6d2b79f5) | 0;
    let value = Math.imul(state ^ (state >>> 15), 1 | state);
    value = (value + Math.imul(value ^ (value >>> 7), 61 | value)) ^ value;
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

export function dailyChallenge(date = new Date()) {
  const dateKey = localDateKey(date);
  const seed = hashSeed(`neon-vectors:${dateKey}`);
  return {
    mode: 'daily',
    dateKey,
    dateLabel: formatDailyDate(dateKey),
    seed,
    seedLabel: seed.toString(16).toUpperCase().padStart(8, '0').slice(-4),
  };
}

export function emptyDailyResult() {
  return {
    version: VERSION,
    dateKey: '',
    bestScore: 0,
    bestWave: 0,
    bosses: 0,
    plays: 0,
    at: 0,
  };
}

export function normalizeDailyResult(raw) {
  if (!raw || typeof raw !== 'object') return emptyDailyResult();
  return {
    version: VERSION,
    dateKey: typeof raw.dateKey === 'string' ? raw.dateKey : '',
    bestScore: toInteger(raw.bestScore),
    bestWave: toInteger(raw.bestWave),
    bosses: toInteger(raw.bosses),
    plays: toInteger(raw.plays),
    at: toInteger(raw.at),
  };
}

function resolveStorage(storage) {
  if (storage !== undefined) return storage;
  try {
    return globalThis.localStorage ?? null;
  } catch {
    return null;
  }
}

export function loadDailyResult(storage) {
  const store = resolveStorage(storage);
  if (!store) return emptyDailyResult();

  try {
    const raw = store.getItem(DAILY_KEY);
    if (!raw) return emptyDailyResult();
    return normalizeDailyResult(JSON.parse(raw));
  } catch {
    return emptyDailyResult();
  }
}

export function saveDailyResult(result, storage) {
  const store = resolveStorage(storage);
  if (!store) return false;

  try {
    store.setItem(DAILY_KEY, JSON.stringify(normalizeDailyResult(result)));
    return true;
  } catch {
    return false;
  }
}

export function recordDailyResult(run, storage) {
  const current = loadDailyResult(storage);
  const dateKey = typeof run?.dateKey === 'string' ? run.dateKey : '';
  const base =
    current.dateKey === dateKey ? current : { ...emptyDailyResult(), dateKey };
  const score = toInteger(run?.score);
  const wave = Math.max(1, toInteger(run?.wave, 1));
  const bosses = toInteger(run?.bosses);
  const isNewBest = score > base.bestScore;

  const result = {
    version: VERSION,
    dateKey,
    bestScore: Math.max(base.bestScore, score),
    bestWave: Math.max(base.bestWave, wave),
    bosses: Math.max(base.bosses, bosses),
    plays: base.plays + 1,
    at: Date.now(),
  };
  const saved = saveDailyResult(result, storage);

  return { result, isNewBest, saved };
}
