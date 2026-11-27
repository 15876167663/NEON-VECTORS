import { VIEW, BOSS } from '../config.js';
import { polygon } from '../core/draw.js';
import { aimedSpread, ringBurst, spiralBurst } from '../game/patterns.js';

const COLORS_BY_PHASE = ['#ff4d9d', '#ffc266', '#ff2d55'];

export class Boss {
  constructor(index) {
    this.index = index;
    this.x = VIEW.w / 2;
    this.y = -120;
    this.targetY = 150;
    this.r = BOSS.radius;
    this.maxHp = BOSS.baseHp + (index - 1) * BOSS.hpStep;
    this.hp = this.maxHp;
    this.phase = 1;
    this.state = 'entering';
    this.t = 0;
    this.stateT = 0;
    this.rot = 0;
    this.hitFlash = 0;
    this.shootMain = 1.2;
    this.shootSub = 1.6;
    this.dir = Math.random() < 0.5 ? 1 : -1;
    this.dead = false;
  }

  get color() {
    return COLORS_BY_PHASE[this.phase - 1];
  }

  update(dt, scene) {
    this.t += dt;
    if (this.hitFlash > 0) this.hitFlash = Math.max(0, this.hitFlash - dt);
    this.rot += dt * (0.6 + this.phase * 0.25);

    if (this.state === 'entering') {
      this.y += 90 * dt;
      if (this.y >= this.targetY) {
        this.y = this.targetY;
        this.state = 'fighting';
        this.shootMain = 1.2;
        this.shootSub = 1.6;
      }
      return;
    }

    if (this.state === 'transition') {
      this.stateT -= dt;
      this.y += (this.targetY - this.y) * Math.min(1, dt * 3);
      if (this.stateT <= 0) {
        this.state = 'fighting';
        this.shootMain = 0.7;
        this.shootSub = 1;
      }
      return;
    }

    if (this.state === 'dying') {
      this.stateT -= dt;
      if (this.stateT <= 0) this.dead = true;
      return;
    }

    this.x += this.dir * (42 + this.phase * 14) * dt;
    if (this.x < 90 || this.x > VIEW.w - 90) this.dir *= -1;
    this.y = this.targetY + Math.sin(this.t * 1.3) * 18;

    this.shootMain -= dt;
    this.shootSub -= dt;

    if (this.shootMain <= 0) {
      if (this.phase === 1) {
        aimedSpread(scene, this, 5, 0.13);
        this.shootMain = 1.7;
      } else if (this.phase === 2) {
        ringBurst(scene, this, 9, this.rot);
        this.shootMain = 1.3;
      } else {
        ringBurst(scene, this, 12, this.rot * 1.4);
        this.shootMain = 1.05;
      }
    }

    if (this.shootSub <= 0) {
      if (this.phase === 1) {
        ringBurst(scene, this, 8, -this.rot);
        this.shootSub = 2.4;
      } else if (this.phase === 2) {
        spiralBurst(scene, this, 2, this.rot);
        this.shootSub = 0.3;
      } else {
        spiralBurst(scene, this, 2, this.rot * 1.3);
        this.shootSub = 0.42;
      }
    }
  }

  damage(amount, scene) {
    if (this.state !== 'fighting') return;

    this.hp -= amount;
    this.hitFlash = 0.08;

    if (this.hp <= 0) {
      this.hp = 0;
      this.state = 'dying';
      this.stateT = 1.3;
      scene.onBossDeath(this);
      return;
    }

    const ratio = this.hp / this.maxHp;
    const nextPhase = ratio > 0.66 ? 1 : ratio > 0.33 ? 2 : 3;
    if (nextPhase > this.phase) {
      this.phase = nextPhase;
      this.state = 'transition';
      this.stateT = 0.9;
      scene.onBossPhase(this);
    }
  }

  draw(ctx) {
    const color = this.color;
    const hot = this.hitFlash > 0;
    const scale =
      this.state === 'entering' ? Math.max(0.2, Math.min(1, (this.y + 120) / 240)) : 1;

    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.scale(scale, scale);
    ctx.rotate(this.rot);

    ctx.strokeStyle = hot ? '#ffffff' : color;
    ctx.shadowColor = color;
    ctx.shadowBlur = 26;
    ctx.lineWidth = 2.5;
    polygon(ctx, 0, 0, this.r, 6, 0);
    ctx.stroke();

    ctx.rotate(-this.rot * 2.2);
    ctx.strokeStyle = hot ? '#ffe9f3' : '#e8fbff';
    ctx.shadowColor = '#ffffff';
    ctx.shadowBlur = 14;
    ctx.lineWidth = 1.6;
    polygon(ctx, 0, 0, this.r * 0.55, 3, 0);
    ctx.stroke();

    ctx.shadowBlur = 18;
    ctx.fillStyle = hot ? '#ffffff' : color;
    ctx.beginPath();
    ctx.arc(0, 0, this.r * 0.22, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();

    if (this.state === 'transition') {
      ctx.save();
      ctx.translate(this.x, this.y);
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(0, 0, this.r + 10 + Math.sin(this.t * 20) * 3, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }
  }
}
