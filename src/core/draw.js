import { FONT } from '../config.js';

export function polygon(ctx, x, y, r, sides, rot = 0) {
  ctx.beginPath();
  for (let i = 0; i < sides; i++) {
    const a = rot + (i / sides) * Math.PI * 2;
    const px = x + Math.cos(a) * r;
    const py = y + Math.sin(a) * r;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
}

export function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

export function label(ctx, str, x, y, size, color, opt = {}) {
  ctx.save();
  ctx.font = `${opt.weight || 600} ${size}px ${opt.mono ? FONT.mono : FONT.sans}`;
  ctx.textAlign = opt.align || 'center';
  ctx.textBaseline = opt.baseline || 'middle';
  if (opt.glow) {
    ctx.shadowColor = color;
    ctx.shadowBlur = opt.glow;
  }
  if (opt.alpha != null) ctx.globalAlpha = opt.alpha;
  ctx.fillStyle = color;
  ctx.fillText(str, x, y);
  ctx.restore();
}
