import { VIEW, COLORS, DIFFICULTIES, PLAYER, BOMB, WAVE_SECONDS } from '../config.js';
import { Player } from '../entities/player.js';
import { spawnEnemy, spawnInterval } from '../game/director.js';
import { spawnBurst, updateParticles, drawParticles } from '../entities/particles.js';
import { drawPlayerBullets, drawEnemyBullets } from '../entities/bullets.js';
import { drawHud } from '../render/hud.js';
import { label } from '../core/draw.js';

export class PlayScene {
  constructor(game, difficultyId) {
    this.game = game;
    this.diff = DIFFICULTIES[difficultyId] || DIFFICULTIES.standard;
    this.player = new Player(this.diff);
    this.bullets = [];
    this.ebullets = [];
    this.enemies = [];
    this.particles = [];
    this.time = 0;
    this.score = 0;
    this.kills = 0;
    this.spawnT = 0.9;
    this.shake = 0;
    this.flash = 0;
    this.bombs = BOMB.count;
    this.paused = false;
    this.phase = 'playing';
    this.dyingT = 0;
    this.pointerActive = false;
    this.onVisibility = null;
  }

  get wave() {
    return 1 + Math.floor(this.time / WAVE_SECONDS);
  }

  enter() {
    this.onVisibility = () => {
      if (document.hidden && this.phase === 'playing') this.paused = true;
    };
    document.addEventListener('visibilitychange', this.onVisibility);
  }

  exit() {
    this.pointerActive = false;
    if (this.onVisibility) document.removeEventListener('visibilitychange', this.onVisibility);
  }

  pointerDown(pointer) {
    if (this.phase === 'over') {
      this.game.startGame(this.diff.id);
      return;
    }

    if (this.phase !== 'playing' || this.paused) {
      this.pointerActive = false;
      return;
    }

    const bombLeft = VIEW.w - 96;
    const bombTop = VIEW.h - 46;
    if (pointer.x >= bombLeft && pointer.y >= bombTop) {
      this.useBomb();
      this.pointerActive = false;
      return;
    }

    this.pointerActive = true;
  }

  pointerUp() {
    this.pointerActive = false;
  }

  keyDown(key) {
    if (this.phase === 'over') {
      if (key === 'r' || key === ' ' || key === 'enter') this.game.startGame(this.diff.id);
      else if (key === 'escape' || key === 't') this.game.toTitle();
      return;
    }

    if (this.paused) {
      if (key === 'escape' || key === 'p' || key === ' ') this.paused = false;
      else if (key === 't') this.game.toTitle();
      return;
    }

    if (key === 'escape' || key === 'p') {
      if (this.phase === 'playing') this.paused = true;
    } else if (key === 'x' || key === 'shift') {
      this.useBomb();
    }
  }

  spawnPlayerShot(x, y) {
    this.bullets.push({ x, y, vy: -PLAYER.bulletSpeed, r: 3.5, dead: false });
  }

  useBomb() {
    if (this.phase !== 'playing' || this.paused || this.bombs <= 0) return;

    this.bombs -= 1;
    this.flash = 1;
    this.shake = 18;
    this.player.invuln = Math.max(this.player.invuln, BOMB.invuln);

    for (const bullet of this.ebullets) {
      spawnBurst(this.particles, bullet.x, bullet.y, 2, COLORS.ebullet, 90, 0.3, 1.6);
    }
    this.ebullets.length = 0;

    for (const enemy of this.enemies) {
      if (enemy.dead) continue;
      enemy.hp -= BOMB.damage;
      enemy.hitFlash = 0.12;
      if (enemy.hp <= 0) this.killEnemy(enemy);
    }
    this.enemies = this.enemies.filter((enemy) => !enemy.dead);
  }

  killEnemy(enemy) {
    enemy.dead = true;
    this.score += enemy.score;
    this.kills += 1;
    this.shake = Math.min(6, this.shake + 3);
    spawnBurst(this.particles, enemy.x, enemy.y, 18, COLORS.enemy, 240, 0.65, 2.6);
    spawnBurst(this.particles, enemy.x, enemy.y, 8, '#ffffff', 120, 0.4, 1.8);
  }

  hitPlayer() {
    const player = this.player;
    if (this.phase !== 'playing' || player.invuln > 0) return;

    player.shields -= 1;
    this.shake = Math.min(14, this.shake + 9);
    spawnBurst(this.particles, player.x, player.y, 14, COLORS.player, 200, 0.45, 2);

    if (player.shields <= 0) {
      this.phase = 'dying';
      this.dyingT = 1;
      spawnBurst(this.particles, player.x, player.y, 46, COLORS.player, 300, 0.9, 3);
      spawnBurst(this.particles, player.x, player.y, 18, '#ffffff', 150, 0.5, 2);
    } else {
      player.invuln = this.diff.invulnTime;
    }
  }

  collide() {
    for (const bullet of this.bullets) {
      if (bullet.dead) continue;
      for (const enemy of this.enemies) {
        if (enemy.dead) continue;
        const dx = bullet.x - enemy.x;
        const dy = bullet.y - enemy.y;
        const reach = enemy.r + bullet.r;
        if (dx * dx + dy * dy <= reach * reach) {
          bullet.dead = true;
          enemy.hp -= 1;
          enemy.hitFlash = 0.09;
          spawnBurst(this.particles, bullet.x, bullet.y, 3, '#ffffff', 140, 0.16, 1.5);
          if (enemy.hp <= 0) this.killEnemy(enemy);
          break;
        }
      }
    }

    this.bullets = this.bullets.filter((bullet) => !bullet.dead);
    this.enemies = this.enemies.filter((enemy) => !enemy.dead);

    if (this.phase !== 'playing') return;

    for (const bullet of this.ebullets) {
      const dx = bullet.x - this.player.x;
      const dy = bullet.y - this.player.y;
      const reach = this.player.radius + bullet.r * 0.65;
      if (dx * dx + dy * dy <= reach * reach) {
        this.hitPlayer();
        return;
      }
    }

    for (const enemy of this.enemies) {
      const dx = enemy.x - this.player.x;
      const dy = enemy.y - this.player.y;
      const reach = this.player.radius + enemy.r * 0.75;
      if (dx * dx + dy * dy <= reach * reach) {
        this.hitPlayer();
        return;
      }
    }
  }

