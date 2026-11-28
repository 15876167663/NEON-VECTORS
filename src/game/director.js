import { VIEW, ENDLESS } from '../config.js';
import {
  HexEnemy,
  DartEnemy,
  TurretEnemy,
  SplitterEnemy,
} from '../entities/enemy.js';

const TABLE = [
  { until: 18, mix: { hex: 1 } },
  { until: 36, mix: { hex: 0.65, dart: 0.35 } },
  { until: 60, mix: { hex: 0.38, dart: 0.27, turret: 0.2, splitter: 0.15 } },
  { until: Infinity, mix: { hex: 0.33, dart: 0.29, turret: 0.2, splitter: 0.18 } },
];

export function pickType(time, roll = Math.random()) {
  const row = TABLE.find((entry) => time < entry.until);
  for (const [type, weight] of Object.entries(row.mix)) {
    if (roll < weight) return type;
    roll -= weight;
  }
  return 'hex';
}

export function spawnEnemy(scene, time) {
  let type = pickType(time);

  if (type === 'dart') {
    const side = Math.random() < 0.5 ? 1 : -1;
    const y = 110 + Math.random() * 170;
    scene.enemies.push(new DartEnemy(side, y));
    return;
  }

  if (type === 'turret') {
    const active = scene.enemies.filter((enemy) => enemy.kind === 'turret' && !enemy.dead).length;
    if (active >= 2) type = 'hex';
  }

  if (type === 'turret') {
    const x = 80 + Math.random() * (VIEW.w - 160);
    const hoverY = 130 + Math.random() * 90;
    scene.enemies.push(new TurretEnemy(x, hoverY));
    return;
  }

  if (type === 'splitter') {
    const active = scene.enemies.filter(
      (enemy) => enemy.kind === 'splitter' && !enemy.dead
    ).length;
    if (active >= 2) {
      type = 'hex';
    } else {
      const speed = 34 + Math.random() * 20 + Math.min(time * 0.35, 24);
      scene.enemies.push(
        new SplitterEnemy(70 + Math.random() * (VIEW.w - 140), -50, speed)
      );
      return;
    }
  }

  const speed = 42 + Math.random() * 26 + Math.min(time * 0.5, 40);
  scene.enemies.push(new HexEnemy(60 + Math.random() * (VIEW.w - 120), -40, speed));
}

export function spawnInterval(time) {
  const base = Math.max(0.5, 1.5 - time * 0.016);
  const ramp = Math.max(0, time - ENDLESS.rampStart) * ENDLESS.spawnRampPerSecond;
  return Math.max(ENDLESS.spawnFloor, base - ramp);
}
