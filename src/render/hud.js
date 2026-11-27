import { VIEW, COLORS, FONT, BOMB } from '../config.js';

export function drawHud(ctx, scene) {
  ctx.textBaseline = 'alphabetic';

  ctx.textAlign = 'left';
  ctx.font = `500 11px ${FONT.mono}`;
  ctx.fillStyle = COLORS.dim;
  ctx.fillText('SCORE', 22, 28);

  ctx.save();
  ctx.font = `700 26px ${FONT.mono}`;
  ctx.fillStyle = COLORS.hud;
  ctx.shadowColor = 'rgba(93, 243, 255, 0.55)';
  ctx.shadowBlur = 14;
  ctx.fillText(String(scene.score).padStart(6, '0'), 20, 56);
  ctx.restore();

  ctx.textAlign = 'right';
  ctx.font = `500 11px ${FONT.mono}`;
  ctx.fillStyle = COLORS.dim;
  ctx.fillText('WAVE', VIEW.w - 22, 28);
  ctx.font = `700 26px ${FONT.mono}`;
  ctx.fillStyle = '#ffd9ec';
  ctx.fillText(String(scene.wave).padStart(2, '0'), VIEW.w - 20, 56);

  ctx.textAlign = 'center';
  ctx.font = `500 11px ${FONT.mono}`;
  ctx.fillStyle = 'rgba(150, 200, 255, 0.42)';
  ctx.fillText(scene.diff.name, VIEW.w / 2, 26);

  const player = scene.player;
  for (let i = 0; i < player.maxShields; i++) {
    const x = 24 + i * 20;
    const y = VIEW.h - 24;
    const active = i < player.shields;

    ctx.save();
    ctx.translate(x, y);
    ctx.lineWidth = 1.6;
    ctx.strokeStyle = active ? COLORS.player : 'rgba(93, 243, 255, 0.18)';
    if (active) {
      ctx.shadowColor = COLORS.player;
      ctx.shadowBlur = 10;
    }
    ctx.beginPath();
    ctx.moveTo(0, -7);
    ctx.lineTo(6, 5);
    ctx.lineTo(-6, 5);
    ctx.closePath();
    ctx.stroke();
    ctx.restore();
  }

  for (let i = 0; i < BOMB.count; i += 1) {
    const x = VIEW.w - 30 - i * 18;
    const y = VIEW.h - 24;
    const active = i < scene.bombs;

    ctx.save();
    ctx.translate(x, y);
    ctx.beginPath();
    ctx.moveTo(0, -6);
    ctx.lineTo(5, 0);
    ctx.lineTo(0, 6);
    ctx.lineTo(-5, 0);
    ctx.closePath();
    if (active) {
      ctx.fillStyle = 'rgba(255, 194, 102, 0.9)';
      ctx.shadowColor = 'rgba(255, 194, 102, 0.9)';
      ctx.shadowBlur = 8;
      ctx.fill();
    } else {
      ctx.strokeStyle = 'rgba(255, 194, 102, 0.22)';
      ctx.lineWidth = 1.2;
      ctx.stroke();
    }
    ctx.restore();
  }

  ctx.textAlign = 'right';
  ctx.font = `500 10px ${FONT.mono}`;
  ctx.fillStyle = 'rgba(150, 200, 255, 0.32)';
  ctx.fillText('X', VIEW.w - 20, VIEW.h - 42);
}
