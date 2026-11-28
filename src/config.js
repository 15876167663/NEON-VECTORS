export const VIEW = { w: 480, h: 800 };

export const COLORS = {
  bg: '#05070d',
  grid: 'rgba(90, 170, 255, 0.05)',
  frame: 'rgba(120, 200, 255, 0.14)',
  player: '#5df3ff',
  bullet: '#b9f7ff',
  enemy: '#ff4d9d',
  enemyAlt: '#ffc266',
  ebullet: '#ff6bb5',
  hud: '#e8fbff',
  dim: 'rgba(150, 200, 255, 0.55)',
  faint: 'rgba(150, 200, 255, 0.5)',
};

export const FONT = {
  mono: "'Cascadia Mono', 'JetBrains Mono', ui-monospace, Consolas, monospace",
  sans: "'Segoe UI', system-ui, -apple-system, sans-serif",
};

export const DIFFICULTIES = {
  standard: {
    id: 'standard',
    name: '标准',
    shields: 3,
    invulnTime: 1.2,
    spawnScale: 1,
    bulletScale: 1,
  },
  hardcore: {
    id: 'hardcore',
    name: '硬核',
    shields: 1,
    invulnTime: 0,
    spawnScale: 0.85,
    bulletScale: 1.12,
  },
};

export const PLAYER = {
  speed: 330,
  radius: 6,
};

export const ENEMY = {
  bulletSpeed: 178,
  hex: { hp: 3, score: 100 },
  dart: { hp: 2, score: 80 },
  turret: { hp: 6, score: 200 },
  splitter: { hp: 7, score: 220, shards: 2, shardOffset: 18 },
  shard: { hp: 1, score: 40 },
};

export const BOMB = {
  count: 3,
  damage: 3,
  invuln: 2,
};

export const COMBO = {
  baseWindow: 3,
  windowPerCore: 1.5,
  maxWindow: 6,
  perLevel: 3,
  maxMult: 8,
  proximityRange: 90,
  proximityBonus: 1,
};

export const WEAPON = {
  maxLevel: 5,
};

export const PICKUP = {
  magnetRange: 110,
  collectRange: 18,
  life: 12,
  moduleEveryKills: 8,
  shieldChargeMax: 10,
};

export const BOSS = {
  baseHp: 170,
  hpStep: 16,
  hpCap: 470,
  firstAt: 60,
  gapAfter: 45,
  score: 2000,
  radius: 46,
};

export const ENDLESS = {
  rampStart: 60,
  spawnFloor: 0.42,
  spawnRampPerSecond: 0.00045,
  hexFireFloor: 0.68,
};

export const AUDIO = {
  master: 0.85,
  sfx: 0.9,
  music: 0.5,
  reverb: 0.16,
};

export const JUICE = {
  killStop: 0.025,
  phaseStop: 0.09,
  deathSlow: 1.05,
  deathScale: 0.32,
};

export const WAVE_SECONDS = 20;
