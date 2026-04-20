import assert from 'node:assert/strict';
import {
  getLatestResultCandidate,
  sortResultsByLatestFirst
} from '../src/utils/lotteryResultSelection.js';

const staleCatalogResult = {
  headline: '461252',
  firstPrize: '461252',
  drawAt: '2025-12-01T09:00:00.000Z',
  resultPublishedAt: '2025-12-01T09:00:00.000Z'
};

const freshApiResult = {
  headline: '309612',
  numbers: [
    { label: '3 ตัวบน', value: '612' },
    { label: '2 ตัวบน', value: '12' }
  ],
  drawAt: '2026-04-16',
  resultPublishedAt: '2026-04-16'
};

const latest = getLatestResultCandidate([staleCatalogResult, freshApiResult]);
assert.equal(latest?.headline, '309612', 'newer API result should win over stale catalog fallback');

const sorted = sortResultsByLatestFirst([staleCatalogResult, freshApiResult]);
assert.deepEqual(
  sorted.map((item) => item.headline),
  ['309612', '461252'],
  'results should be sorted newest first'
);

console.log('testLotteryResultSelection passed');
