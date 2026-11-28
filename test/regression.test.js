import test from 'node:test';
import assert from 'node:assert/strict';
import { Boss } from '../src/entities/boss.js';
import { TurretEnemy } from '../src/entities/enemy.js';
import { BOSS } from '../src/config.js';

function createRecordingContext() {
  const arcs = [];
  const noop = () => {};

  return {
    arcs,
    save: noop,
    restore: noop,
    translate: noop,
    rotate: noop,
    scale: noop,
    beginPath: noop,
    closePath: noop,
    moveTo: noop,
    lineTo: noop,
    stroke: noop,
    fill: noop,
    strokeRect: noop,
    fillRect: noop,
    arc(x, y, radius) {
      if (!Number.isFinite(radius) || radius < 0) {
        throw new RangeError(`invalid arc radius: ${radius}`);
      }
      arcs.push(radius);
    },
  };
}

test('炮台预警圈在极端负计时下不会绘制负半径', () => {
  const timings = [0.3, 0.2, 0.05, 0, -0.1, -0.64, -0.65, -5, -120];

  for (const shootT of timings) {
    const turret = new TurretEnemy(240, 200);
    turret.y = turret.hoverY;
    turret.shootT = shootT;

    const ctx = createRecordingContext();
    assert.doesNotThrow(() => turret.draw(ctx), undefined, `shootT=${shootT}`);

    const maxRadius = Math.max(...ctx.arcs);
    assert.ok(maxRadius >= 30, `warning ring missing at shootT=${shootT}`);
    assert.ok(maxRadius <= 44, `warning ring exceeded range at shootT=${shootT}`);
  }
});

test('Boss 血量曲线保持前 12 场不变，并在后期提高上限', () => {
  const maxHp = (index) => new Boss(index).maxHp;

  assert.equal(maxHp(1), BOSS.baseHp);
  assert.equal(maxHp(12), BOSS.baseHp + 11 * BOSS.hpStep);
  assert.equal(maxHp(12), 346);
  assert.equal(maxHp(16), 410);
  assert.equal(maxHp(20), BOSS.hpCap);
  assert.equal(maxHp(24), BOSS.hpCap);
  assert.equal(BOSS.hpCap, 470);

  let previous = 0;
  for (let index = 1; index <= 60; index += 1) {
    const value = maxHp(index);
    assert.ok(value >= previous, `Boss ${index} 血量不应下降`);
    assert.ok(value <= BOSS.hpCap, `Boss ${index} 血量超过上限`);
    previous = value;
  }
});
