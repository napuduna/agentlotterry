const assert = require('assert');

const {
  HANOI_STAR_SITE_URL,
  HANOI_STAR_HISTORY_URL,
  __test
} = require('../services/hanoiStarResultService');

(async () => {
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

  const fallbackSnapshot = __test.buildSnapshot({
    roundCode: '2026-04-24T17:00:00.000Z',
    drawTime: '12:30',
    firstPrize: '96337',
    twoBottom: '43',
    sourceUrl: HANOI_STAR_HISTORY_URL
  });
  const attemptedUrls = [];
  const fetchedSnapshots = await __test.fetchHanoiStarSnapshotsWithFetcher({
    limit: 1,
    fetcher: async (url) => {
      attemptedUrls.push(url);
      if (url === HANOI_STAR_SITE_URL) {
        const error = new Error('Request failed with status code 403');
        error.response = { status: 403 };
        throw error;
      }
      return [fallbackSnapshot];
    }
  });

  assert.deepStrictEqual(attemptedUrls, [HANOI_STAR_SITE_URL, HANOI_STAR_HISTORY_URL]);
  assert.strictEqual(fetchedSnapshots.length, 1);
  assert.strictEqual(fetchedSnapshots[0].roundCode, '2026-04-25');
  assert.strictEqual(fetchedSnapshots[0].headline, '337');
  assert.strictEqual(fetchedSnapshots[0].twoBottom, '43');

  console.log('Hanoi Star date normalization tests passed');
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
