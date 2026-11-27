import { VIEW, COLORS, DIFFICULTIES } from '../config.js';
import { WEAPONS, WEAPON_ORDER } from '../game/weapons.js';
import { roundRect, label } from '../core/draw.js';

export class WeaponScene {
  constructor(game, difficultyId) {
    this.game = game;
    this.diff = DIFFICULTIES[difficultyId] || DIFFICULTIES.standard;
    this.time = 0;
    this.index = 0;
  }

  update(dt) {
    this.time += dt;
  }

  keyDown(key) {
    if (key === 'escape') {
      this.game.audio?.sfx('ui');
      this.game.toTitle();
      return;
    }

    if (key === 'a' || key === 'arrowleft') {
      if (this.index !== 0) this.game.audio?.sfx('ui');
      this.index = Math.max(0, this.index - 1);
    } else if (key === 'd' || key === 'arrowright') {
      if (this.index !== WEAPON_ORDER.length - 1) this.game.audio?.sfx('ui');
      this.index = Math.min(WEAPON_ORDER.length - 1, this.index + 1);
    } else if (key === ' ' || key === 'enter') {
      this.start();
    }
  }

  pointerDown(pointer) {
    const back = this.backRect();
    if (
      pointer.x >= back.x &&
      pointer.x <= back.x + back.w &&
      pointer.y >= back.y &&
      pointer.y <= back.y + back.h
    ) {
      this.game.audio?.sfx('ui');
      this.game.toTitle();
      return;
    }

    for (let i = 0; i < WEAPON_ORDER.length; i += 1) {
      const rect = this.cardRect(i);
      const inside =
        pointer.x >= rect.x &&
        pointer.x <= rect.x + rect.w &&
        pointer.y >= rect.y &&
        pointer.y <= rect.y + rect.h;
      if (inside) {
        this.index = i;
        this.start();
        return;
      }
    }
  }

  start() {
    this.game.audio?.sfx('select');
    this.game.startGame(this.diff.id, WEAPON_ORDER[this.index]);
  }

  cardRect(index) {
    const w = 136;
    const h = 310;
    const gap = 12;
    const x0 = (VIEW.w - (w * WEAPON_ORDER.length + gap * (WEAPON_ORDER.length - 1))) / 2;
    return { x: x0 + index * (w + gap), y: 240, w, h };
  }

  backRect() {
    return { x: VIEW.w - 96, y: 20, w: 76, h: 30 };
  }

  draw(ctx) {
    const backdrop = this.game.backdrop;
    backdrop.draw(ctx);
    backdrop.drawVignette(ctx);

    const pulse = 0.5 + 0.5 * Math.sin(this.time * 2.4);
    label(ctx, 'SELECT WEAPON', VIEW.w / 2, 92, 30, '#8ef6ff', {
      weight: 800,
      glow: 18 + pulse * 6,
    });
    label(ctx, '选择武器', VIEW.w / 2, 126, 12, COLORS.dim, {
      weight: 500,
      mono: true,
    });
    label(ctx, `难度 · ${this.diff.name}`, VIEW.w / 2, 164, 12, 'rgba(170, 215, 255, 0.7)', {
      weight: 600,
    });
    label(ctx, '固定武器 · 拾取模块升级到 Lv.5', VIEW.w / 2, 190, 11, COLORS.faint, {
      weight: 500,
    });

    for (let i = 0; i < WEAPON_ORDER.length; i += 1) this.drawCard(ctx, i);
    this.drawBackButton(ctx);

    const blink = 0.45 + 0.55 * Math.abs(Math.sin(this.time * 2));
    label(ctx, '← → 选择 · 空格 / 点击开始', VIEW.w / 2, 612, 14, '#d6f1ff', {
      weight: 600,
      alpha: blink,
      glow: 10,
    });
    label(ctx, 'Esc 返回难度选择', VIEW.w / 2, 642, 11, COLORS.faint, {
      weight: 500,
    });
  }

  drawCard(ctx, index) {
    const rect = this.cardRect(index);
    const weapon = WEAPONS[WEAPON_ORDER[index]];
    const selected = index === this.index;

    ctx.save();
    roundRect(ctx, rect.x, rect.y, rect.w, rect.h, 12);
    ctx.fillStyle = selected ? 'rgba(16, 30, 48, 0.94)' : 'rgba(8, 14, 24, 0.84)';
    ctx.fill();
    if (selected) {
      const breathe = 0.5 + 0.5 * Math.sin(this.time * 3.4);
      ctx.shadowColor = weapon.color;
      ctx.shadowBlur = 12 + breathe * 16;
    }
    ctx.strokeStyle = selected ? weapon.color : 'rgba(120, 180, 255, 0.22)';
    ctx.lineWidth = selected ? 1.8 : 1;
    ctx.stroke();
    ctx.restore();

    const cx = rect.x + rect.w / 2;
    label(ctx, weapon.name, cx, rect.y + 34, 18, selected ? weapon.color : '#bcd8f0', {
      weight: 800,
      glow: selected ? 14 : 0,
    });
    label(ctx, weapon.role, cx, rect.y + 58, 11, 'rgba(170, 215, 255, 0.62)', {
      weight: 500,
    });

    this.drawPreview(ctx, weapon, cx, rect.y + 176, selected);

    weapon.desc.forEach((line, lineIndex) => {
      label(ctx, line, cx, rect.y + 210 + lineIndex * 21, 11, 'rgba(170, 215, 255, 0.68)', {
        weight: 500,
      });
    });

    label(ctx, 'LV.1 → 5', cx, rect.y + 286, 10, selected ? weapon.color : 'rgba(150, 200, 255, 0.35)', {
      weight: 600,
      mono: true,
    });
  }

  drawPreview(ctx, weapon, cx, baselineY, selected) {
    const shots = weapon.levels[weapon.levels.length - 1].shots;
    const length = 78;

    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    ctx.strokeStyle = weapon.color;
    ctx.shadowColor = weapon.color;
    ctx.shadowBlur = selected ? 12 : 6;
    ctx.lineWidth = weapon.width * 0.7;
    ctx.lineCap = 'round';
    ctx.beginPath();
    for (const shot of shots) {
      const sx = cx + shot.ox * 1.1;
      const angle = shot.angle * 2.1;
      ctx.moveTo(sx, baselineY);
      ctx.lineTo(sx + Math.sin(angle) * length, baselineY - Math.cos(angle) * length);
    }
    ctx.stroke();

    ctx.fillStyle = weapon.color;
    ctx.beginPath();
    ctx.moveTo(cx, baselineY - 9);
    ctx.lineTo(cx + 7, baselineY + 7);
    ctx.lineTo(cx, baselineY + 3);
    ctx.lineTo(cx - 7, baselineY + 7);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
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
