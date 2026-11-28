import { VIEW, COLORS, DIFFICULTIES } from '../config.js';
import { polygon, roundRect, label } from '../core/draw.js';
import { loadRecords } from '../records.js';
import { dailyChallenge, loadDailyResult } from '../daily.js';

const CARDS = [
  {
    id: 'standard',
    title: '标准',
    lines: ['3 点护盾', '受击无敌 1.2 秒', '先熟悉弹幕节奏'],
  },
  {
    id: 'hardcore',
    title: '硬核',
    lines: ['一命通关', '弹幕更密更快', '给老手的挑战'],
  },
];

export class TitleScene {
  constructor(game) {
    this.game = game;
    this.time = 0;
    this.index = 0;
    this.records = loadRecords();
    this.refreshDaily();
  }

  enter() {
    this.records = loadRecords();
    this.refreshDaily();
  }

  refreshDaily() {
    this.daily = dailyChallenge();
    const result = loadDailyResult();
    this.dailyBest = result.dateKey === this.daily.dateKey ? result : null;
  }

  update(dt) {
    this.time += dt;
  }

  keyDown(key) {
    if (key === 'a' || key === 'arrowleft') {
      if (this.index !== 0) this.game.audio?.sfx('ui');
      this.index = 0;
    } else if (key === 'd' || key === 'arrowright') {
      if (this.index !== 1) this.game.audio?.sfx('ui');
      this.index = 1;
    } else if (key === ' ' || key === 'enter') {
      this.start(CARDS[this.index].id);
    } else if (key === 's') {
      this.game.audio?.sfx('ui');
      this.game.toSettings();
    } else if (key === 'l') {
      this.game.audio?.sfx('ui');
      this.game.toRecords();
    } else if (key === 'g') {
      this.game.audio?.sfx('ui');
      this.game.toAchievements();
    } else if (key === 'c') {
      this.startDaily();
    }
  }

  pointerDown(pointer) {
    const achievements = this.achievementsRect();
    if (
      pointer.x >= achievements.x &&
      pointer.x <= achievements.x + achievements.w &&
      pointer.y >= achievements.y &&
      pointer.y <= achievements.y + achievements.h
    ) {
      this.game.audio?.sfx('ui');
      this.game.toAchievements();
      return;
    }

    const records = this.recordsRect();
    if (
      pointer.x >= records.x &&
      pointer.x <= records.x + records.w &&
      pointer.y >= records.y &&
      pointer.y <= records.y + records.h
    ) {
      this.game.audio?.sfx('ui');
      this.game.toRecords();
      return;
    }

    const daily = this.dailyRect();
    if (
      pointer.x >= daily.x &&
      pointer.x <= daily.x + daily.w &&
      pointer.y >= daily.y &&
      pointer.y <= daily.y + daily.h
    ) {
      this.startDaily();
      return;
    }

    const settings = this.settingRect();
    if (
      pointer.x >= settings.x &&
      pointer.x <= settings.x + settings.w &&
      pointer.y >= settings.y &&
      pointer.y <= settings.y + settings.h
    ) {
      this.game.audio?.sfx('ui');
      this.game.toSettings();
      return;
    }

    for (let i = 0; i < CARDS.length; i++) {
      const rect = this.cardRect(i);
      const inside =
        pointer.x >= rect.x &&
        pointer.x <= rect.x + rect.w &&
        pointer.y >= rect.y &&
        pointer.y <= rect.y + rect.h;
      if (inside) {
        this.start(CARDS[i].id);
        return;
      }
    }
  }

  start(id) {
    this.game.audio?.sfx('select');
    this.game.toWeapon(id);
  }

  startDaily() {
    this.game.audio?.sfx('select');
    this.game.toWeapon(CARDS[this.index].id, this.daily);
  }

  cardRect(index) {
    const w = 188;
    const h = 116;
    const gap = 24;
    const x0 = (VIEW.w - (w * 2 + gap)) / 2;
    return { x: x0 + index * (w + gap), y: 438, w, h };
  }

  settingRect() {
    return { x: VIEW.w - 96, y: 20, w: 76, h: 30 };
  }

  recordsRect() {
    return { x: 20, y: 20, w: 76, h: 30 };
  }

  achievementsRect() {
    return { x: VIEW.w / 2 - 38, y: 20, w: 76, h: 30 };
  }

  dailyRect() {
    return { x: 70, y: 360, w: 340, h: 36 };
  }

