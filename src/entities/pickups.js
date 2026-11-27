import { PICKUP, COLORS } from '../config.js';
import { polygon } from '../core/draw.js';

export class Pickup {
  constructor(kind, x, y) {
    this.kind = kind;
    this.x = x;
    this.y = y;
    const angle = Math.random() * Math.PI * 2;
    const speed = 30 + Math.random() * 45;
    this.vx = Math.cos(angle) * speed * 0.7;
    this.vy = Math.sin(angle) * speed * 0.4 + 40;
    this.life = PICKUP.life;
    this.maxLife = PICKUP.life;
    this.rot = Math.random() * Math.PI * 2;
    this.dead = false;
  }

  update(dt, player) {
    this.life -= dt;
    this.rot += dt * 2.4;

    const dx = player.x - this.x;
    const dy = player.y - this.y;
    const dist = Math.hypot(dx, dy);
    if (dist < PICKUP.magnetRange && dist > 0.001) {
      const pull = 1200 * dt;
      this.vx += (dx / dist) * pull;
      this.vy += (dy / dist) * pull;
    }

    const damp = Math.exp(-1.6 * dt);
    this.vx *= damp;
    this.vy = this.vy * damp + 110 * dt;
    this.x += this.vx * dt;
    this.y += this.vy * dt;

    if (this.life <= 0) this.dead = true;
  }

  draw(ctx) {
    const fade = Math.min(1, this.life / 1.6);
    const isCore = this.kind === 'core';
    const color = isCore ? COLORS.enemyAlt : '#7ef0ff';

    ctx.save();
    ctx.globalAlpha = fade;
    ctx.translate(this.x, this.y);
    ctx.rotate(this.rot);

    ctx.shadowColor = color;
    ctx.shadowBlur = isCore ? 12 : 16;
    ctx.strokeStyle = color;
    ctx.lineWidth = 1.6;
    polygon(ctx, 0, 0, isCore ? 5.5 : 7, 4, 0);
    ctx.stroke();

    ctx.globalAlpha = fade * 0.35;
    ctx.fillStyle = color;
    ctx.fill();

    ctx.restore();
  }
}
