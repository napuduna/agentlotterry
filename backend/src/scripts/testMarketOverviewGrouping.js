const assert = require('assert');
const marketResultsService = require('../services/marketResultsService');

const groupSectionsForDisplay = marketResultsService.__test?.groupSectionsForDisplay;

assert.strictEqual(
  typeof groupSectionsForDisplay,
  'function',
  'Expected groupSectionsForDisplay to be exported for grouping tests'
);

const grouped = groupSectionsForDisplay([
  {
    id: 'government',
    markets: [
      { id: 'thai-government', name: 'Thai Government' }
    ]
  },
  {
    id: 'international',
    markets: [
      { id: 'hanoi-vip', name: 'Hanoi VIP' },
      { id: 'hanoi-extra', name: 'Hanoi Extra' },
      { id: 'yeekee-vip', name: 'Yeekee VIP' },
      { id: 'lao', name: 'Lao' }
    ]
  },
  {
    id: 'stocks',
    markets: [
      { id: 'stock-hangseng-morning-vip', name: 'Hang Seng Morning VIP' },
      { id: 'stock-dowjones-vip', name: 'Dow Jones VIP' },
      { id: 'stock-dowjones', name: 'Dow Jones' },
      { id: 'stock-thai', name: 'Thai Stock' }
    ]
  }
]);

assert.deepStrictEqual(
  grouped.map((section) => section.id),
  ['government', 'international', 'daily', 'stock-vip', 'stocks']
);
assert.deepStrictEqual(grouped.map((section) => section.title), [
  'รัฐบาลไทย',
  'หวยต่างประเทศ',
  'หวยรายวัน',
  'หุ้น VIP',
  'หุ้น'
]);

const marketIdsBySection = new Map(
  grouped.map((section) => [section.id, section.markets.map((market) => market.id)])
);

assert.deepStrictEqual(marketIdsBySection.get('government'), ['thai-government']);
assert.deepStrictEqual(marketIdsBySection.get('international'), ['hanoi-vip', 'hanoi-extra', 'yeekee-vip']);
assert.deepStrictEqual(marketIdsBySection.get('daily'), ['lao']);
assert.deepStrictEqual(marketIdsBySection.get('stock-vip'), ['stock-hangseng-morning-vip', 'stock-dowjones-vip']);
assert.deepStrictEqual(marketIdsBySection.get('stocks'), ['stock-dowjones', 'stock-thai']);

console.log('testMarketOverviewGrouping passed');
