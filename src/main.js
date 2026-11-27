import './styles.css';
import { VIEW } from './config.js';
import { Game } from './game/Game.js';

const canvas = document.getElementById('game');
const game = new Game(canvas);

function fit() {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const scale = Math.min(window.innerWidth / VIEW.w, window.innerHeight / VIEW.h);

  canvas.style.width = `${Math.round(VIEW.w * scale)}px`;
  canvas.style.height = `${Math.round(VIEW.h * scale)}px`;
  canvas.width = Math.round(VIEW.w * scale * dpr);
  canvas.height = Math.round(VIEW.h * scale * dpr);

  game.ctx.setTransform(scale * dpr, 0, 0, scale * dpr, 0, 0);
  game.backdrop.refresh(game.ctx);
}

window.addEventListener('resize', fit);
fit();

const STEP = 1 / 60;
let last = performance.now();
let acc = 0;
let lastErrorAt = -Infinity;

function frame(now) {
  requestAnimationFrame(frame);

  let dt = (now - last) / 1000;
  last = now;
  if (dt > 0.25) dt = 0.25;

  acc += dt;
  try {
    let guard = 0;
    while (acc >= STEP && guard < 5) {
      game.update(STEP);
      acc -= STEP;
      guard += 1;
    }
    if (guard >= 5) acc = 0;

    game.render();
  } catch (error) {
    acc = 0;
    if (now - lastErrorAt > 1000) {
      lastErrorAt = now;
      console.error('frame error', error);
    }
  }
}

requestAnimationFrame(frame);
