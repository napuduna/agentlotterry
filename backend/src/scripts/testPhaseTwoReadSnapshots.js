const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const read = (relativePath) => fs.readFileSync(path.join(root, relativePath), 'utf8');

const catalogService = read('services/catalogService.js');
const dashboardService = read('services/dashboardSnapshotService.js');
const adminRoutes = read('routes/adminRoutes.js');
const agentRoutes = read('routes/agentRoutes.js');
const bettingRoutes = read('routes/helpers/registerBettingRoutes.js');
const lotteryRoutes = read('routes/lotteryRoutes.js');
const externalFeedService = read('services/externalResultFeedService.js');
const readModelSnapshotService = read('services/readModelSnapshotService.js');

assert(catalogService.includes("require('../models/CatalogOverviewSnapshot')"), 'catalog service must use persistent snapshot model');
assert(catalogService.includes('loadCatalogOverviewSnapshot'), 'catalog service must load persisted snapshots');
assert(catalogService.includes('saveCatalogOverviewSnapshot'), 'catalog service must save persisted snapshots');
assert(catalogService.includes('rebuildOperatorCatalogOverviewSnapshots'), 'catalog service must expose operator snapshot rebuild');
assert(catalogService.includes('includeSnapshots = true'), 'catalog cache clear must invalidate persistent snapshots by default');

assert(dashboardService.includes("require('../models/DashboardSnapshot')"), 'dashboard service must use persistent snapshot model');
assert(dashboardService.includes('getAdminDashboardSummary'), 'dashboard service must expose admin summary reader');
assert(dashboardService.includes('getAgentDashboardSummary'), 'dashboard service must expose agent summary reader');
assert(dashboardService.includes('clearDashboardSnapshots'), 'dashboard service must expose snapshot invalidation');
assert(dashboardService.includes('rebuildDashboardSnapshots'), 'dashboard service must expose snapshot rebuild');

assert(adminRoutes.includes('getAdminDashboardSummary'), 'admin dashboard route must read dashboard snapshot service');
assert(!adminRoutes.includes('getBetTotals,\n  getRecentBetItems'), 'admin dashboard route should not import direct dashboard aggregates');
assert(agentRoutes.includes('getAgentDashboardSummary'), 'agent dashboard route must read dashboard snapshot service');
assert(!agentRoutes.includes('getBetTotals,\n  getRecentBetItems'), 'agent dashboard route should not import direct dashboard aggregates');

assert(bettingRoutes.includes('scheduleReadModelSnapshotRebuild'), 'betting writes must schedule read model snapshot rebuilds');
assert(lotteryRoutes.includes('scheduleReadModelSnapshotRebuild'), 'lottery settlement writes must schedule read model snapshot rebuilds');
assert(lotteryRoutes.includes('getReadModelSnapshotState'), 'sync status route must expose read model snapshot state');

assert(externalFeedService.includes('scheduleReadModelSnapshotRebuild'), 'external sync must schedule snapshot rebuilds');
assert(readModelSnapshotService.includes('rebuildOperatorCatalogOverviewSnapshots'), 'read model scheduler must rebuild catalog snapshots');
assert(readModelSnapshotService.includes('rebuildDashboardSnapshots'), 'read model scheduler must rebuild dashboard snapshots');

console.log('Phase 2 read snapshot wiring assertions passed');
