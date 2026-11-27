import { VIEW, COLORS, DIFFICULTIES } from '../config.js';
import { polygon, roundRect, label } from '../core/draw.js';

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
    }
  }

  pointerDown(pointer) {
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
    this.game.startGame(id);
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

    const blink = 0.4 + 0.6 * Math.abs(Math.sin(this.time * 2));
    label(ctx, '← → 切换 · 空格 / 点击开始', VIEW.w / 2, 600, 15, '#d6f1ff', {
      weight: 600,
      alpha: blink,
      glow: 10,
    });

    label(ctx, '移动  WASD · 方向键 · 按住拖动', VIEW.w / 2, VIEW.h * 0.855, 12, COLORS.faint, {
      weight: 500,
    });
    label(ctx, '自动射击 · X 炸弹 · Esc 暂停 · M 静音 · S 设置', VIEW.w / 2, VIEW.h * 0.885, 12, COLORS.faint, {
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
