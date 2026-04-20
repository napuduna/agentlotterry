require('dotenv').config();

const mongoose = require('mongoose');
const connectDB = require('../config/db');
const { rebuildMarketOverviewSnapshot } = require('../services/marketResultsService');

const REQUIRED_MARKETS = [
  'hanoi-special',
  'hanoi-extra',
  'lao-pathana',
  'lao-redcross',
  'stock-hangseng-morning-vip',
  'stock-hangseng-afternoon-vip',
  'stock-taiwan-vip',
  'stock-nikkei-morning',
  'stock-nikkei-morning-vip',
  'stock-nikkei-afternoon-vip',
  'stock-korea-vip',
  'stock-china-morning-vip',
  'stock-china-afternoon',
  'stock-china-afternoon-vip',
  'stock-singapore-vip',
  'stock-russia-vip',
  'stock-germany-vip',
  'stock-england-vip',
  'stock-dowjones'
];

const getMarketMap = (overview) => new Map(
  (overview.sections || [])
    .flatMap((section) => section.markets || [])
    .map((market) => [market.id, market])
);

(async () => {
  await connectDB();

  try {
    const overview = await rebuildMarketOverviewSnapshot();
    const marketMap = getMarketMap(overview);

    REQUIRED_MARKETS.forEach((marketId) => {
      const market = marketMap.get(marketId);
      if (!market) {
        throw new Error(`Market ${marketId} missing from overview`);
      }

      if (!market.resultDate || !market.headline || market.status === 'waiting') {
        throw new Error(`Market ${marketId} did not hydrate from stored snapshot`);
      }
    });

    console.log('testMarketOverviewIdAliases passed');
  } finally {
    await mongoose.disconnect();
  }
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
