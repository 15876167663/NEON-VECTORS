import { VIEW, COLORS } from '../config.js';
import { isLowQuality } from '../settings.js';

export class Backdrop {
  constructor() {
    this.stars = Array.from({ length: 90 }, () => ({
      x: Math.random() * VIEW.w,
      y: Math.random() * VIEW.h,
      z: 0.2 + Math.random() * 0.9,
    }));
    this.scroll = 0;
    this.glow = null;
    this.vignette = null;
  }

  refresh(ctx) {
    this.glow = ctx.createRadialGradient(VIEW.w / 2, VIEW.h + 80, 0, VIEW.w / 2, VIEW.h + 80, 460);
    this.glow.addColorStop(0, 'rgba(50, 130, 255, 0.22)');
    this.glow.addColorStop(1, 'rgba(50, 130, 255, 0)');

    this.vignette = ctx.createRadialGradient(
      VIEW.w / 2,
      VIEW.h / 2,
      VIEW.h * 0.28,
      VIEW.w / 2,
      VIEW.h / 2,
      VIEW.h * 0.8
    );
    this.vignette.addColorStop(0, 'rgba(0, 0, 0, 0)');
    this.vignette.addColorStop(1, 'rgba(0, 0, 0, 0.55)');
  }

  update(dt) {
    this.scroll += 30 * dt;
    const total = isLowQuality() ? Math.ceil(this.stars.length / 2) : this.stars.length;
    for (let i = 0; i < total; i += 1) {
      const star = this.stars[i];
      star.y += (18 + star.z * 95) * dt;
      if (star.y > VIEW.h + 4) {
        star.y = -4;
        star.x = Math.random() * VIEW.w;
      }
    }
  }

  draw(ctx) {
    ctx.fillStyle = COLORS.bg;
    ctx.fillRect(-60, -60, VIEW.w + 120, VIEW.h + 120);

    if (this.glow) {
      ctx.fillStyle = this.glow;
      ctx.fillRect(0, 0, VIEW.w, VIEW.h);
    }

    ctx.strokeStyle = COLORS.grid;
    ctx.lineWidth = 1;
    ctx.beginPath();
    const size = 60;
    const offset = this.scroll % size;
    for (let y = offset - size; y < VIEW.h + size; y += size) {
      ctx.moveTo(0, y);
      ctx.lineTo(VIEW.w, y);
    }
    for (let x = 0; x <= VIEW.w; x += size) {
      ctx.moveTo(x, 0);
      ctx.lineTo(x, VIEW.h);
    }
    ctx.stroke();

    for (const star of this.stars) {
      ctx.globalAlpha = 0.15 + star.z * 0.45;
      ctx.fillStyle = '#a9d8ff';
      ctx.beginPath();
      ctx.arc(star.x, star.y, 0.6 + star.z * 1.2, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  drawVignette(ctx) {
    if (!this.vignette) return;
    ctx.fillStyle = this.vignette;
    ctx.fillRect(0, 0, VIEW.w, VIEW.h);
  }
}
