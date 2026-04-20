const assert = require('assert');
const marketResultsService = require('../services/marketResultsService');

const createOverviewSnapshotDocument = marketResultsService.__test?.createOverviewSnapshotDocument;
const restoreOverviewFromSnapshotDocument = marketResultsService.__test?.restoreOverviewFromSnapshotDocument;

assert.strictEqual(
  typeof createOverviewSnapshotDocument,
  'function',
  'Expected createOverviewSnapshotDocument to be exported for snapshot store tests'
);

assert.strictEqual(
  typeof restoreOverviewFromSnapshotDocument,
  'function',
  'Expected restoreOverviewFromSnapshotDocument to be exported for snapshot store tests'
);

const overview = {
  provider: {
    name: 'manycai',
    configured: true,
    baseUrl: 'db://market-overview-snapshot',
    fetchedAt: '2026-04-20T00:00:00.000Z',
    cacheTtlMs: 300000,
    mode: 'db-snapshot'
  },
  summary: {
    totalMarkets: 2,
    liveCount: 1,
    pendingCount: 1,
    unsupportedCount: 0
  },
  warnings: ['ยังไม่มี snapshot ในระบบสำหรับ บางตลาด'],
  sections: [
    {
      id: 'international',
      title: 'หวยต่างประเทศ',
      description: 'ข้อมูลจาก snapshot',
      markets: [
        {
          id: 'lao',
          name: 'หวยลาว',
          provider: 'Huay Lao Official',
          resultDate: '2026-04-17',
          headline: '079',
          numbers: [
            { label: '3 ตัวบน', value: '079' },
            { label: '2 ตัวบน', value: '79' },
            { label: '2 ตัวล่าง', value: '50' }
          ],
          note: 'snapshot',
          sourceUrl: 'https://huaylao.la/',
          status: 'live'
        }
      ]
    }
  ]
};

const snapshotDocument = createOverviewSnapshotDocument(overview);
assert.strictEqual(snapshotDocument.key, 'default');
assert.ok(snapshotDocument.builtAt, 'Expected builtAt to be set');
assert.deepStrictEqual(snapshotDocument.payload.sections, overview.sections);

const restoredOverview = restoreOverviewFromSnapshotDocument(snapshotDocument);
assert.strictEqual(restoredOverview.provider, overview.provider);
assert.strictEqual(restoredOverview.summary, overview.summary);
assert.deepStrictEqual(restoredOverview.warnings, overview.warnings);
assert.deepStrictEqual(
  restoredOverview.sections.map((section) => section.id),
  ['daily'],
  'Expected restored snapshots to be normalized into display groups'
);
assert.strictEqual(restoredOverview.sections[0].title, 'หวยรายวัน');
assert.deepStrictEqual(restoredOverview.sections[0].markets, overview.sections[0].markets);

console.log('testMarketOverviewSnapshotStore passed');
