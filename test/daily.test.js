import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createSeededRandom,
  dailyChallenge,
  loadDailyResult,
  localDateKey,
  recordDailyResult,
} from '../src/daily.js';
import { spawnEnemy } from '../src/game/director.js';

function createStore() {
  const map = new Map();
  return {
    getItem: (key) => map.get(key) ?? null,
    setItem: (key, value) => map.set(key, value),
  };
}

test('每日挑战按本地日期生成稳定种子', () => {
  const first = dailyChallenge(new Date(2026, 10, 28, 0, 1));
  const later = dailyChallenge(new Date(2026, 10, 28, 23, 59));
  const next = dailyChallenge(new Date(2026, 10, 29, 0, 1));

  assert.equal(localDateKey(new Date(2026, 10, 28)), '2026-11-28');
  assert.equal(first.dateKey, '2026-11-28');
  assert.equal(first.dateLabel, '11-28');
  assert.equal(first.seed, later.seed);
  assert.notEqual(first.seed, next.seed);
  assert.match(first.seedLabel, /^[0-9A-F]{4}$/);
});

test('固定种子生成相同的随机序列', () => {
  const randomA = createSeededRandom(123456);
  const randomB = createSeededRandom(123456);
  const other = createSeededRandom(654321);

  const valuesA = Array.from({ length: 12 }, () => randomA());
  const valuesB = Array.from({ length: 12 }, () => randomB());
  const valuesOther = Array.from({ length: 12 }, () => other());

  assert.deepEqual(valuesA, valuesB);
  assert.notDeepEqual(valuesA, valuesOther);
  assert.ok(valuesA.every((value) => value >= 0 && value < 1));
});

test('每日出怪使用固定种子后保持确定性', () => {
  const sceneA = { enemies: [], random: createSeededRandom(98765) };
  const sceneB = { enemies: [], random: createSeededRandom(98765) };

  spawnEnemy(sceneA, 40);
  spawnEnemy(sceneB, 40);

  const enemyA = sceneA.enemies[0];
  const enemyB = sceneB.enemies[0];
  assert.equal(enemyA.kind, enemyB.kind);
  assert.equal(enemyA.x, enemyB.x);
  assert.equal(enemyA.y, enemyB.y);
  assert.equal(enemyA.hp, enemyB.hp);
});

test('每日最佳按日期保存并累计游玩次数', () => {
  const store = createStore();
  const first = recordDailyResult(
    { dateKey: '2026-11-28', score: 1200, wave: 3, bosses: 0 },
    store
  );
  assert.equal(first.isNewBest, true);
  assert.equal(first.result.bestScore, 1200);
  assert.equal(first.result.plays, 1);

  const second = recordDailyResult(
    { dateKey: '2026-11-28', score: 900, wave: 4, bosses: 1 },
    store
  );
  assert.equal(second.isNewBest, false);
  assert.equal(second.result.bestScore, 1200);
  assert.equal(second.result.bestWave, 4);
  assert.equal(second.result.plays, 2);
  assert.equal(loadDailyResult(store).bestScore, 1200);

  const nextDay = recordDailyResult(
    { dateKey: '2026-11-29', score: 300, wave: 2, bosses: 0 },
    store
  );
  assert.equal(nextDay.isNewBest, true);
  assert.equal(nextDay.result.dateKey, '2026-11-29');
  assert.equal(nextDay.result.bestScore, 300);
  assert.equal(nextDay.result.plays, 1);
});

test('每日成绩写入失败不会中断游戏', () => {
  const broken = {
    getItem: () => {
      throw new Error('denied');
    },
    setItem: () => {
      throw new Error('denied');
    },
  };
  const result = recordDailyResult(
    { dateKey: '2026-11-28', score: 500, wave: 2, bosses: 0 },
    broken
  );

  assert.equal(result.saved, false);
  assert.equal(result.result.bestScore, 500);
});
