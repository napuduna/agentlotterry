const assert = require('assert');

const { __test } = require('../services/hanoiStarResultService');

const snapshot = __test.buildSnapshot({
  roundCode: '2026-04-18T17:00:00.000Z',
  drawTime: '12:30',
  firstPrize: '49821',
  twoBottom: '05',
  sourceUrl: 'https://exphuay.com/result/minhngocstar'
});

assert(snapshot, 'Expected Hanoi Star snapshot to be built from Exphuay payload');
assert.strictEqual(snapshot.roundCode, '2026-04-19');
assert.strictEqual(snapshot.headline, '821');
assert.strictEqual(snapshot.threeTop, '821');
assert.strictEqual(snapshot.twoTop, '21');
assert.strictEqual(snapshot.twoBottom, '05');
assert.strictEqual(snapshot.rawPayload.lottosDate, '2026-04-18T17:00:00.000Z');
assert.strictEqual(snapshot.resultPublishedAt.toISOString(), '2026-04-19T05:30:00.000Z');

console.log('Hanoi Star date normalization tests passed');
