import { VIEW, BOSS } from '../config.js';
import { polygon } from '../core/draw.js';
import {
  aimedSpread,
  ringBurst,
  spiralBurst,
  splitFan,
  splitRing,
  counterRing,
} from '../game/patterns.js';

const KITS = {
  hex: {
    name: 'HEX',
    colors: ['#ff4d9d', '#ff8fc4', '#ff2d55'],
    phases: [
      {
        main: (scene, boss) => aimedSpread(scene, boss, 5, 0.13),
        mainCd: 1.7,
        sub: (scene, boss) => ringBurst(scene, boss, 8, -boss.rot),
        subCd: 2.4,
      },
      {
        main: (scene, boss) => ringBurst(scene, boss, 9, boss.rot),
        mainCd: 1.3,
        sub: (scene, boss) => spiralBurst(scene, boss, 2, boss.rot),
        subCd: 0.3,
      },
      {
        main: (scene, boss) => ringBurst(scene, boss, 12, boss.rot * 1.4),
        mainCd: 1.05,
        sub: (scene, boss) => spiralBurst(scene, boss, 2, boss.rot * 1.3),
        subCd: 0.42,
      },
    ],
  },
  orbit: {
    name: 'ORBIT',
    colors: ['#b28dff', '#d9c2ff', '#8a5cff'],
    phases: [
      {
        main: (scene, boss) => counterRing(scene, boss, 7, boss.rot),
        mainCd: 1.6,
        sub: (scene, boss) => aimedSpread(scene, boss, 3, 0.1),
        subCd: 1.05,
      },
      {
        main: (scene, boss) => spiralBurst(scene, boss, 3, boss.rot),
        mainCd: 0.6,
        sub: (scene, boss) => counterRing(scene, boss, 11, -boss.rot),
        subCd: 1.8,
      },
      {
        main: (scene, boss) => spiralBurst(scene, boss, 4, boss.rot * 1.2),
        mainCd: 0.46,
        sub: (scene, boss) => counterRing(scene, boss, 14, -boss.rot * 1.3),
        subCd: 1.5,
      },
    ],
  },
  prism: {
    name: 'PRISM',
    colors: ['#ffc266', '#ffe0a3', '#ff9f43'],
    phases: [
      {
        main: (scene, boss) => splitFan(scene, boss, 3, 0.5),
        mainCd: 2,
        sub: (scene, boss) => aimedSpread(scene, boss, 3, 0.09),
        subCd: 1.15,
      },
      {
        main: (scene, boss) => splitRing(scene, boss, 10, boss.rot),
        mainCd: 1.7,
        sub: (scene, boss) => spiralBurst(scene, boss, 2, -boss.rot),
        subCd: 0.5,
      },
      {
        main: (scene, boss) => splitRing(scene, boss, 14, boss.rot * 1.3),
        mainCd: 1.45,
        sub: (scene, boss) => aimedSpread(scene, boss, 7, 0.12),
        subCd: 0.95,
      },
    ],
  },
};

const ORDER = ['hex', 'orbit', 'prism'];

export class Boss {
  constructor(index) {
    this.index = index;
    this.kind = ORDER[(index - 1) % ORDER.length];
    this.x = VIEW.w / 2;
    this.y = -120;
    this.targetY = 150;
    this.r = BOSS.radius;
    this.maxHp = Math.min(BOSS.hpCap, BOSS.baseHp + (index - 1) * BOSS.hpStep);
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
    return KITS[this.kind].colors[this.phase - 1];
  }

  get name() {
    return KITS[this.kind].name;
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
    const kit = KITS[this.kind].phases[this.phase - 1];

    if (this.shootMain <= 0) {
      kit.main(scene, this);
      this.shootMain = kit.mainCd;
    }

    if (this.shootSub <= 0) {
      kit.sub(scene, this);
      this.shootSub = kit.subCd;
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

  drawHex(ctx, color, hot) {
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
  }

  drawPrism(ctx, color, hot) {
    ctx.strokeStyle = hot ? '#ffffff' : color;
    ctx.shadowColor = color;
    ctx.shadowBlur = 26;
    ctx.lineWidth = 2.5;
    polygon(ctx, 0, 0, this.r, 4, 0);
    ctx.stroke();

    ctx.rotate(Math.PI / 4);
    ctx.strokeStyle = hot ? '#ffffff' : '#fff0c9';
    ctx.shadowColor = '#ffe0a3';
    ctx.shadowBlur = 12;
    ctx.lineWidth = 1.5;
    polygon(ctx, 0, 0, this.r * 0.58, 4, 0);
    ctx.stroke();

    ctx.rotate(-this.rot * 1.6);
    ctx.shadowBlur = 16;
    ctx.fillStyle = hot ? '#ffffff' : color;
    polygon(ctx, 0, 0, this.r * 0.17, 4, Math.PI / 4);
    ctx.fill();
  }

  drawOrbit(ctx, color, hot) {
    ctx.strokeStyle = hot ? '#ffffff' : color;
    ctx.shadowColor = color;
    ctx.shadowBlur = 22;
    ctx.lineWidth = 2.6;
    ctx.beginPath();
    ctx.arc(0, 0, this.r, 0, Math.PI * 2);
    ctx.stroke();

    ctx.strokeStyle = hot ? '#ffffff' : '#d9c2ff';
    ctx.shadowColor = '#d9c2ff';
    ctx.shadowBlur = 10;
    ctx.lineWidth = 1.3;
    ctx.beginPath();
    ctx.arc(0, 0, this.r * 0.55, 0, Math.PI * 2);
    ctx.stroke();

    ctx.fillStyle = '#ffffff';
    ctx.shadowColor = '#ffffff';
    ctx.shadowBlur = 8;
    for (let i = 0; i < 2; i += 1) {
      const angle = this.t * 2.4 + i * Math.PI;
      ctx.beginPath();
      ctx.arc(
        Math.cos(angle) * this.r * 0.82,
        Math.sin(angle) * this.r * 0.82,
        4.5,
        0,
        Math.PI * 2
      );
      ctx.fill();
    }

    ctx.fillStyle = hot ? '#ffffff' : color;
    ctx.shadowColor = color;
    ctx.shadowBlur = 16;
    ctx.beginPath();
    ctx.arc(0, 0, this.r * 0.18, 0, Math.PI * 2);
    ctx.fill();
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

    if (this.kind === 'hex') this.drawHex(ctx, color, hot);
    else if (this.kind === 'prism') this.drawPrism(ctx, color, hot);
    else this.drawOrbit(ctx, color, hot);

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

    if (this.state === 'fighting') {
      const warn = Math.min(this.shootMain, this.shootSub);
      if (warn < 0.34) {
        const k = 1 - warn / 0.34;
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.strokeStyle = color;
        ctx.globalAlpha = 0.16 + k * 0.5;
        ctx.lineWidth = 1.4 + k * 2;
        ctx.shadowColor = color;
        ctx.shadowBlur = 12;
        ctx.beginPath();
        ctx.arc(0, 0, this.r + 8 + (1 - k) * 30, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      }
    }
  }
}
