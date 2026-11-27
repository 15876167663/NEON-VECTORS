const PARALLEL = (offsets) => offsets.map((ox) => ({ ox, angle: 0 }));

const FAN = (angles) => angles.map((angle) => ({ ox: 0, angle }));

export const WEAPON_ORDER = ['pulse', 'lance', 'scatter'];

export const WEAPONS = {
  pulse: {
    id: 'pulse',
    name: 'PULSE',
    role: '均衡扇射',
    desc: ['五发核心 + 双侧翼', '远近都能打', '推荐新手'],
    color: '#b9f7ff',
    speed: 720,
    radius: 3.5,
    len: 16,
    width: 3,
    levels: [
      { shots: PARALLEL([-7, 7]), damage: 1, pierce: 0, fireRate: 7.5 },
      { shots: PARALLEL([-8, 0, 8]), damage: 1, pierce: 0, fireRate: 7.5 },
      { shots: FAN([-0.18, -0.09, 0, 0.09, 0.18]), damage: 1, pierce: 0, fireRate: 7.5 },
      {
        shots: [
          ...FAN([-0.085, -0.0425, 0, 0.0425, 0.085]),
          { ox: -12, angle: -0.42 },
          { ox: 12, angle: 0.42 },
        ],
        damage: 1,
        pierce: 0,
        fireRate: 7.5,
      },
      {
        shots: [
          ...FAN([-0.08, -0.04, 0, 0.04, 0.08]),
          { ox: 0, angle: -0.28 },
          { ox: 0, angle: 0.28 },
        ],
        damage: 1,
        pierce: 1,
        fireRate: 7.5,
      },
    ],
  },
  lance: {
    id: 'lance',
    name: 'LANCE',
    role: '精准穿透',
    desc: ['单发高伤 · 贯穿直线', '打 Boss 强', '需要对准'],
    color: '#ffd166',
    speed: 900,
    radius: 4.5,
    len: 30,
    width: 3.6,
    levels: [
      { shots: FAN([0]), damage: 3, pierce: 1, fireRate: 4.5 },
      { shots: FAN([0]), damage: 3, pierce: 2, fireRate: 4.8 },
      { shots: FAN([0]), damage: 4, pierce: 2, fireRate: 5.1 },
      { shots: FAN([0]), damage: 4, pierce: 3, fireRate: 5.4 },
      { shots: FAN([0]), damage: 5, pierce: 3, fireRate: 5.7 },
    ],
  },
  scatter: {
    id: 'scatter',
    name: 'SCATTER',
    role: '近距爆发',
    desc: ['九发霰射 · 越近越强', '清群极快', '远距离乏力'],
    color: '#ff8fc4',
    speed: 760,
    radius: 3.2,
    len: 10,
    width: 2.6,
    levels: [
      { shots: FAN([-0.14, 0, 0.14]), damage: 1, pierce: 0, fireRate: 4.2 },
      { shots: FAN([-0.18, -0.09, 0, 0.09, 0.18]), damage: 1.05, pierce: 0, fireRate: 4.4 },
      {
        shots: FAN([-0.22, -0.1467, -0.0733, 0, 0.0733, 0.1467, 0.22]),
        damage: 1.15,
        pierce: 0,
        fireRate: 4.6,
      },
      {
        shots: FAN([-0.22, -0.1467, -0.0733, 0, 0.0733, 0.1467, 0.22]),
        damage: 1.25,
        pierce: 0,
        fireRate: 4.8,
      },
      {
        shots: FAN([-0.28, -0.21, -0.14, -0.07, 0, 0.07, 0.14, 0.21, 0.28]),
        damage: 1.35,
        pierce: 0,
        fireRate: 5,
      },
    ],
  },
};

const clampLevel = (level) => Math.min(5, Math.max(1, Math.floor(level) || 1));

export function getWeapon(id) {
  return WEAPONS[id] || WEAPONS.pulse;
}

export function getWeaponTier(id, level) {
  return getWeapon(id).levels[clampLevel(level) - 1];
}

export function getWeaponFireRate(id, level) {
  return getWeaponTier(id, level).fireRate;
}

export function fireWeapon(scene, x, y, weaponId, level) {
  const weapon = getWeapon(weaponId);
  const tier = getWeaponTier(weapon.id, level);

  for (const shot of tier.shots) {
    scene.bullets.push({
      x: x + shot.ox,
      y,
      vx: Math.sin(shot.angle) * weapon.speed,
      vy: -Math.cos(shot.angle) * weapon.speed,
      r: weapon.radius,
      len: weapon.len,
      width: weapon.width,
      color: weapon.color,
      damage: tier.damage,
      pierce: tier.pierce,
      hits: null,
      dead: false,
    });
  }
}
