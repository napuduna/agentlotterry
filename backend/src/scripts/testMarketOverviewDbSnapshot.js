const assert = require('assert');
const marketResultsService = require('../services/marketResultsService');

const cloneSectionsForTest = marketResultsService.__test?.cloneSectionsForTest;
const hydrateSectionsFromStoredSnapshot = marketResultsService.__test?.hydrateSectionsFromStoredSnapshot;

assert.strictEqual(
  typeof cloneSectionsForTest,
  'function',
  'Expected cloneSectionsForTest to be exported for DB snapshot tests'
);

assert.strictEqual(
  typeof hydrateSectionsFromStoredSnapshot,
  'function',
  'Expected hydrateSectionsFromStoredSnapshot to be exported for DB snapshot tests'
);

const sections = cloneSectionsForTest();
const snapshotByCode = new Map([
  ['tlzc', {
    roundCode: '2026-04-17',
    result: {
      headline: '079',
      threeTop: '079',
      twoTop: '79',
      twoBottom: '50',
      sourceUrl: 'https://huaylao.la/'
    }
  }],
  ['thai_government', {
    roundCode: '2026-04-16',
    result: {
      headline: '309612',
      firstPrize: '309612',
      threeTop: '612',
      twoTop: '12',
      threeFrontHits: ['123', '456'],
      threeBottomHits: ['789', '012'],
      twoBottom: '34',
      sourceUrl: 'https://www.glo.or.th/'
    }
  }]
]);

hydrateSectionsFromStoredSnapshot(sections, snapshotByCode);

const findMarket = (marketId) => sections
  .flatMap((section) => section.markets || [])
  .find((market) => market.id === marketId);

const lao = findMarket('lao');
assert.ok(lao, 'Expected lao market to exist');
assert.strictEqual(lao.resultDate, '2026-04-17');
assert.strictEqual(lao.headline, '079');
assert.deepStrictEqual(lao.numbers, [
  { label: '3 ตัวบน', value: '079' },
  { label: '2 ตัวบน', value: '79' },
  { label: '2 ตัวล่าง', value: '50' }
]);
assert.strictEqual(lao.sourceUrl, 'https://huaylao.la/');
assert.strictEqual(lao.status, 'live');

const thaiGovernment = findMarket('thai-government');
assert.ok(thaiGovernment, 'Expected thai-government market to exist');
assert.strictEqual(thaiGovernment.resultDate, '2026-04-16');
assert.strictEqual(thaiGovernment.headline, '309612');
assert.deepStrictEqual(thaiGovernment.numbers, [
  { label: '3 ตัวบน', value: '612' },
  { label: '2 ตัวบน', value: '12' },
  { label: '3 ตัวหน้า', value: '123 / 456' },
  { label: '3 ตัวล่าง', value: '789 / 012' },
  { label: '2 ตัวล่าง', value: '34' }
]);
assert.strictEqual(thaiGovernment.sourceUrl, 'https://www.glo.or.th/');
assert.strictEqual(thaiGovernment.status, 'live');

const hanoiVip = findMarket('hanoi-vip');
assert.ok(hanoiVip, 'Expected hanoi-vip market to exist');
assert.strictEqual(hanoiVip.status, 'waiting');
assert.strictEqual(hanoiVip.headline, '');

console.log('testMarketOverviewDbSnapshot passed');
