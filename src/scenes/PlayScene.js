import { VIEW, COLORS, DIFFICULTIES, BOMB, COMBO, PICKUP, BOSS, JUICE, WAVE_SECONDS } from '../config.js';
import { Player } from '../entities/player.js';
import { Boss } from '../entities/boss.js';
import { spawnEnemy, spawnInterval } from '../game/director.js';
import { fireWeapon, getWeapon } from '../game/weapons.js';
import { Pickup } from '../entities/pickups.js';
import { spawnBurst, updateParticles, drawParticles } from '../entities/particles.js';
import { spawnFloater, updateFloaters, drawFloaters } from '../game/floaters.js';
import { drawPlayerBullets, drawEnemyBullets } from '../entities/bullets.js';
import { drawHud, drawBossBar } from '../render/hud.js';
import { label } from '../core/draw.js';
import { vibrate } from '../settings.js';
import { recordRun } from '../records.js';

export class PlayScene {
  constructor(game, difficultyId, weaponId = 'pulse') {
    this.game = game;
    this.diff = DIFFICULTIES[difficultyId] || DIFFICULTIES.standard;
    this.weaponId = weaponId;
    this.player = new Player(this.diff, weaponId);
    this.bullets = [];
    this.ebullets = [];
    this.enemies = [];
    this.pendingEnemies = [];
    this.particles = [];
    this.pickups = [];
    this.floaters = [];
    this.time = 0;
    this.score = 0;
    this.kills = 0;
    this.combo = 0;
    this.comboT = 0;
    this.mult = 1;
    this.maxMult = 1;
    this.maxCombo = 0;
    this.shieldCharge = 0;
    this.spawnT = 0.9;
    this.shake = 0;
    this.flash = 0;
    this.bombs = BOMB.count;
    this.paused = false;
    this.phase = 'playing';
    this.dyingT = 0;
    this.pointerActive = false;
    this.onVisibility = null;
    this.boss = null;
    this.bossIndex = 0;
    this.bossesDefeated = 0;
    this.nextBossAt = BOSS.firstAt;
    this.bossWarnT = 0;
    this.phaseBannerT = 0;
    this.phaseText = '';
    this.hitStop = 0;
    this.slowT = 0;
    this.displayScore = 0;
    this.multPulse = 0;
    this.overT = 0;
    this.recordSaved = false;
    this.isNewRecord = false;
    this.runRank = null;
    this.bestScore = 0;
  }

  get wave() {
    return 1 + Math.floor(this.time / WAVE_SECONDS);
  }

  enter() {
    this.onVisibility = () => {
      if (document.hidden && this.phase === 'playing') {
        this.paused = true;
        this.game.audio?.stopMusic();
      }
    };
    document.addEventListener('visibilitychange', this.onVisibility);
    this.game.audio?.startMusic(1);
  }

  exit() {
    this.pointerActive = false;
    if (this.onVisibility) document.removeEventListener('visibilitychange', this.onVisibility);
    this.game.audio?.stopMusic();
  }

  pointerDown(pointer) {
    if (this.phase === 'over') {
      this.game.startGame(this.diff.id, this.weaponId);
      return;
    }

    if (this.paused) {
      this.paused = false;
      this.game.audio?.startMusic(this.boss ? 2 : 1);
      this.pointerActive = false;
      return;
    }

    if (this.phase !== 'playing') {
      this.pointerActive = false;
      return;
    }

    if (pointer.x >= VIEW.w - 52 && pointer.y >= 56 && pointer.y <= 96) {
      this.paused = true;
      this.game.audio?.stopMusic();
      this.pointerActive = false;
      return;
    }

    if (pointer.x >= VIEW.w - 116 && pointer.y >= VIEW.h - 64) {
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
      if (key === 'r' || key === ' ' || key === 'enter') {
        this.game.startGame(this.diff.id, this.weaponId);
      } else if (key === 'l') {
        this.game.toRecords();
      } else if (key === 'escape' || key === 't') this.game.toTitle();
      return;
    }

    if (this.paused) {
      if (key === 'escape' || key === 'p' || key === ' ') {
        this.paused = false;
        this.game.audio?.startMusic(this.boss ? 2 : 1);
      } else if (key === 't') {
        this.game.toTitle();
      }
      return;
    }

    if (key === 'escape' || key === 'p') {
      if (this.phase === 'playing') {
        this.paused = true;
        this.game.audio?.stopMusic();
      }
    } else if (key === 'x' || key === 'shift') {
      this.useBomb();
    }
  }

