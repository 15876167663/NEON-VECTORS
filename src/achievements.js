export const ACHIEVEMENTS_KEY = 'neon-vectors:achievements:v1';

const VERSION = 1;

export const ACHIEVEMENTS = [
  {
    id: 'first_kill',
    name: 'FIRST BLOOD',
    desc: '单局击杀 1 个敌人',
    test: (run) => run.kills >= 1,
  },
  {
    id: 'combo_25',
    name: 'CHAIN 25',
    desc: '单局最大连击达到 25',
    test: (run) => run.maxCombo >= 25,
  },
  {
    id: 'combo_50',
    name: 'CHAIN 50',
    desc: '单局最大连击达到 50',
    test: (run) => run.maxCombo >= 50,
  },
  {
    id: 'wave_10',
    name: 'WAVE 10',
    desc: '到达第 10 波',
    test: (run) => run.wave >= 10,
  },
  {
    id: 'boss_1',
    name: 'BOSS HUNTER',
    desc: '击败 1 个 Boss',
    test: (run) => run.bosses >= 1,
  },
  {
    id: 'score_50k',
    name: 'NEON LEGEND',
    desc: '单局得分达到 50,000',
    test: (run) => run.score >= 50000,
  },
  {
    id: 'weapon_max',
    name: 'FULL POWER',
    desc: '武器达到 Lv.5',
    test: (run) => run.weaponLevel >= 5,
  },
  {
    id: 'daily_run',
    name: 'DAILY RUN',
    desc: '完成一局每日挑战',
    test: (run) => run.mode === 'daily',
  },
];

const ACHIEVEMENT_IDS = new Set(ACHIEVEMENTS.map((item) => item.id));

export function emptyAchievements() {
  return { version: VERSION, unlocked: {} };
}

export function normalizeAchievements(raw) {
  if (!raw || typeof raw !== 'object') return emptyAchievements();

  const unlocked = {};
  if (raw.unlocked && typeof raw.unlocked === 'object') {
    for (const [id, at] of Object.entries(raw.unlocked)) {
      const time = Number(at);
      if (ACHIEVEMENT_IDS.has(id) && Number.isFinite(time) && time > 0) {
        unlocked[id] = Math.floor(time);
      }
    }
  }
  return { version: VERSION, unlocked };
}

function resolveStorage(storage) {
  if (storage !== undefined) return storage;
  try {
    return globalThis.localStorage ?? null;
  } catch {
    return null;
  }
}

export function loadAchievements(storage) {
  const store = resolveStorage(storage);
  if (!store) return emptyAchievements();

  try {
    const raw = store.getItem(ACHIEVEMENTS_KEY);
    if (!raw) return emptyAchievements();
    return normalizeAchievements(JSON.parse(raw));
  } catch {
    return emptyAchievements();
  }
}

export function saveAchievements(data, storage) {
  const store = resolveStorage(storage);
  if (!store) return false;

  try {
    store.setItem(ACHIEVEMENTS_KEY, JSON.stringify(normalizeAchievements(data)));
    return true;
  } catch {
    return false;
  }
}

export function unlockAchievements(run, storage) {
  const current = loadAchievements(storage);
  const unlocked = { ...current.unlocked };
  const newlyUnlocked = [];

  for (const achievement of ACHIEVEMENTS) {
    if (unlocked[achievement.id] || !achievement.test(run)) continue;
    unlocked[achievement.id] = Date.now();
    newlyUnlocked.push(achievement);
  }

  const data = { version: VERSION, unlocked };
  const saved = saveAchievements(data, storage);
  return {
    data,
    newlyUnlocked,
    count: Object.keys(unlocked).length,
    total: ACHIEVEMENTS.length,
    saved,
  };
}