  draw(ctx) {
    const backdrop = this.game.backdrop;
    backdrop.draw(ctx);
    backdrop.drawVignette(ctx);

    ctx.save();
    ctx.translate(VIEW.w / 2, VIEW.h * 0.3);
    ctx.rotate(this.time * 0.18);
    ctx.strokeStyle = 'rgba(93, 243, 255, 0.16)';
    ctx.lineWidth = 1;
    polygon(ctx, 0, 0, 152, 6, -Math.PI / 2);
    ctx.stroke();
    ctx.rotate(-this.time * 0.46);
    ctx.strokeStyle = 'rgba(255, 77, 157, 0.13)';
    polygon(ctx, 0, 0, 190, 6, -Math.PI / 2);
    ctx.stroke();
    ctx.restore();

    const float = Math.sin(this.time * 1.3) * 3;
    label(ctx, 'NEON', VIEW.w / 2, VIEW.h * 0.27 + float, 62, '#8ef6ff', { weight: 800, glow: 28 });
    label(ctx, 'VECTORS', VIEW.w / 2, VIEW.h * 0.27 + 56 + float, 40, '#ff8fc4', {
      weight: 700,
      glow: 22,
    });
    label(ctx, '几何弹幕 · 每 60 秒 Boss', VIEW.w / 2, VIEW.h * 0.43 + float * 0.4, 13, 'rgba(170, 215, 255, 0.6)', {
      weight: 500,
    });

    label(ctx, '选择难度', VIEW.w / 2, 412, 12, COLORS.dim, { weight: 500, mono: true });

    for (let i = 0; i < CARDS.length; i++) this.drawCard(ctx, i);
    this.drawSettingsButton(ctx);
    this.drawRecordsButton(ctx);
    this.drawAchievementsButton(ctx);
    this.drawDailyBar(ctx);

    const best = this.records.best;
    const bestText =
      best.score > 0
        ? `BEST ${String(best.score).padStart(6, '0')} · WAVE ${best.wave}`
        : 'BEST ------ · 完成一局后记录';
    label(ctx, bestText, VIEW.w / 2, 580, 12, best.score > 0 ? '#ffd166' : COLORS.faint, {
      weight: 600,
      mono: true,
    });

    const blink = 0.4 + 0.6 * Math.abs(Math.sin(this.time * 2));
    label(ctx, '← → 切换 · 空格 / 点击选择武器', VIEW.w / 2, 616, 15, '#d6f1ff', {
      weight: 600,
      alpha: blink,
      glow: 10,
    });

    label(ctx, '移动  WASD · 方向键 · 按住拖动', VIEW.w / 2, 692, 12, COLORS.faint, {
      weight: 500,
    });
    label(ctx, '自动射击 · X 炸弹 · Esc 暂停 · M 静音 · S 设置', VIEW.w / 2, 716, 12, COLORS.faint, {
      weight: 500,
    });
  }

  drawSettingsButton(ctx) {
    const rect = this.settingRect();
    ctx.save();
    roundRect(ctx, rect.x, rect.y, rect.w, rect.h, 8);
    ctx.fillStyle = 'rgba(10, 18, 32, 0.75)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(120, 180, 255, 0.25)';
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.restore();
    label(ctx, '设置 S', rect.x + rect.w / 2, rect.y + rect.h / 2, 11, 'rgba(180, 220, 255, 0.7)', {
      weight: 600,
      mono: true,
    });
  }

  drawRecordsButton(ctx) {
    const rect = this.recordsRect();
    ctx.save();
    roundRect(ctx, rect.x, rect.y, rect.w, rect.h, 8);
    ctx.fillStyle = 'rgba(10, 18, 32, 0.75)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(120, 180, 255, 0.25)';
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.restore();
    label(ctx, '战绩 L', rect.x + rect.w / 2, rect.y + rect.h / 2, 11, 'rgba(180, 220, 255, 0.7)', {
      weight: 600,
      mono: true,
    });
  }

  drawAchievementsButton(ctx) {
    const rect = this.achievementsRect();
    ctx.save();
    roundRect(ctx, rect.x, rect.y, rect.w, rect.h, 8);
    ctx.fillStyle = 'rgba(10, 18, 32, 0.75)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(120, 180, 255, 0.25)';
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.restore();
    label(ctx, '成就 G', rect.x + rect.w / 2, rect.y + rect.h / 2, 11, 'rgba(180, 220, 255, 0.7)', {
      weight: 600,
      mono: true,
    });
  }

  drawDailyBar(ctx) {
    const rect = this.dailyRect();
    const best = this.dailyBest?.bestScore || 0;
    ctx.save();
    roundRect(ctx, rect.x, rect.y, rect.w, rect.h, 9);
    ctx.fillStyle = 'rgba(30, 25, 12, 0.78)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(255, 209, 102, 0.38)';
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.restore();

    label(ctx, `每日挑战 ${this.daily.dateLabel} · C`, rect.x + 14, rect.y + rect.h / 2, 11, '#ffd166', {
      align: 'left',
      mono: true,
      weight: 700,
    });
    label(
      ctx,
      best > 0 ? `BEST ${String(best).padStart(6, '0')}` : '固定种子',
      rect.x + rect.w - 14,
      rect.y + rect.h / 2,
      10,
      best > 0 ? '#ffe9b3' : 'rgba(255, 220, 150, 0.55)',
      { align: 'right', mono: true, weight: 600 }
    );
  }

  drawCard(ctx, index) {
    const rect = this.cardRect(index);
    const card = CARDS[index];
    const selected = index === this.index;

    ctx.save();
    roundRect(ctx, rect.x, rect.y, rect.w, rect.h, 10);
    ctx.fillStyle = selected ? 'rgba(18, 38, 62, 0.92)' : 'rgba(10, 16, 28, 0.8)';
    ctx.fill();
    if (selected) {
      const breathe = 0.5 + 0.5 * Math.sin(this.time * 3.4);
      ctx.shadowColor = 'rgba(93, 243, 255, 0.8)';
      ctx.shadowBlur = 14 + breathe * 14;
    }
    ctx.strokeStyle = selected ? '#7ef0ff' : 'rgba(120, 180, 255, 0.25)';
    ctx.lineWidth = selected ? 1.8 : 1;
    ctx.stroke();
    ctx.restore();

    label(ctx, card.title, rect.x + rect.w / 2, rect.y + 30, 22, selected ? '#eafcff' : '#bcd8f0', {
      weight: 700,
      glow: selected ? 12 : 0,
    });

    card.lines.forEach((line, lineIndex) => {
      label(ctx, line, rect.x + rect.w / 2, rect.y + 60 + lineIndex * 20, 12, 'rgba(170, 215, 255, 0.68)', {
        weight: 500,
      });
    });
  }
}