  playerFire(player) {
    fireWeapon(this, player.x, player.y - 14, player.weaponId, player.weaponLevel);
    spawnBurst(this.particles, player.x, player.y - 16, 2, COLORS.bullet, 80, 0.14, 1.1);
    this.game.audio?.sfx('shoot', {
      level: player.weaponLevel,
      weapon: player.weaponId,
    });
  }

  useBomb() {
    if (this.phase !== 'playing' || this.paused || this.bombs <= 0) return;

    this.bombs -= 1;
    this.game.audio?.sfx('bomb');
    vibrate([28, 36, 64]);
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

  spawnPickup(kind, x, y) {
    this.pickups.push(new Pickup(kind, x, y));
  }

  spawnBoss() {
    for (const enemy of this.enemies) {
      spawnBurst(this.particles, enemy.x, enemy.y, 8, COLORS.enemy, 180, 0.5, 2);
    }
    this.enemies.length = 0;
    this.pendingEnemies.length = 0;

    this.bossIndex += 1;
    this.boss = new Boss(this.bossIndex);
    this.bossWarnT = 2.2;
    this.shake = 10;
    this.flash = 0.45;
    this.game.audio?.sfx('warn');
    this.game.audio?.setIntensity(2);
  }

  onBossPhase(boss) {
    this.game.audio?.sfx('phase');
    this.hitStop = Math.max(this.hitStop, JUICE.phaseStop);
    for (const bullet of this.ebullets) {
      spawnBurst(this.particles, bullet.x, bullet.y, 1, '#ffd166', 60, 0.3, 1.3);
    }
    this.ebullets.length = 0;
    this.flash = 0.42;
    this.shake = 9;
    this.phaseBannerT = 1.4;
    this.phaseText = `PHASE ${boss.phase}`;
    spawnBurst(this.particles, boss.x, boss.y, 28, '#ffffff', 240, 0.7, 2.4);
  }

  onBossTransitionEnd(boss) {
    this.game.audio?.sfx('shield');
    this.shake = Math.max(this.shake, 3);
    spawnBurst(this.particles, boss.x, boss.y, 8, boss.color, 120, 0.3, 1.8);
  }

  onBossDeath(boss) {
    this.bossesDefeated += 1;
    this.game.audio?.sfx('bossDown');
    vibrate([40, 30, 90]);
    this.game.audio?.setIntensity(1);
    this.hitStop = Math.max(this.hitStop, JUICE.phaseStop);
    this.slowT = JUICE.deathSlow;
    const gain = BOSS.score * boss.index * this.mult;
    this.score += gain;
    this.shake = 20;
    this.flash = 1;
    this.ebullets.length = 0;
    this.comboT = COMBO.maxWindow;

    for (let i = 0; i < 7; i += 1) {
      spawnBurst(
        this.particles,
        boss.x + (Math.random() - 0.5) * 70,
        boss.y + (Math.random() - 0.5) * 60,
        18,
        i % 2 ? '#ffffff' : COLORS.enemy,
        300,
        0.95,
        3
      );
    }
    for (let i = 0; i < 6; i += 1) {
      this.spawnPickup('core', boss.x + (Math.random() - 0.5) * 90, boss.y + (Math.random() - 0.5) * 40);
    }
    for (let i = 0; i < 3; i += 1) {
      this.spawnPickup('module', boss.x + (Math.random() - 0.5) * 90, boss.y + (Math.random() - 0.5) * 40);
    }
    spawnFloater(this.floaters, boss.x, boss.y - 10, `BOSS +${gain}`, '#ff7ab6', 18);

    this.nextBossAt = this.time + BOSS.gapAfter;
    this.spawnT = 1.4;
  }

  saveRecord() {
    if (this.recordSaved) return;
    this.recordSaved = true;

    const result = recordRun({
      score: this.score,
      wave: this.wave,
      kills: this.kills,
      maxCombo: this.maxCombo,
      maxMult: this.maxMult,
      weaponId: this.player.weaponId,
      difficultyId: this.diff.id,
      duration: this.time,
      bosses: this.bossesDefeated,
      at: Date.now(),
    });

    this.isNewRecord = result.isNewRecord;
    this.runRank = result.rank;
    this.bestScore = result.records.best.score;
  }

  killEnemy(enemy) {
    enemy.dead = true;

    const distance = Math.hypot(enemy.x - this.player.x, enemy.y - this.player.y);
    const close = distance <= COMBO.proximityRange;
    const mult = Math.min(
      COMBO.maxMult + COMBO.proximityBonus,
      this.mult + (close ? COMBO.proximityBonus : 0)
    );
    const gain = enemy.score * mult;

    this.score += gain;
    this.kills += 1;
    this.combo += 1;
    this.comboT = COMBO.baseWindow;
    this.maxCombo = Math.max(this.maxCombo, this.combo);
    const prevMult = this.mult;
    this.mult = Math.min(COMBO.maxMult, 1 + Math.floor(this.combo / COMBO.perLevel));
    if (this.mult > prevMult) this.multPulse = 1;
    this.maxMult = Math.max(this.maxMult, mult);

    this.hitStop = Math.max(this.hitStop, JUICE.killStop);
    this.game.audio?.sfx('kill');
    this.shake = Math.min(6, this.shake + 3);
    spawnBurst(this.particles, enemy.x, enemy.y, 18, COLORS.enemy, 240, 0.65, 2.6);
    spawnBurst(this.particles, enemy.x, enemy.y, 8, '#ffffff', 120, 0.4, 1.8);
    spawnFloater(
      this.floaters,
      enemy.x,
      enemy.y - 16,
      `+${gain}`,
      close ? '#ffd166' : '#e8fbff',
      close ? 15 : 12
    );

    this.spawnPickup('core', enemy.x, enemy.y);
    if (enemy.kind === 'turret' || this.kills % PICKUP.moduleEveryKills === 0) {
      this.spawnPickup('module', enemy.x, enemy.y);
    }

    if (enemy.split) {
      const children = enemy.split();
      if (children.length) {
        this.pendingEnemies.push(...children);
        for (const child of children) {
          spawnBurst(this.particles, child.x, child.y, 8, '#ffb36b', 150, 0.35, 1.8);
        }
        this.game.audio?.sfx('split');
      }
    }
  }

  collectPickup(pickup) {
    this.comboT = Math.min(COMBO.maxWindow, this.comboT + COMBO.windowPerCore);
    spawnBurst(this.particles, pickup.x, pickup.y, 4, '#ffffff', 70, 0.25, 1.4);

    if (pickup.kind === 'module') {
      this.game.audio?.sfx('module');
      if (this.player.weaponLevel < 5) {
        this.player.weaponLevel += 1;
        spawnFloater(this.floaters, pickup.x, pickup.y - 12, `武器 Lv.${this.player.weaponLevel}`, '#7ef0ff', 14);
        this.flash = Math.max(this.flash, 0.25);
      } else {
        this.score += 300;
        spawnFloater(this.floaters, pickup.x, pickup.y - 12, '+300', '#7ef0ff', 13);
      }
      return;
    }

    this.game.audio?.sfx('pickup');
    this.score += 20 * this.mult;
    this.shieldCharge += 1;
    if (this.shieldCharge >= PICKUP.shieldChargeMax) {
      this.shieldCharge = 0;
      if (this.player.shields < this.player.maxShields) {
        this.player.shields += 1;
        this.game.audio?.sfx('shield');
        spawnFloater(this.floaters, pickup.x, pickup.y - 12, '护盾 +1', '#5df3ff', 14);
      } else {
        this.score += 100;
      }
    }
  }

  hitPlayer() {
    const player = this.player;
    if (this.phase !== 'playing' || player.invuln > 0) return;

    player.shields -= 1;
    this.game.audio?.sfx('hurt');
    vibrate(55);
    this.shake = Math.min(14, this.shake + 9);
    spawnBurst(this.particles, player.x, player.y, 14, COLORS.player, 200, 0.45, 2);

    if (player.shields <= 0) {
      this.phase = 'dying';
      this.dyingT = 1;
      this.overT = 0;
      this.game.audio?.sfx('over');
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
        if (bullet.hits && bullet.hits.has(enemy.id)) continue;

        const dx = bullet.x - enemy.x;
        const dy = bullet.y - enemy.y;
        const reach = enemy.r + bullet.r;
        if (dx * dx + dy * dy > reach * reach) continue;

        enemy.hp -= bullet.damage ?? 1;
        enemy.hitFlash = 0.09;
        this.game.audio?.sfx('hit');
        spawnBurst(this.particles, bullet.x, bullet.y, 3, '#ffffff', 140, 0.16, 1.5);

        if (bullet.pierce > 0) {
          bullet.pierce -= 1;
          if (!bullet.hits) bullet.hits = new Set();
          bullet.hits.add(enemy.id);
        } else {
          bullet.dead = true;
        }

        if (enemy.hp <= 0) this.killEnemy(enemy);
        if (bullet.dead) break;
      }
    }

    this.bullets = this.bullets.filter((bullet) => !bullet.dead);
    this.enemies = this.enemies.filter((enemy) => !enemy.dead);

    if (
      this.boss &&
      (this.boss.state === 'fighting' || this.boss.state === 'transition')
    ) {
      for (const bullet of this.bullets) {
        if (bullet.dead) continue;
        const dx = bullet.x - this.boss.x;
        const dy = bullet.y - this.boss.y;
        const reach = this.boss.r + bullet.r;
        if (dx * dx + dy * dy > reach * reach) continue;

        bullet.dead = true;
        if (this.boss.state === 'fighting') {
          this.boss.damage(bullet.damage ?? 1, this);
          this.game.audio?.sfx('hit');
          spawnBurst(this.particles, bullet.x, bullet.y, 2, '#ffffff', 130, 0.15, 1.4);
        } else {
          spawnBurst(
            this.particles,
            bullet.x,
            bullet.y,
            2,
            this.boss.color,
            90,
            0.22,
            1.5
          );
        }
      }
      this.bullets = this.bullets.filter((bullet) => !bullet.dead);
    }

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

    if (this.boss && this.boss.state !== 'dying') {
      const dx = this.boss.x - this.player.x;
      const dy = this.boss.y - this.player.y;
      const reach = this.player.radius + this.boss.r * 0.8;
      if (dx * dx + dy * dy <= reach * reach) {
        this.hitPlayer();
      }
    }
  }

