export const RECORDS_KEY = 'neon-vectors:records:v1';
export const MAX_RUNS = 5;

const VERSION = 1;

export function emptyRecords() {
  return {
    version: VERSION,
    best: { score: 0, wave: 0, combo: 0, mult: 1 },
    runs: [],
  };
}

const toNumber = (value, fallback = 0) => {
  const number = Number(value);
  return Number.isFinite(number) && number >= 0 ? number : fallback;
};

const toInteger = (value, fallback = 0) => Math.floor(toNumber(value, fallback));

function sanitizeRun(raw) {
  if (!raw || typeof raw !== 'object') return null;

  const score = toInteger(raw.score, 0);
  if (score <= 0) return null;

  return {
    score,
    wave: Math.max(1, toInteger(raw.wave, 1)),
    kills: toInteger(raw.kills, 0),
    maxCombo: toInteger(raw.maxCombo, 0),
    maxMult: Math.max(1, toInteger(raw.maxMult, 1)),
    weaponId: typeof raw.weaponId === 'string' && raw.weaponId ? raw.weaponId : 'pulse',
    difficultyId:
      typeof raw.difficultyId === 'string' && raw.difficultyId
        ? raw.difficultyId
        : 'standard',
    duration: Math.round(toNumber(raw.duration, 0) * 10) / 10,
    bosses: toInteger(raw.bosses, 0),
    mode: raw.mode === 'daily' ? 'daily' : 'endless',
    dailyDate: typeof raw.dailyDate === 'string' ? raw.dailyDate : '',
    at: toInteger(raw.at, 0),
  };
}

export function compareRuns(a, b) {
  if (b.score !== a.score) return b.score - a.score;
  if (b.wave !== a.wave) return b.wave - a.wave;
  if (a.duration !== b.duration) return a.duration - b.duration;
  return a.at - b.at;
}

export function rankRuns(runs, limit = MAX_RUNS) {
  return runs.slice().sort(compareRuns).slice(0, limit);
}

export function normalizeRecords(raw) {
  if (!raw || typeof raw !== 'object') return emptyRecords();

  const allRuns = Array.isArray(raw.runs)
    ? raw.runs.map(sanitizeRun).filter(Boolean)
    : [];
  const best = {
    score: toInteger(raw.best?.score, 0),
    wave: toInteger(raw.best?.wave, 0),
    combo: toInteger(raw.best?.combo, 0),
    mult: Math.max(1, toInteger(raw.best?.mult, 1)),
  };

  for (const run of allRuns) {
    best.score = Math.max(best.score, run.score);
    best.wave = Math.max(best.wave, run.wave);
    best.combo = Math.max(best.combo, run.maxCombo);
    best.mult = Math.max(best.mult, run.maxMult);
  }

  return {
    version: VERSION,
    best,
    runs: rankRuns(allRuns, MAX_RUNS),
  };
}

export function addRun(records, run, limit = MAX_RUNS) {
  const current = normalizeRecords(records);
  const entry = sanitizeRun(run);

  if (!entry) {
    return {
      records: current,
      best: current.best,
      isNewRecord: false,
      rank: null,
    };
  }

  const isNewRecord = entry.score > current.best.score;
  const best = {
    score: Math.max(current.best.score, entry.score),
    wave: Math.max(current.best.wave, entry.wave),
    combo: Math.max(current.best.combo, entry.maxCombo),
    mult: Math.max(current.best.mult, entry.maxMult),
  };
  const runs = rankRuns([...current.runs, entry], limit);
  const rank = runs.indexOf(entry) + 1;

  return {
    records: { version: VERSION, best, runs },
    best,
    isNewRecord,
    rank: rank > 0 ? rank : null,
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

export function loadRecords(storage) {
  const store = resolveStorage(storage);
  if (!store) return emptyRecords();

  try {
    const raw = store.getItem(RECORDS_KEY);
    if (!raw) return emptyRecords();
    return normalizeRecords(JSON.parse(raw));
  } catch {
    return emptyRecords();
  }
}

export function saveRecords(records, storage) {
  const store = resolveStorage(storage);
  if (!store) return false;

  try {
    store.setItem(RECORDS_KEY, JSON.stringify(normalizeRecords(records)));
    return true;
  } catch {
    return false;
  }
}

export function recordRun(run, storage) {
  const records = loadRecords(storage);
  const result = addRun(records, run);
  const saved = saveRecords(result.records, storage);
  return { ...result, saved };
}
