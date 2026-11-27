import { PLAYER } from '../config.js';

const PATTERNS = {
  1: [
    { ox: -7, angle: 0 },
    { ox: 7, angle: 0 },
  ],
  2: [
    { ox: -8, angle: 0 },
    { ox: 0, angle: 0 },
    { ox: 8, angle: 0 },
  ],
  3: [
    { ox: 0, angle: -0.18 },
    { ox: 0, angle: -0.09 },
    { ox: 0, angle: 0 },
    { ox: 0, angle: 0.09 },
    { ox: 0, angle: 0.18 },
  ],
  4: [
    { ox: 0, angle: -0.085 },
    { ox: 0, angle: -0.0425 },
    { ox: 0, angle: 0 },
    { ox: 0, angle: 0.0425 },
    { ox: 0, angle: 0.085 },
    { ox: -12, angle: -0.42 },
    { ox: 12, angle: 0.42 },
  ],
  5: [
    { ox: 0, angle: -0.08 },
    { ox: 0, angle: -0.04 },
    { ox: 0, angle: 0 },
    { ox: 0, angle: 0.04 },
    { ox: 0, angle: 0.08 },
    { ox: 0, angle: -0.28 },
    { ox: 0, angle: 0.28 },
  ],
};

export function fireWeapon(scene, x, y, level) {
  const shots = PATTERNS[Math.min(5, Math.max(1, level))];
  const pierce = level >= 5 ? 1 : 0;

  for (const shot of shots) {
    scene.bullets.push({
      x: x + shot.ox,
      y,
      vx: Math.sin(shot.angle) * PLAYER.bulletSpeed,
      vy: -Math.cos(shot.angle) * PLAYER.bulletSpeed,
      r: 3.5,
      pierce,
      hits: null,
      dead: false,
    });
  }
}
