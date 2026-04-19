const assert = require('assert');
const { createBangkokDate } = require('../utils/bangkokTime');
const { resolveSnapshotReleaseAt } = require('../services/externalResultFeedService');

const lotteryType = {
  schedule: {
    drawHour: 23,
    drawMinute: 0
  }
};

const round = {
  drawAt: createBangkokDate(2026, 4, 19, 23, 0, 0)
};

const snapshot = {
  roundCode: '2026-04-19',
  resultPublishedAt: createBangkokDate(2026, 4, 19, 15, 0, 0)
};

const defaultReleaseAt = resolveSnapshotReleaseAt(snapshot, round, lotteryType, {});
assert(defaultReleaseAt instanceof Date, 'default releaseAt should be a Date');
assert.strictEqual(defaultReleaseAt.toISOString(), round.drawAt.toISOString(), 'default releaseAt should use drawAt');

const publishedReleaseAt = resolveSnapshotReleaseAt(snapshot, round, lotteryType, {
  releaseByPublishedAt: true
});
assert(publishedReleaseAt instanceof Date, 'published releaseAt should be a Date');
assert.strictEqual(
  publishedReleaseAt.toISOString(),
  snapshot.resultPublishedAt.toISOString(),
  'releaseByPublishedAt should prefer snapshot.resultPublishedAt'
);

console.log('Sync release strategy checks passed');
