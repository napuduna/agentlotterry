const assert = require('assert');

const { resolveSyncExecutionMode } = require('../services/externalResultFeedService');

assert.deepStrictEqual(
  resolveSyncExecutionMode(),
  {
    runSettlement: true,
    mode: 'full'
  },
  'default sync mode should keep inline settlement'
);

assert.deepStrictEqual(
  resolveSyncExecutionMode({ runSettlement: false }),
  {
    runSettlement: false,
    mode: 'fetch-store'
  },
  'manual fetch/store mode should skip inline settlement'
);

console.log('Sync execution mode tests passed');
