import test from 'node:test';
import assert from 'node:assert/strict';
import {
  ACHIEVEMENTS,
  loadAchievements,
  unlockAchievements,
} from '../src/achievements.js';

function createStore() {
  const map = new Map();
  return {
    getItem: (key) => map.get(key) ?? null,
    setItem: (key, value) => map.set(key, value),
  };
}

const completeRun = {
  kills: 1,
  maxCombo: 50,
  wave: 10,
  bosses: 1,
  score: 50000,
  weaponLevel: 5,
  mode: 'daily',
};

test('满足条件时一次解锁全部成就', () => {
  const store = createStore();
  const result = unlockAchievements(completeRun, store);

  assert.equal(result.newlyUnlocked.length, ACHIEVEMENTS.length);
  assert.equal(result.count, ACHIEVEMENTS.length);
  assert.equal(loadAchievements(store).unlocked.score_50k > 0, true);
});

test('已解锁成就不会重复触发', () => {
  const store = createStore();
  unlockAchievements(completeRun, store);
  const second = unlockAchievements(completeRun, store);

  assert.equal(second.newlyUnlocked.length, 0);
  assert.equal(second.count, ACHIEVEMENTS.length);
});

test('成就会按单局阈值逐项解锁', () => {
  const store = createStore();
  const result = unlockAchievements(
    {
      kills: 2,
      maxCombo: 25,
      wave: 4,
      bosses: 0,
      score: 4000,
      weaponLevel: 3,
      mode: 'endless',
    },
    store
  );

  assert.deepEqual(
    result.newlyUnlocked.map((item) => item.id),
    ['first_kill', 'combo_25']
  );
});

test('损坏或不可用的成就存储会安全回退', () => {
  const corrupt = {
    getItem: () => '{bad json',
    setItem: () => {},
  };
  assert.deepEqual(loadAchievements(corrupt).unlocked, {});

  const broken = {
    getItem: () => {
      throw new Error('denied');
    },
    setItem: () => {
      throw new Error('denied');
    },
  };
  const result = unlockAchievements(completeRun, broken);
  assert.equal(result.saved, false);
  assert.equal(result.newlyUnlocked.length, ACHIEVEMENTS.length);
});
