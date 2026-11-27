import { Input } from '../input.js';
import { Backdrop } from '../render/backdrop.js';
import { TitleScene } from '../scenes/TitleScene.js';
import { PlayScene } from '../scenes/PlayScene.js';

export class Game {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d', { alpha: false });
    this.backdrop = new Backdrop();
    this.input = new Input(canvas);
    this.scene = null;

    this.input.onKeyDown = (key) => this.scene?.keyDown?.(key);
    this.input.onPointerDown = (pointer) => this.scene?.pointerDown?.(pointer);
    this.input.onPointerUp = () => this.scene?.pointerUp?.();

    this.toTitle();
  }

  toTitle() {
    this.setScene(new TitleScene(this));
  }

  startGame(difficultyId) {
    this.setScene(new PlayScene(this, difficultyId));
  }

  setScene(scene) {
    this.scene?.exit?.();
    this.scene = scene;
    scene.enter?.();
  }

  update(dt) {
    this.backdrop.update(dt);
    this.scene.update(dt);
  }

  render() {
    this.scene.draw(this.ctx);
  }
}
