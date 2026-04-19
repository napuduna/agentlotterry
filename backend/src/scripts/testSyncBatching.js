const assert = require('assert');

const { runItemsInBatches } = require('../services/externalResultFeedService');

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

(async () => {
  let active = 0;
  let maxActive = 0;

  const values = [1, 2, 3, 4, 5];
  const results = await runItemsInBatches(values, 2, async (value) => {
    active += 1;
    maxActive = Math.max(maxActive, active);
    await sleep(15);
    active -= 1;
    return value * 10;
  });

  assert.deepStrictEqual(results, [10, 20, 30, 40, 50], 'batched runner should preserve output order');
  assert.strictEqual(maxActive, 2, 'batched runner should respect concurrency limit');

  console.log('Sync batching tests passed');
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
