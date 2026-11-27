import { VIEW, COLORS, ENEMY } from '../config.js';
import { polygon } from '../core/draw.js';
import { aimedSpread, downFan, ringBurst, spiralBurst } from '../game/patterns.js';

let nextId = 1;

function beginShape(ctx, enemy, mirror = 1) {
  const scale = 1 - Math.pow(1 - enemy.spawn, 3);
  ctx.save();
  ctx.translate(enemy.x, enemy.y);
  ctx.scale(scale * mirror, scale);
}

function tick(enemy, dt) {
  enemy.spawn = Math.min(1, enemy.spawn + dt * 4);
  if (enemy.hitFlash > 0) enemy.hitFlash = Math.max(0, enemy.hitFlash - dt);
}

export class HexEnemy {
  constructor(x, y, speed) {
    this.id = nextId++;
    this.kind = 'hex';
    this.x = x;
    this.y = y;
    this.r = 19 + Math.random() * 6;
    this.hp = ENEMY.hex.hp;
    this.score = ENEMY.hex.score;
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
    tick(this, dt);

    this.y += this.vy * dt;
    this.x += Math.cos(scene.time * 1.6 + this.phase) * this.drift * dt;
    this.x = Math.max(this.r + 8, Math.min(VIEW.w - this.r - 8, this.x));
    this.rot += dt * 1.2;

    this.shootT -= dt;
    if (this.shootT <= 0 && this.y > 40 && this.y < VIEW.h - 200) {
      this.shootT = Math.max(0.9, 1.5 + Math.random() * 0.5 - scene.time * 0.008);
      aimedSpread(scene, this, 3, 0.15);
    }
  }

  draw(ctx) {
    const hot = this.hitFlash > 0;
    beginShape(ctx, this);
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

export class DartEnemy {
  constructor(side, y) {
    this.id = nextId++;
    this.kind = 'dart';
    this.x = side > 0 ? -30 : VIEW.w + 30;
    this.y = y;
    this.baseY = y;
    this.r = 16;
    this.hp = ENEMY.dart.hp;
    this.score = ENEMY.dart.score;
    this.vx = side * (230 + Math.random() * 50);
    this.phase = Math.random() * Math.PI * 2;
    this.age = 0;
    this.fired = false;
    this.spawn = 0;
    this.hitFlash = 0;
    this.dead = false;
  }

  update(dt, scene) {
    tick(this, dt);
    this.age += dt;
    this.x += this.vx * dt;
    this.y = this.baseY + Math.sin(this.age * 3 + this.phase) * 16;

    if (!this.fired && this.age > 0.35) {
      this.fired = true;
      downFan(scene, this, 5, 0.55);
    }

    if (this.x < -60 || this.x > VIEW.w + 60) this.dead = true;
  }

  draw(ctx) {
    const hot = this.hitFlash > 0;
    beginShape(ctx, this, this.vx > 0 ? 1 : -1);

    ctx.shadowColor = hot ? '#ffffff' : 'rgba(255, 77, 157, 0.85)';
    ctx.shadowBlur = 16;
    ctx.strokeStyle = hot ? '#ffffff' : COLORS.enemy;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(18, 0);
    ctx.lineTo(-11, -14);
    ctx.lineTo(-4, 0);
    ctx.lineTo(-11, 14);
    ctx.closePath();
    ctx.fillStyle = 'rgba(255, 77, 157, 0.16)';
    ctx.fill();
    ctx.stroke();

    ctx.shadowBlur = 8;
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(6, 0, 2.4, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }
}

export class TurretEnemy {
  constructor(x, hoverY) {
    this.id = nextId++;
    this.kind = 'turret';
    this.x = x;
    this.y = -60;
    this.hoverY = hoverY;
    this.r = 22;
    this.hp = ENEMY.turret.hp;
    this.score = ENEMY.turret.score;
    this.rot = 0;
    this.phase = 0;
    this.volleys = 0;
    this.shootT = 1.5;
    this.driftDir = Math.random() < 0.5 ? 1 : -1;
    this.spawn = 0;
    this.hitFlash = 0;
    this.dead = false;
  }

  update(dt, scene) {
    tick(this, dt);
    this.rot += dt * 0.8;

    if (this.y < this.hoverY) {
      this.y = Math.min(this.hoverY, this.y + 95 * dt);
    } else {
      this.x += this.driftDir * 26 * dt;
      if (this.x < 70 || this.x > VIEW.w - 70) this.driftDir *= -1;
    }

    this.shootT -= dt;
    if (this.shootT <= 0 && this.y >= this.hoverY - 2) {
      this.shootT = 1.5;
      this.volleys += 1;
      if (this.volleys % 3 === 0) spiralBurst(scene, this, 4, this.phase);
      else ringBurst(scene, this, 8, this.phase);
      this.phase += 0.38;
    }
  }

  draw(ctx) {
    const hot = this.hitFlash > 0;
    beginShape(ctx, this);
    ctx.rotate(this.rot);

    ctx.shadowColor = hot ? '#ffffff' : 'rgba(255, 194, 102, 0.85)';
    ctx.shadowBlur = 14;
    ctx.strokeStyle = hot ? '#ffffff' : COLORS.enemyAlt;
    ctx.lineWidth = 2;
    ctx.strokeRect(-18, -18, 36, 36);

    ctx.rotate(-this.rot * 2.2);
    ctx.shadowColor = hot ? '#ffffff' : 'rgba(255, 77, 157, 0.8)';
    ctx.strokeStyle = hot ? '#ffe9f3' : COLORS.enemy;
    ctx.lineWidth = 1.6;
    polygon(ctx, 0, 0, 13, 8, 0);
    ctx.stroke();

    ctx.shadowBlur = 8;
    ctx.fillStyle = '#ffd9ec';
    for (let i = 0; i < 4; i += 1) {
      const angle = this.rot * 1.6 + (i / 4) * Math.PI * 2;
      ctx.beginPath();
      ctx.arc(Math.cos(angle) * 25, Math.sin(angle) * 25, 2, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.shadowBlur = 8;
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(0, 0, 3, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }
}
