import { VIEW } from '../config.js';
import { AudioEngine } from '../audio.js';
import { label } from '../core/draw.js';
import { Input } from '../input.js';
import { Backdrop } from '../render/backdrop.js';
import { TitleScene } from '../scenes/TitleScene.js';
import { PlayScene } from '../scenes/PlayScene.js';
import { SettingsScene } from '../scenes/SettingsScene.js';
import { WeaponScene } from '../scenes/WeaponScene.js';

export class Game {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d', { alpha: false });
    this.backdrop = new Backdrop();
    this.input = new Input(canvas);
    this.audio = new AudioEngine();
    this.muteToastT = 0;
    this.scene = null;

    this.input.onKeyDown = (key) => {
      this.audio.unlock();
      if (key === 'm') {
        this.audio.toggleMute();
        this.muteToastT = 1.3;
        return;
      }
      this.scene?.keyDown?.(key);
    };
    this.input.onPointerDown = (pointer) => {
      this.audio.unlock();
      this.scene?.pointerDown?.(pointer);
    };
    this.input.onPointerUp = () => this.scene?.pointerUp?.();

    this.toTitle();
  }

  toTitle() {
    this.setScene(new TitleScene(this));
  }

  toSettings() {
    this.setScene(new SettingsScene(this));
  }

  toWeapon(difficultyId) {
    this.setScene(new WeaponScene(this, difficultyId));
  }

  startGame(difficultyId, weaponId) {
    this.setScene(new PlayScene(this, difficultyId, weaponId));
  }

  setScene(scene) {
    this.scene?.exit?.();
    this.scene = scene;
    scene.enter?.();
  }

  update(dt) {
    if (this.muteToastT > 0) this.muteToastT = Math.max(0, this.muteToastT - dt);
    this.backdrop.update(dt);
    this.scene.update(dt);
  }

  render() {
    this.scene.draw(this.ctx);
    if (this.muteToastT > 0) {
      const alpha = Math.min(1, this.muteToastT / 0.3);
      label(
        this.ctx,
        this.audio.muted ? '音效已关闭 · M 开启' : '音效已开启',
        VIEW.w / 2,
        128,
        13,
        '#d6f1ff',
        { weight: 600, glow: 12, alpha }
      );
    }
  }
}