  flushPendingEnemies() {
    if (!this.pendingEnemies.length) return;
    this.enemies.push(...this.pendingEnemies);
    this.pendingEnemies.length = 0;
  }

  update(dt) {
    if (this.paused) return;

    let step = dt;
    if (this.hitStop > 0) {
      this.hitStop = Math.max(0, this.hitStop - dt);
      step = dt * 0.12;
    }
    if (this.slowT > 0) {
      this.slowT = Math.max(0, this.slowT - dt);
      step = Math.min(step, dt * JUICE.deathScale);
    }

    this.time += step;
    const ease = 1 - Math.exp(-9 * dt);
    this.displayScore += (this.score - this.displayScore) * ease;
    this.multPulse = Math.max(0, this.multPulse - dt * 3.2);

    this.shake = this.shake > 0.05 ? this.shake * Math.exp(-5 * dt) : 0;
    this.flash = Math.max(0, this.flash - dt * 2.6);
    updateParticles(this.particles, step);
    updateFloaters(this.floaters, step);

    if (this.phase === 'playing') {
      this.player.update(step, this.game.input, this);

      if (this.comboT > 0) {
        this.comboT -= step;
        if (this.comboT <= 0) {
          this.combo = 0;
          this.mult = 1;
        }
      }

      if (this.boss) {
        this.boss.update(step, this);
        if (this.boss.dead) this.boss = null;
      } else if (this.time >= this.nextBossAt) {
        this.spawnBoss();
      } else {
        this.spawnT -= step;
        if (this.spawnT <= 0) {
          spawnEnemy(this, this.time);
          this.spawnT = spawnInterval(this.time) * this.diff.spawnScale * (0.8 + Math.random() * 0.4);
        }
      }

      if (this.bossWarnT > 0) this.bossWarnT = Math.max(0, this.bossWarnT - step);
      if (this.phaseBannerT > 0) this.phaseBannerT = Math.max(0, this.phaseBannerT - step);

      for (const enemy of this.enemies) enemy.update(step, this);
      this.enemies = this.enemies.filter(
        (enemy) =>
          !enemy.dead &&
          enemy.y < VIEW.h + 80 &&
          enemy.x > -80 &&
          enemy.x < VIEW.w + 80
      );

      for (const bullet of this.bullets) {
        bullet.x += bullet.vx * step;
        bullet.y += bullet.vy * step;
      }
      this.bullets = this.bullets.filter(
        (bullet) =>
          !bullet.dead &&
          bullet.y > -40 &&
          bullet.y < VIEW.h + 40 &&
          bullet.x > -40 &&
          bullet.x < VIEW.w + 40
      );

      const spawned = [];
      for (const bullet of this.ebullets) {
        bullet.x += bullet.vx * step;
        bullet.y += bullet.vy * step;

        if (bullet.split && !bullet.split.done) {
          bullet.split.age += step;
          if (bullet.split.age >= bullet.split.delay) {
            bullet.split.done = true;
            const base = Math.atan2(bullet.vy, bullet.vx);
            const speed = Math.hypot(bullet.vx, bullet.vy) * bullet.split.speed;
            for (let i = 0; i < bullet.split.count; i += 1) {
              const offset = (i - (bullet.split.count - 1) / 2) * bullet.split.spread;
              spawned.push({
                x: bullet.x,
                y: bullet.y,
                vx: Math.cos(base + offset) * speed,
                vy: Math.sin(base + offset) * speed,
                r: 3.4,
              });
            }
            spawnBurst(this.particles, bullet.x, bullet.y, 3, COLORS.ebullet, 60, 0.25, 1.4);
          }
        }
      }
      if (spawned.length) this.ebullets.push(...spawned);
      this.ebullets = this.ebullets.filter(
        (bullet) =>
          bullet.y > -30 && bullet.y < VIEW.h + 30 && bullet.x > -30 && bullet.x < VIEW.w + 30
      );

      for (const pickup of this.pickups) pickup.update(step, this.player);
      for (const pickup of this.pickups) {
        if (pickup.dead) continue;
        const dx = pickup.x - this.player.x;
        const dy = pickup.y - this.player.y;
        if (dx * dx + dy * dy <= PICKUP.collectRange * PICKUP.collectRange) {
          this.collectPickup(pickup);
          pickup.dead = true;
        }
      }
      this.pickups = this.pickups.filter((pickup) => !pickup.dead);

      this.collide();
      this.flushPendingEnemies();
    } else if (this.phase === 'dying') {
      this.dyingT -= step;
      if (this.dyingT <= 0) {
        this.phase = 'over';
        this.saveRecord();
      }
    } else if (this.phase === 'over') {
      this.overT += dt;
    }
  }

