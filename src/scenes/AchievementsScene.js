import { VIEW, COLORS } from '../config.js';
import { ACHIEVEMENTS, loadAchievements } from '../achievements.js';
import { label, roundRect } from '../core/draw.js';

export class AchievementsScene {
  constructor(game) {
    this.game = game;
    this.time = 0;
    this.data = loadAchievements();
  }

  update(dt) {
    this.time += dt;
  }

  keyDown(key) {
    if (key === 'escape' || key === 'g' || key === 't') {
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

    const unlocked = Object.keys(this.data.unlocked).length;
    const pulse = 0.5 + 0.5 * Math.sin(this.time * 2.2);
    label(ctx, 'ACHIEVEMENTS', VIEW.w / 2, 78, 32, '#8ef6ff', {
      weight: 800,
      glow: 18 + pulse * 6,
    });
    label(ctx, `成就 ${unlocked} / ${ACHIEVEMENTS.length}`, VIEW.w / 2, 112, 12, COLORS.dim, {
      mono: true,
      weight: 600,
    });

    ACHIEVEMENTS.forEach((achievement, index) => {
      this.drawCard(ctx, achievement, index);
    });

    this.drawBackButton(ctx);
    label(ctx, 'Esc / G 返回标题', VIEW.w / 2, 726, 12, COLORS.faint, { weight: 500 });
  }

  drawCard(ctx, achievement, index) {
    const w = 206;
    const h = 104;
    const gapX = 16;
    const gapY = 12;
    const x = 26 + (index % 2) * (w + gapX);
    const y = 150 + Math.floor(index / 2) * (h + gapY);
    const unlocked = Boolean(this.data.unlocked[achievement.id]);
    const accent = unlocked ? '#ffd166' : 'rgba(120, 180, 255, 0.18)';

    ctx.save();
    roundRect(ctx, x, y, w, h, 10);
    ctx.fillStyle = unlocked ? 'rgba(28, 28, 22, 0.88)' : 'rgba(9, 15, 26, 0.8)';
    ctx.fill();
    ctx.strokeStyle = accent;
    ctx.lineWidth = unlocked ? 1.5 : 1;
    ctx.stroke();
    ctx.restore();

    label(ctx, String(index + 1).padStart(2, '0'), x + 15, y + 20, 9, unlocked ? '#ffd166' : 'rgba(150, 200, 255, 0.3)', {
      align: 'left',
      mono: true,
      weight: 700,
    });
    label(ctx, achievement.name, x + 15, y + 42, 13, unlocked ? '#ffe9b3' : 'rgba(190, 220, 255, 0.5)', {
      align: 'left',
      mono: true,
      weight: 700,
    });
    label(ctx, achievement.desc, x + 15, y + 66, 10, unlocked ? 'rgba(255, 235, 180, 0.72)' : 'rgba(150, 200, 255, 0.34)', {
      align: 'left',
      weight: 500,
    });
    label(ctx, unlocked ? '已解锁' : 'LOCKED', x + 15, y + 88, 9, unlocked ? '#ffd166' : 'rgba(150, 200, 255, 0.28)', {
      align: 'left',
      mono: true,
      weight: 700,
    });
    label(ctx, unlocked ? '✓' : '·', x + w - 16, y + 21, unlocked ? 18 : 14, unlocked ? '#ffd166' : 'rgba(150, 200, 255, 0.22)', {
      align: 'right',
      weight: 700,
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
