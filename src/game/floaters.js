import { label } from '../core/draw.js';

export function spawnFloater(list, x, y, text, color, size = 13) {
  list.push({ x, y, text, color, size, life: 0.9, maxLife: 0.9 });
}

export function updateFloaters(list, dt) {
  for (const floater of list) {
    floater.life -= dt;
    floater.y -= 42 * dt;
  }
  for (let i = list.length - 1; i >= 0; i -= 1) {
    if (list[i].life <= 0) list.splice(i, 1);
  }
}

export function drawFloaters(ctx, list) {
  for (const floater of list) {
    const alpha = Math.min(1, (floater.life / floater.maxLife) * 1.6);
    label(ctx, floater.text, floater.x, floater.y, floater.size, floater.color, {
      weight: 700,
      alpha,
      glow: 8,
    });
  }
}