  draw(ctx) {
    const ox = (Math.random() * 2 - 1) * this.shake;
    const oy = (Math.random() * 2 - 1) * this.shake;

    ctx.save();
    ctx.translate(ox, oy);
    this.game.backdrop.draw(ctx);
    drawEnemyBullets(ctx, this.ebullets);
    for (const enemy of this.enemies) enemy.draw(ctx);
    if (this.boss) this.boss.draw(ctx);
    drawPlayerBullets(ctx, this.bullets);
    for (const pickup of this.pickups) pickup.draw(ctx);
    if (this.phase === 'playing') this.player.draw(ctx);
    drawParticles(ctx, this.particles);
    drawFloaters(ctx, this.floaters);
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
    if (this.boss) drawBossBar(ctx, this);

    if (this.phase === 'playing' && this.bossWarnT > 0) {
      const alpha = 0.45 + 0.55 * Math.abs(Math.sin(this.bossWarnT * 7));
      label(ctx, 'WARNING', VIEW.w / 2, VIEW.h * 0.34, 42, '#ff7ab6', {
        weight: 800,
        glow: 26,
        alpha,
      });
      label(ctx, `BOSS ${this.bossIndex} · ${this.boss?.name || ''}`, VIEW.w / 2, VIEW.h * 0.34 + 38, 13, '#ffd9ec', {
        weight: 500,
        alpha,
      });
    }

    if (this.phase === 'playing' && this.phaseBannerT > 0) {
      const alpha = Math.min(1, this.phaseBannerT / 0.4);
      label(ctx, this.phaseText, VIEW.w / 2, VIEW.h * 0.3, 30, '#ffd166', {
        weight: 800,
        glow: 20,
        alpha,
      });
    }

    if (this.paused) this.drawPause(ctx);
    if (this.phase === 'over') this.drawGameOver(ctx);
  }

