import { VIEW, COLORS, ENEMY } from '../config.js';
import { polygon } from '../core/draw.js';

export class Enemy {
  constructor(x, y, speed) {
    this.x = x;
    this.y = y;
    this.r = 19 + Math.random() * 6;
    this.hp = ENEMY.hp;
    this.vy = speed;
    this.phase = Math.random() * Math.PI * 2;
    this.drift = 18 + Math.random() * 26;
    this.shootT = 1.1 + Math.random() * 0.8;
    this.rot = Math.random() * Math.PI * 2;
    this.spawn = 0;
    this.hitFlash = 0;
    this.dead = false;
  }

  update(dt, scene) {
    this.spawn = Math.min(1, this.spawn + dt * 4);
    if (this.hitFlash > 0) this.hitFlash = Math.max(0, this.hitFlash - dt);

    this.y += this.vy * dt;
    this.x += Math.cos(scene.time * 1.6 + this.phase) * this.drift * dt;
    this.x = Math.max(this.r + 8, Math.min(VIEW.w - this.r - 8, this.x));
    this.rot += dt * 1.2;

    this.shootT -= dt;
    if (this.shootT <= 0 && this.y > 40 && this.y < VIEW.h - 200) {
      this.shootT = Math.max(0.9, 1.5 + Math.random() * 0.5 - scene.time * 0.008);
      scene.spawnEnemyVolley(this);
    }
  }

  draw(ctx) {
    const k = 1 - Math.pow(1 - this.spawn, 3);
    const hot = this.hitFlash > 0;

    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.scale(k, k);
    ctx.rotate(this.rot);

    ctx.strokeStyle = hot ? '#ffffff' : COLORS.enemy;
    ctx.lineWidth = 2;
    ctx.shadowColor = hot ? '#ffffff' : 'rgba(255, 77, 157, 0.85)';
    ctx.shadowBlur = 16;
    polygon(ctx, 0, 0, this.r, 6, -Math.PI / 2);
    ctx.stroke();

    ctx.rotate(-this.rot * 2.6);
    ctx.strokeStyle = hot ? '#ffe9f3' : COLORS.enemyAlt;
    ctx.shadowColor = 'rgba(255, 194, 102, 0.8)';
    ctx.shadowBlur = 12;
    ctx.lineWidth = 1.6;
    polygon(ctx, 0, 0, this.r * 0.5, 4, 0);
    ctx.stroke();

    ctx.shadowBlur = 10;
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(0, 0, this.r * 0.14, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }
}
