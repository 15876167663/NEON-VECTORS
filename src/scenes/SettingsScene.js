import { VIEW, COLORS } from '../config.js';
import { settings, saveSettings, resetSettings, vibrate } from '../settings.js';
import { roundRect, label } from '../core/draw.js';

const ROWS = 6;
const LABELS = ['主音量', '音效', 'BGM', '震动', '画质', '恢复默认'];

export class SettingsScene {
  constructor(game) {
    this.game = game;
    this.time = 0;
    this.index = 0;
  }

  enter() {
    this.game.audio?.stopMusic();
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
    if (key === 'arrowup' || key === 'w') {
      this.index = (this.index + ROWS - 1) % ROWS;
      this.game.audio?.sfx('ui');
    } else if (key === 'arrowdown' || key === 's') {
      this.index = (this.index + 1) % ROWS;
      this.game.audio?.sfx('ui');
    } else if (key === 'arrowleft' || key === 'a') {
      this.adjust(-1);
    } else if (key === 'arrowright' || key === 'd') {
      this.adjust(1);
    } else if (key === ' ' || key === 'enter') {
      this.activate();
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

    const layout = this.layout();
    if (pointer.x < layout.x || pointer.x > layout.x + layout.w) return;

    const row = Math.floor((pointer.y - layout.top) / layout.rowH);
    if (row < 0 || row >= ROWS) return;

    if (row === 0) {
      const barLeft = layout.x + 164;
      const barWidth = layout.w - 218;
      if (pointer.x >= barLeft - 10) {
        const value = (pointer.x - barLeft) / barWidth;
        this.game.audio?.setVolume(value);
        this.game.audio?.sfx('ui');
        this.index = 0;
        return;
      }
    }

    this.index = row;
    if (row === 5) this.doReset();
    else if (row === 0) this.activate();
    else this.toggle(row);
  }

  adjust(dir) {
    const audio = this.game.audio;
    if (this.index === 0) {
      audio?.setVolume(settings.volume + dir * 0.05);
      audio?.sfx('ui');
      return;
    }
    if (this.index === 5) {
      this.doReset();
      return;
    }
    this.toggle(this.index);
  }

  activate() {
    const audio = this.game.audio;
    if (this.index === 0) {
      audio?.setVolume(settings.volume >= 0.95 ? 0.2 : settings.volume + 0.1);
      audio?.sfx('ui');
      return;
    }
    if (this.index === 5) {
      this.doReset();
      return;
    }
    this.toggle(this.index);
  }

  toggle(row) {
    const audio = this.game.audio;
    if (row === 1) audio?.setSfx(!settings.sfx);
    else if (row === 2) audio?.setMusic(!settings.music);
    else if (row === 3) {
      settings.vibrate = !settings.vibrate;
      saveSettings();
      vibrate(18);
    } else if (row === 4) {
      settings.quality = settings.quality === 'high' ? 'low' : 'high';
      saveSettings();
    }
    audio?.sfx('ui');
  }

  doReset() {
    resetSettings();
    const audio = this.game.audio;
    audio?.setMuted(settings.muted);
    audio?.setVolume(settings.volume);
    audio?.setSfx(settings.sfx);
    audio?.setMusic(settings.music);
    audio?.sfx('select');
  }

  value(row) {
    if (row === 0) return `${Math.round(settings.volume * 100)}%`;
    if (row === 1) return settings.sfx ? 'ON' : 'OFF';
    if (row === 2) return settings.music ? 'ON' : 'OFF';
    if (row === 3) return settings.vibrate ? 'ON' : 'OFF';
    if (row === 4) return settings.quality === 'high' ? '高' : '低';
    return '';
  }

  layout() {
    return { x: 56, w: VIEW.w - 112, top: 214, rowH: 56 };
  }

  backRect() {
    return { x: VIEW.w - 96, y: 20, w: 76, h: 30 };
  }

  draw(ctx) {
    const backdrop = this.game.backdrop;
    backdrop.draw(ctx);
    backdrop.drawVignette(ctx);

    const pulse = 0.5 + 0.5 * Math.sin(this.time * 2.4);
    label(ctx, 'SETTINGS', VIEW.w / 2, 112, 30, '#8ef6ff', {
      weight: 800,
      glow: 18 + pulse * 6,
    });
    label(ctx, '设置', VIEW.w / 2, 146, 12, COLORS.dim, { weight: 500, mono: true });

    const box = this.layout();
    ctx.save();
    roundRect(ctx, box.x, box.top - 18, box.w, box.rowH * ROWS + 36, 12);
    ctx.fillStyle = 'rgba(8, 14, 25, 0.86)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(120, 180, 255, 0.22)';
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.restore();

    for (let row = 0; row < ROWS; row += 1) this.drawRow(ctx, row, box);

    label(ctx, '↑ ↓ 选择 · ← → 调整 · Enter 切换', VIEW.w / 2, 636, 12, COLORS.faint, {
      weight: 500,
    });
    label(ctx, 'Esc 返回 · M 快速静音', VIEW.w / 2, 660, 11, 'rgba(150, 200, 255, 0.4)', {
      weight: 500,
    });

    const back = this.backRect();
    ctx.save();
    roundRect(ctx, back.x, back.y, back.w, back.h, 8);
    ctx.fillStyle = 'rgba(10, 18, 32, 0.75)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(120, 180, 255, 0.25)';
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.restore();
    label(ctx, '返回', back.x + back.w / 2, back.y + back.h / 2, 11, 'rgba(180, 220, 255, 0.7)', {
      weight: 600,
      mono: true,
    });

    label(ctx, 'v1.0', VIEW.w - 20, VIEW.h - 18, 10, 'rgba(150, 200, 255, 0.28)', {
      align: 'right',
      mono: true,
      weight: 500,
    });
  }

  drawRow(ctx, row, box) {
    const y = box.top + row * box.rowH;
    const selected = row === this.index;
    const innerX = box.x + 14;
    const innerW = box.w - 28;

    if (selected) {
      ctx.save();
      roundRect(ctx, innerX - 6, y + 4, innerW + 12, box.rowH - 8, 8);
      ctx.fillStyle = 'rgba(20, 46, 72, 0.9)';
      ctx.fill();
      ctx.strokeStyle = 'rgba(93, 243, 255, 0.35)';
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.restore();

      ctx.fillStyle = '#7ef0ff';
      ctx.fillRect(innerX - 2, y + 18, 3, box.rowH - 36);
    }

    const color = selected ? '#eafcff' : 'rgba(180, 215, 245, 0.75)';
    label(ctx, LABELS[row], innerX + 10, y + (row === 0 ? 22 : box.rowH / 2), 15, color, {
      align: 'left',
      weight: selected ? 700 : 500,
    });

    if (row === 5) {
      label(ctx, '重置全部设置', box.x + box.w - 24, y + box.rowH / 2, 12, 'rgba(255, 150, 180, 0.7)', {
        align: 'right',
        weight: 500,
      });
      return;
    }

    if (row === 0) {
      const barX = innerX + 150;
      const barW = innerW - 190;
      const barY = y + 38;
      ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
      ctx.fillRect(barX, barY, barW, 4);
      ctx.fillStyle = selected ? '#7ef0ff' : 'rgba(93, 243, 255, 0.65)';
      ctx.fillRect(barX, barY, barW * settings.volume, 4);
      label(ctx, this.value(0), box.x + box.w - 24, y + 22, 14, selected ? '#7ef0ff' : color, {
        align: 'right',
        mono: true,
        weight: 700,
      });
      return;
    }

    const on = this.value(row) === 'ON' || this.value(row) === '高';
    label(ctx, this.value(row), box.x + box.w - 24, y + box.rowH / 2, 14, on ? '#5df3ff' : 'rgba(150, 200, 255, 0.45)', {
      align: 'right',
      mono: true,
      weight: 700,
    });
  }
}