  drawPause(ctx) {
    ctx.fillStyle = 'rgba(5, 7, 13, 0.7)';
    ctx.fillRect(0, 0, VIEW.w, VIEW.h);

    label(ctx, 'PAUSED', VIEW.w / 2, VIEW.h * 0.42, 34, '#8ef6ff', { weight: 800, glow: 20 });
    label(ctx, 'Esc / P / 点击 继续', VIEW.w / 2, VIEW.h * 0.52, 15, '#d6f1ff', { weight: 600 });
    label(ctx, 'T 返回标题', VIEW.w / 2, VIEW.h * 0.52 + 28, 13, COLORS.faint, { weight: 500 });
  }

  drawGameOver(ctx) {
    ctx.fillStyle = 'rgba(5, 7, 13, 0.8)';
    ctx.fillRect(0, 0, VIEW.w, VIEW.h);

    label(ctx, 'GAME OVER', VIEW.w / 2, VIEW.h * 0.3, 40, '#ff7ab6', { weight: 800, glow: 24 });
    if (this.isNewRecord) {
      label(ctx, 'NEW RECORD', VIEW.w / 2, 272, 13, '#ffd166', {
        weight: 800,
        glow: 14,
      });
    }
    label(ctx, 'SCORE', VIEW.w / 2, VIEW.h * 0.37, 12, COLORS.dim, { mono: true, weight: 500 });
    label(ctx, String(this.score).padStart(6, '0'), VIEW.w / 2, VIEW.h * 0.37 + 36, 36, COLORS.hud, {
      mono: true,
      weight: 700,
      glow: 16,
    });

    const leftX = VIEW.w / 2 - 118;
    const rightX = VIEW.w / 2 + 118;
    const rowY = VIEW.h * 0.49;

    label(ctx, '最高倍率', leftX, rowY, 12, COLORS.faint, { align: 'left', weight: 500 });
    label(ctx, `×${this.maxMult}`, leftX, rowY + 20, 18, '#ffd166', {
      align: 'left',
      mono: true,
      weight: 700,
    });

    label(ctx, '最大连击', rightX, rowY, 12, COLORS.faint, { align: 'right', weight: 500 });
    label(ctx, String(this.maxCombo), rightX, rowY + 20, 18, '#e8fbff', {
      align: 'right',
      mono: true,
      weight: 700,
    });

    label(ctx, '击毁', leftX, rowY + 50, 12, COLORS.faint, { align: 'left', weight: 500 });
    label(ctx, String(this.kills), leftX, rowY + 70, 18, '#e8fbff', {
      align: 'left',
      mono: true,
      weight: 700,
    });

    label(ctx, '武器', rightX, rowY + 50, 12, COLORS.faint, { align: 'right', weight: 500 });
    const weapon = getWeapon(this.player.weaponId);
    label(ctx, `${weapon.name} Lv.${this.player.weaponLevel}`, rightX, rowY + 70, 15, weapon.color, {
      align: 'right',
      mono: true,
      weight: 700,
    });

    label(
      ctx,
      `难度 ${this.diff.name} · 到达波次 ${this.wave}`,
      VIEW.w / 2,
      rowY + 108,
      12,
      'rgba(170, 215, 255, 0.55)',
      { weight: 500 }
    );

    const best = String(this.bestScore).padStart(6, '0');
    const rank = this.runRank ? ` · 本局 #${this.runRank}` : '';
    label(ctx, `本机最高 ${best}${rank}`, VIEW.w / 2, rowY + 136, 12, '#ffd166', {
      weight: 600,
      mono: true,
    });

    const blink = 0.4 + 0.6 * Math.abs(Math.sin(this.time * 2.2));
    label(ctx, 'R / 空格 / 点击 重开', VIEW.w / 2, VIEW.h * 0.71, 16, '#d6f1ff', {
      weight: 600,
      alpha: blink,
    });
    label(ctx, 'L 查看战绩 · Esc 返回标题', VIEW.w / 2, VIEW.h * 0.71 + 30, 13, COLORS.faint, {
      weight: 500,
    });
  }
}
