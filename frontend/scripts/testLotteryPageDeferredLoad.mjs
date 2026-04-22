import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(process.cwd(), 'frontend');
const read = (relativePath) => fs.readFileSync(path.join(root, relativePath), 'utf8');

const pageSource = read('src/pages/admin/AdminLottery.jsx');
const apiSource = read('src/services/api.js');
const preloadSource = read('src/utils/appPreload.js');

assert.match(pageSource, /const catalogTask = getCatalogOverview\(\{ force \}\)/, 'lottery page should start catalog loading without blocking the initial render path');
assert.match(pageSource, /const marketTask = getMarketOverview\(\{ force \}\)/, 'lottery page should keep market snapshot as the primary render dependency');
assert.match(pageSource, /const syncTask = isAdmin/, 'lottery page should load admin sync status separately');
assert.match(pageSource, /await marketTask;[\s\S]*setLoading\(false\);/, 'lottery page should clear the skeleton after the market snapshot settles');
assert.match(pageSource, /Promise\.allSettled\(\[catalogTask, syncTask\]\)/, 'catalog and sync status should finish in the background after first render');
assert.doesNotMatch(pageSource, /Promise\.allSettled\(\[\s*getCatalogOverview\(\{ force \}\),\s*getMarketOverview\(\{ force \}\),\s*isAdmin \? getLotterySyncStatus/s, 'lottery page should not wait for all result APIs before rendering');

assert.match(apiSource, /getAdminBettingMemberContext[\s\S]*ttlMs: READ_TTL_LONG_MS/, 'admin betting member context should use long read cache TTL');
assert.match(apiSource, /getAgentBettingMemberContext[\s\S]*ttlMs: READ_TTL_LONG_MS/, 'agent betting member context should use long read cache TTL');
assert.match(apiSource, /getMarketOverview[\s\S]*ttlMs: READ_TTL_LONG_MS/, 'market overview should use long read cache TTL');
assert.match(apiSource, /getLotterySyncStatus[\s\S]*ttlMs: READ_TTL_MEDIUM_MS/, 'sync status should not use the shortest read cache TTL');

const adminLotteryWarmBlock = preloadSource.match(/'\/admin\/lottery': \[[\s\S]*?\]/)?.[0] || '';
assert.doesNotMatch(adminLotteryWarmBlock, /getLotterySyncStatus/, 'admin lottery preload should not warm sync status on navigation');

console.log('testLotteryPageDeferredLoad passed');
