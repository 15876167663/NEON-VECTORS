import { VIEW, COLORS, DIFFICULTIES } from '../config.js';
import { getWeapon } from '../game/weapons.js';
import { loadRecords } from '../records.js';
import { dailyChallenge, formatDailyDate, loadDailyResult } from '../daily.js';
import { label, polygon, roundRect } from '../core/draw.js';

const RANK_COLORS = [
  '#ffd166',
  '#d9e6ff',
  '#ff9f6e',
  'rgba(150, 200, 255, 0.55)',
  'rgba(150, 200, 255, 0.45)',
];

function formatDuration(seconds) {
  const total = Math.max(0, Math.round(seconds));
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, '0')}`;
}

export class RecordsScene {
  constructor(game) {
    this.game = game;
    this.time = 0;
    this.records = loadRecords();
    this.daily = dailyChallenge();
    const result = loadDailyResult();
    this.dailyBest = result.dateKey === this.daily.dateKey ? result : null;
  }

  update(dt) {
    this.time += dt;
  }

  keyDown(key) {
    if (key === 'escape' || key === 'l' || key === 't') {
      this.game.audio?.sfx('ui');
      this.game.toTitle();
    }
  }

  pointerDown(pointer) {
    const back = this.backRect();
    const inside =
      pointer.x >= back.x &&
      pointer.x <= back.x + back.w &&
      pointer.y >= back.y &&
      pointer.y <= back.y + back.h;
    if (!inside) return;

    this.game.audio?.sfx('ui');
    this.game.toTitle();
  }

  backRect() {
    return { x: VIEW.w - 96, y: 20, w: 76, h: 30 };
  }

  draw(ctx) {
    const backdrop = this.game.backdrop;
    backdrop.draw(ctx);
    backdrop.drawVignette(ctx);

    const pulse = 0.5 + 0.5 * Math.sin(this.time * 2.2);
    label(ctx, 'RECORDS', VIEW.w / 2, 82, 34, '#8ef6ff', {
      weight: 800,
      glow: 18 + pulse * 6,
    });
    label(ctx, '本机战绩 · TOP 5', VIEW.w / 2, 116, 12, COLORS.dim, {
      weight: 500,
      mono: true,
    });
    const dailyText = this.dailyBest
      ? `DAILY ${this.daily.dateLabel} · BEST ${String(this.dailyBest.bestScore).padStart(6, '0')}`
      : `DAILY ${this.daily.dateLabel} · 尚未挑战`;
    label(ctx, dailyText, VIEW.w / 2, 140, 10, this.dailyBest ? '#ffd166' : COLORS.faint, {
      mono: true,
      weight: 600,
    });

    if (this.records.runs.length) {
      this.records.runs.forEach((run, index) => this.drawRow(ctx, run, index));
    } else {
      this.drawEmpty(ctx);
    }

    this.drawBackButton(ctx);
    label(ctx, 'Esc / L 返回标题', VIEW.w / 2, 726, 12, COLORS.faint, { weight: 500 });
  }

  drawRow(ctx, run, index) {
    const x = 30;
    const y = 168 + index * 96;
    const w = 420;
    const h = 84;
    const weapon = getWeapon(run.weaponId);
    const difficulty = DIFFICULTIES[run.difficultyId] || DIFFICULTIES.standard;
    const rankColor = RANK_COLORS[index] || RANK_COLORS[4];

    ctx.save();
    roundRect(ctx, x, y, w, h, 10);
    ctx.fillStyle = index === 0 ? 'rgba(22, 36, 52, 0.9)' : 'rgba(10, 16, 28, 0.82)';
    ctx.fill();
    ctx.strokeStyle = index < 3 ? rankColor : 'rgba(120, 180, 255, 0.16)';
    ctx.globalAlpha = index < 3 ? 0.55 : 1;
    ctx.lineWidth = index === 0 ? 1.6 : 1;
    ctx.stroke();
    ctx.restore();

    label(ctx, `#${index + 1}`, x + 28, y + 40, 18, rankColor, {
      weight: 700,
      mono: true,
      glow: index < 3 ? 8 : 0,
    });

    label(ctx, String(run.score).padStart(6, '0'), x + 64, y + 33, 23, '#e8fbff', {
      align: 'left',
      weight: 700,
      mono: true,
      glow: index === 0 ? 10 : 0,
    });
    const modeName =
      run.mode === 'daily' ? `DAILY ${formatDailyDate(run.dailyDate)}` : difficulty.name;
    label(ctx, `${weapon.name} · ${modeName}`, x + 64, y + 54, 10, weapon.color, {
      align: 'left',
      weight: 600,
    });
    label(
      ctx,
      `${run.kills} KILLS · ${run.maxCombo} COMBO · ${formatDuration(run.duration)} · ${run.bosses} BOSS`,
      x + 64,
      y + 70,
      9,
      'rgba(150, 200, 255, 0.48)',
      { align: 'left', weight: 500 }
    );

    label(ctx, `WAVE ${run.wave}`, x + w - 24, y + 33, 16, '#ffd9ec', {
      align: 'right',
      weight: 700,
      mono: true,
    });
    label(ctx, `×${run.maxMult}`, x + w - 24, y + 54, 12, '#ffd166', {
      align: 'right',
      weight: 700,
      mono: true,
    });
  }

  drawEmpty(ctx) {
    ctx.save();
    ctx.translate(VIEW.w / 2, 310);
    ctx.rotate(this.time * 0.16);
    ctx.strokeStyle = 'rgba(93, 243, 255, 0.18)';
    ctx.lineWidth = 1;
    polygon(ctx, 0, 0, 92, 6, 0);
    ctx.stroke();
    ctx.restore();

    label(ctx, 'NO RECORDS', VIEW.w / 2, 300, 24, 'rgba(150, 200, 255, 0.55)', {
      weight: 800,
      glow: 12,
    });
    label(ctx, '完成一局后，成绩会自动记录在这里', VIEW.w / 2, 338, 12, COLORS.faint, {
      weight: 500,
    });
    label(ctx, '只保留本机 Top 5', VIEW.w / 2, 364, 11, 'rgba(150, 200, 255, 0.35)', {
      weight: 500,
      mono: true,
    });
  }

  drawBackButton(ctx) {
    const rect = this.backRect();
    ctx.save();
    roundRect(ctx, rect.x, rect.y, rect.w, rect.h, 8);
    ctx.fillStyle = 'rgba(10, 18, 32, 0.75)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(120, 180, 255, 0.25)';
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.restore();
    label(ctx, '返回', rect.x + rect.w / 2, rect.y + rect.h / 2, 11, 'rgba(180, 220, 255, 0.7)', {
      weight: 600,
      mono: true,
    });
  }
}
