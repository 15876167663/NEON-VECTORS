import { VIEW } from './config.js';

export class Input {
  constructor(canvas) {
    this.canvas = canvas;
    this.keys = new Set();
    this.pointer = { x: VIEW.w / 2, y: VIEW.h - 120, down: false, touch: false };

    this.onKeyDown = () => {};
    this.onPointerDown = () => {};
    this.onPointerUp = () => {};

    window.addEventListener('keydown', (e) => {
      const key = e.key.toLowerCase();
      if ([' ', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright'].includes(key)) e.preventDefault();
      if (e.repeat) return;
      this.keys.add(key);
      this.onKeyDown(key, e);
    });

    window.addEventListener('keyup', (e) => {
      this.keys.delete(e.key.toLowerCase());
    });

    window.addEventListener('blur', () => {
      this.keys.clear();
      this.pointer.down = false;
    });

    canvas.addEventListener('pointerdown', (e) => {
      if (canvas.setPointerCapture) canvas.setPointerCapture(e.pointerId);
      this.updatePointer(e);
      this.pointer.down = true;
      this.pointer.touch = e.pointerType === 'touch';
      this.onPointerDown(this.pointer);
    });

    canvas.addEventListener('pointermove', (e) => {
      if (!this.pointer.down) return;
      this.updatePointer(e);
    });

    window.addEventListener('pointerup', () => {
      if (!this.pointer.down) return;
      this.pointer.down = false;
      this.onPointerUp(this.pointer);
    });

    window.addEventListener('pointercancel', () => {
      this.pointer.down = false;
    });
  }

  updatePointer(e) {
    const rect = this.canvas.getBoundingClientRect();
    this.pointer.x = ((e.clientX - rect.left) / rect.width) * VIEW.w;
    this.pointer.y = ((e.clientY - rect.top) / rect.height) * VIEW.h;
  }
}
