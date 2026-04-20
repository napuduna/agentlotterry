const assert = require('assert');

const {
  __test
} = require('../services/marketResultsService');

const approxBetween = (value, min, max) => value >= min && value <= max;

const run = async () => {
  assert(__test, '__test helpers should be exported');
  assert.strictEqual(
    __test.DEFAULT_MARKET_RESULTS_CACHE_MS,
    300000,
    'default market overview cache TTL should be 300000ms'
  );
  assert.strictEqual(
    __test.DEFAULT_MARKET_RESULTS_BATCH_SIZE,
    12,
    'default official market batch size should be 12'
  );

  const started = [];
  const completed = [];
  const tasks = Array.from({ length: 4 }, (_, index) => ({
    key: `task-${index + 1}`,
    run: async () => {
      started.push(index + 1);
      await new Promise((resolve) => setTimeout(resolve, 80));
      completed.push(index + 1);
      return { key: index + 1 };
    }
  }));

  const startTime = Date.now();
  const results = await __test.runBatchedMarketTasks(tasks, 2);
  const elapsed = Date.now() - startTime;

  assert.strictEqual(results.length, 4, 'all tasks should resolve');
  assert.deepStrictEqual(
    results.map((entry) => entry.value.key),
    [1, 2, 3, 4],
    'results should stay in task order'
  );
  assert.deepStrictEqual(started.slice(0, 2), [1, 2], 'first batch should start together');
  assert(
    approxBetween(elapsed, 140, 260),
    `batched execution should take about two task windows, got ${elapsed}ms`
  );
  assert.deepStrictEqual(
    completed.sort((left, right) => left - right),
    [1, 2, 3, 4],
    'all tasks should complete'
  );

  console.log('testMarketOverviewBatching: ok');
};

run().catch((error) => {
  console.error('testMarketOverviewBatching: failed');
  console.error(error);
  process.exit(1);
});
