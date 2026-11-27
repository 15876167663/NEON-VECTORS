import { VIEW, COLORS, PLAYER } from '../config.js';

export class Player {
  constructor(diff) {
    this.x = VIEW.w / 2;
    this.y = VIEW.h - 120;
    this.radius = PLAYER.radius;
    this.shields = diff.shields;
    this.maxShields = diff.shields;
    this.invuln = 0;
    this.fireT = 0;
    this.weaponLevel = 1;
  }

  update(dt, input, scene) {
    if (this.invuln > 0) this.invuln = Math.max(0, this.invuln - dt);

    const keys = input.keys;
    let ix = 0;
    let iy = 0;
    if (keys.has('a') || keys.has('arrowleft')) ix -= 1;
    if (keys.has('d') || keys.has('arrowright')) ix += 1;
    if (keys.has('w') || keys.has('arrowup')) iy -= 1;
    if (keys.has('s') || keys.has('arrowdown')) iy += 1;

    if (ix || iy) {
      const len = Math.hypot(ix, iy);
      this.x += (ix / len) * PLAYER.speed * dt;
      this.y += (iy / len) * PLAYER.speed * dt;
    } else if (scene.pointerActive && input.pointer.down) {
      const pointer = input.pointer;
      const targetY = pointer.touch ? pointer.y - 38 : pointer.y;
      const k = 1 - Math.exp(-16 * dt);
      this.x += (pointer.x - this.x) * k;
      this.y += (targetY - this.y) * k;
    }

    this.x = Math.max(16, Math.min(VIEW.w - 16, this.x));
    this.y = Math.max(VIEW.h * 0.15, Math.min(VIEW.h - 26, this.y));

    this.fireT -= dt;
    while (this.fireT <= 0) {
      scene.playerFire(this);
      this.fireT += 1 / PLAYER.fireRate;
    }
  }

  draw(ctx) {
    const flicker = 8 + Math.random() * 9;
    const blink = this.invuln > 0 && Math.floor(this.invuln * 12) % 2 === 0;

    ctx.save();
    ctx.translate(this.x, this.y);
    if (blink) ctx.globalAlpha = 0.35;

    ctx.globalCompositeOperation = 'lighter';
    const flame = ctx.createLinearGradient(0, 8, 0, 8 + flicker);
    flame.addColorStop(0, 'rgba(120, 250, 255, 0.75)');
    flame.addColorStop(1, 'rgba(60, 120, 255, 0)');
    ctx.fillStyle = flame;
    ctx.beginPath();
    ctx.moveTo(-4.5, 9);
    ctx.lineTo(0, 9 + flicker);
    ctx.lineTo(4.5, 9);
    ctx.closePath();
    ctx.fill();
    ctx.globalCompositeOperation = 'source-over';

    ctx.shadowColor = 'rgba(93, 243, 255, 0.9)';
    ctx.shadowBlur = 20;
    ctx.strokeStyle = '#d9fdff';
    ctx.lineWidth = 2;
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(0, -16);
    ctx.lineTo(11, 12);
    ctx.lineTo(0, 5);
    ctx.lineTo(-11, 12);
    ctx.closePath();
    ctx.fillStyle = 'rgba(93, 243, 255, 0.16)';
    ctx.fill();
    ctx.stroke();

    ctx.restore();
  }
}