  update(dt) {
    if (this.paused) return;

    this.time += dt;
    this.shake = this.shake > 0.05 ? this.shake * Math.exp(-5 * dt) : 0;
    this.flash = Math.max(0, this.flash - dt * 2.6);

    if (this.phase === 'playing') {
      this.player.update(dt, this.game.input, this);

      this.spawnT -= dt;
      if (this.spawnT <= 0) {
        spawnEnemy(this, this.time);
        this.spawnT = spawnInterval(this.time) * this.diff.spawnScale * (0.8 + Math.random() * 0.4);
      }

      for (const enemy of this.enemies) enemy.update(dt, this);
      this.enemies = this.enemies.filter(
        (enemy) =>
          !enemy.dead &&
          enemy.y < VIEW.h + 80 &&
          enemy.x > -80 &&
          enemy.x < VIEW.w + 80
      );

      for (const bullet of this.bullets) bullet.y += bullet.vy * dt;
      this.bullets = this.bullets.filter((bullet) => bullet.y > -40 && !bullet.dead);

      for (const bullet of this.ebullets) {
        bullet.x += bullet.vx * dt;
        bullet.y += bullet.vy * dt;
      }
      this.ebullets = this.ebullets.filter(
        (bullet) =>
          bullet.y > -30 && bullet.y < VIEW.h + 30 && bullet.x > -30 && bullet.x < VIEW.w + 30
      );

      this.collide();
    } else if (this.phase === 'dying') {
      this.dyingT -= dt;
      if (this.dyingT <= 0) this.phase = 'over';
    }

    updateParticles(this.particles, dt);
  }

  draw(ctx) {
    const ox = (Math.random() * 2 - 1) * this.shake;
    const oy = (Math.random() * 2 - 1) * this.shake;

    ctx.save();
    ctx.translate(ox, oy);
    this.game.backdrop.draw(ctx);
    drawEnemyBullets(ctx, this.ebullets);
    for (const enemy of this.enemies) enemy.draw(ctx);
    drawPlayerBullets(ctx, this.bullets);
    if (this.phase === 'playing') this.player.draw(ctx);
    drawParticles(ctx, this.particles);
    ctx.restore();

    this.game.backdrop.drawVignette(ctx);

    ctx.strokeStyle = COLORS.frame;
    ctx.lineWidth = 1;
    ctx.strokeRect(0.5, 0.5, VIEW.w - 1, VIEW.h - 1);

    if (this.flash > 0) {
      ctx.fillStyle = `rgba(170, 245, 255, ${(this.flash * 0.45).toFixed(3)})`;
      ctx.fillRect(0, 0, VIEW.w, VIEW.h);
    }

    if (this.phase !== 'over') drawHud(ctx, this);
    if (this.paused) this.drawPause(ctx);
    if (this.phase === 'over') this.drawGameOver(ctx);
  }

  drawPause(ctx) {
    ctx.fillStyle = 'rgba(5, 7, 13, 0.7)';
    ctx.fillRect(0, 0, VIEW.w, VIEW.h);

    label(ctx, 'PAUSED', VIEW.w / 2, VIEW.h * 0.42, 34, '#8ef6ff', { weight: 800, glow: 20 });
    label(ctx, 'Esc / P 继续', VIEW.w / 2, VIEW.h * 0.52, 15, '#d6f1ff', { weight: 600 });
    label(ctx, 'T 返回标题', VIEW.w / 2, VIEW.h * 0.52 + 28, 13, COLORS.faint, { weight: 500 });
  }

  drawGameOver(ctx) {
    ctx.fillStyle = 'rgba(5, 7, 13, 0.78)';
    ctx.fillRect(0, 0, VIEW.w, VIEW.h);

    label(ctx, 'GAME OVER', VIEW.w / 2, VIEW.h * 0.34, 40, '#ff7ab6', { weight: 800, glow: 24 });
    label(ctx, 'SCORE', VIEW.w / 2, VIEW.h * 0.42, 12, COLORS.dim, { mono: true, weight: 500 });
    label(ctx, String(this.score).padStart(6, '0'), VIEW.w / 2, VIEW.h * 0.42 + 36, 36, COLORS.hud, {
      mono: true,
      weight: 700,
      glow: 16,
    });

    label(
      ctx,
      `难度 ${this.diff.name} · 波次 ${this.wave} · 击毁 ${this.kills}`,
      VIEW.w / 2,
      VIEW.h * 0.53,
      13,
      'rgba(170, 215, 255, 0.62)',
      { weight: 500 }
    );

    const blink = 0.4 + 0.6 * Math.abs(Math.sin(this.time * 2.2));
    label(ctx, 'R / 空格 / 点击 重开', VIEW.w / 2, VIEW.h * 0.63, 16, '#d6f1ff', {
      weight: 600,
      alpha: blink,
    });
    label(ctx, 'Esc 返回标题', VIEW.w / 2, VIEW.h * 0.63 + 30, 13, COLORS.faint, { weight: 500 });
  }
}
