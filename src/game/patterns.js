import { ENEMY } from '../config.js';

function emit(scene, x, y, angle, speed, radius) {
  scene.ebullets.push({
    x,
    y,
    vx: Math.cos(angle) * speed,
    vy: Math.sin(angle) * speed,
    r: radius,
  });
}

export function aimedSpread(scene, enemy, count, spread) {
  const base = Math.atan2(scene.player.y - enemy.y, scene.player.x - enemy.x);
  const speed = ENEMY.bulletSpeed * scene.diff.bulletScale;
  for (let i = 0; i < count; i += 1) {
    const offset = (i - (count - 1) / 2) * spread;
    emit(scene, enemy.x, enemy.y, base + offset, speed, 5);
  }
}

export function downFan(scene, enemy, count, spread) {
  const speed = ENEMY.bulletSpeed * 0.92 * scene.diff.bulletScale;
  for (let i = 0; i < count; i += 1) {
    const offset = (i - (count - 1) / 2) * spread;
    emit(scene, enemy.x, enemy.y, Math.PI / 2 + offset, speed, 4.5);
  }
}

export function ringBurst(scene, enemy, count, phase) {
  const speed = ENEMY.bulletSpeed * 0.82 * scene.diff.bulletScale;
  for (let i = 0; i < count; i += 1) {
    emit(scene, enemy.x, enemy.y, phase + (i / count) * Math.PI * 2, speed, 4.5);
  }
}

export function spiralBurst(scene, enemy, arms, phase) {
  const speed = ENEMY.bulletSpeed * 1.06 * scene.diff.bulletScale;
  for (let i = 0; i < arms; i += 1) {
    emit(scene, enemy.x, enemy.y, phase + (i / arms) * Math.PI * 2, speed, 5);
  }
}
