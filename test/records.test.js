import test from 'node:test';
import assert from 'node:assert/strict';
import {
  addRun,
  emptyRecords,
  loadRecords,
  normalizeRecords,
  rankRuns,
  recordRun,
} from '../src/records.js';

const makeRun = (overrides = {}) => ({
  score: 100,
  wave: 2,
  kills: 10,
  maxCombo: 5,
  maxMult: 2,
  weaponId: 'pulse',
  difficultyId: 'standard',
  duration: 60,
  bosses: 0,
  at: 1,
  ...overrides,
});

test('战绩按分数、波次、时长排序', () => {
  const runs = [
    makeRun({ score: 100, wave: 2, duration: 50, at: 1 }),
    makeRun({ score: 300, wave: 1, duration: 60, at: 2 }),
    makeRun({ score: 200, wave: 9, duration: 70, at: 3 }),
  ];
  assert.deepEqual(
    rankRuns(runs).map((run) => run.score),
    [300, 200, 100]
  );

  const ties = [
    makeRun({ score: 500, wave: 4, duration: 70, at: 1 }),
    makeRun({ score: 500, wave: 5, duration: 90, at: 2 }),
    makeRun({ score: 500, wave: 5, duration: 40, at: 3 }),
  ];
  assert.deepEqual(
    rankRuns(ties).map((run) => run.duration),
    [40, 90, 70]
  );
});

test('Top 5 会截断低分记录并保留最高分', () => {
  let records = emptyRecords();
  for (let index = 1; index <= 7; index += 1) {
    records = addRun(records, makeRun({ score: index * 100, at: index })).records;
  }

  assert.equal(records.runs.length, 5);
  assert.deepEqual(
    records.runs.map((run) => run.score),
    [700, 600, 500, 400, 300]
  );
  assert.equal(records.best.score, 700);
});

test('未进 Top 5 的局仍可刷新最高连击与倍率', () => {
  let records = emptyRecords();
  for (let index = 0; index < 5; index += 1) {
    records = addRun(
      records,
      makeRun({ score: 1000 - index * 100, maxCombo: 10, maxMult: 2, at: index })
    ).records;
  }

  const result = addRun(
    records,
    makeRun({ score: 50, maxCombo: 99, maxMult: 8, at: 99 })
  );

  assert.equal(result.isNewRecord, false);
  assert.equal(result.rank, null);
  assert.equal(result.records.runs.length, 5);
  assert.equal(result.records.best.score, 1000);
  assert.equal(result.records.best.combo, 99);
  assert.equal(result.records.best.mult, 8);
});

test('破纪录只认严格更高的分数', () => {
  let records = emptyRecords();
  const first = addRun(records, makeRun({ score: 500, at: 1 }));
  assert.equal(first.isNewRecord, true);
  assert.equal(first.rank, 1);

  const tie = addRun(first.records, makeRun({ score: 500, wave: 5, at: 2 }));
  assert.equal(tie.isNewRecord, false);
  assert.equal(tie.records.runs[0].wave, 5);

  const higher = addRun(tie.records, makeRun({ score: 501, at: 3 }));
  assert.equal(higher.isNewRecord, true);
  assert.equal(higher.rank, 1);
});

test('损坏或缺失数据会安全回退', () => {
  assert.deepEqual(normalizeRecords(null), emptyRecords());

  const normalized = normalizeRecords({
    best: { score: 999, wave: 4, combo: 12, mult: 9 },
    runs: [null, { score: -1 }, { score: 'x' }, { score: 300, wave: 'bad', duration: 'bad' }],
  });
  assert.equal(normalized.runs.length, 1);
  assert.equal(normalized.runs[0].score, 300);
  assert.equal(normalized.runs[0].wave, 1);
  assert.equal(normalized.best.score, 999);

  const corrupt = { getItem: () => '{bad json', setItem: () => {} };
  assert.deepEqual(loadRecords(corrupt), emptyRecords());
});

test('存储可持久化，写入失败不影响单局结果', () => {
  const map = new Map();
  const store = {
    getItem: (key) => map.get(key) ?? null,
    setItem: (key, value) => map.set(key, value),
  };

  const saved = recordRun(makeRun({ score: 321, at: 1 }), store);
  assert.equal(saved.saved, true);
  assert.equal(loadRecords(store).runs[0].score, 321);

  const broken = {
    getItem: () => {
      throw new Error('denied');
    },
    setItem: () => {
      throw new Error('denied');
    },
  };
  const failed = recordRun(makeRun({ score: 654, at: 2 }), broken);
  assert.equal(failed.saved, false);
  assert.equal(failed.records.runs[0].score, 654);
  assert.equal(loadRecords(broken).runs.length, 0);
});

test('每日模式字段可持久化，旧记录回退为无尽模式', () => {
  const map = new Map();
  const store = {
    getItem: (key) => map.get(key) ?? null,
    setItem: (key, value) => map.set(key, value),
  };

  recordRun(
    makeRun({ score: 321, mode: 'daily', dailyDate: '2026-11-28', at: 1 }),
    store
  );
  const loaded = loadRecords(store);
  assert.equal(loaded.runs[0].mode, 'daily');
  assert.equal(loaded.runs[0].dailyDate, '2026-11-28');

  const legacy = normalizeRecords({ runs: [{ score: 100, at: 2 }] });
  assert.equal(legacy.runs[0].mode, 'endless');
  assert.equal(legacy.runs[0].dailyDate, '');
});
