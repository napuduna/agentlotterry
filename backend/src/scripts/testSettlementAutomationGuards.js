const assert = require('assert/strict');
const { readFileSync } = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const routeSource = readFileSync(path.join(root, 'routes', 'lotteryRoutes.js'), 'utf8');
const externalSyncSource = readFileSync(path.join(root, 'services', 'externalResultFeedService.js'), 'utf8');
const resultServiceSource = readFileSync(path.join(root, 'services', 'resultService.js'), 'utf8');

const adminSyncRoute = routeSource.match(/router\.post\('\/sync-latest'[\s\S]*?\n\}\);/);
assert.ok(adminSyncRoute, 'admin sync-latest route should be present');
assert.ok(
  adminSyncRoute[0].includes('syncLatestExternalResults()'),
  'admin sync-latest route should run full result sync with settlement enabled'
);
assert.ok(
  !adminSyncRoute[0].includes('runSettlement: false'),
  'admin sync-latest route must not defer settlement'
);

assert.ok(
  resultServiceSource.includes('const settleUnsettledPublishedRounds = async'),
  'result service should expose a safety settlement pass for published rounds with pending items'
);
assert.ok(
  resultServiceSource.includes('settleUnsettledPublishedRounds,'),
  'settleUnsettledPublishedRounds should be exported'
);
assert.ok(
  externalSyncSource.includes('settleUnsettledPublishedRounds'),
  'external sync should call the safety settlement pass after normal sync'
);
assert.ok(
  externalSyncSource.includes('summary.safetySettlement = await settleUnsettledPublishedRounds()'),
  'external sync should record safety settlement results'
);

console.log('testSettlementAutomationGuards passed');
