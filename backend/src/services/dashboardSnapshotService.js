const DashboardSnapshot = require('../models/DashboardSnapshot');
const User = require('../models/User');
const { getBetTotals, getRecentBetItems } = require('./analyticsService');
const { isUserOnline } = require('./memberManagementService');

const DEFAULT_DASHBOARD_SNAPSHOT_TTL_MS = 60000;
const DASHBOARD_SNAPSHOT_TTL_MS = Math.max(
  0,
  Number(process.env.DASHBOARD_SNAPSHOT_TTL_MS || DEFAULT_DASHBOARD_SNAPSHOT_TTL_MS)
);
const DASHBOARD_SNAPSHOT_STALE_MAX_MS = Math.max(
  DASHBOARD_SNAPSHOT_TTL_MS,
  Number(process.env.DASHBOARD_SNAPSHOT_STALE_MAX_MS || 10 * 60 * 1000)
);

const snapshotCache = new Map();
const snapshotInFlight = new Map();

const toIdString = (value) => value?._id?.toString?.() || value?.toString?.() || '';
const getAdminDashboardKey = () => 'admin:global';
const getAgentDashboardKey = (agentId) => `agent:${toIdString(agentId)}`;
const getSnapshotAgeMs = (builtAt, now = Date.now()) => {
  const builtAtMs = new Date(builtAt || 0).getTime();
  return Number.isFinite(builtAtMs) ? now - builtAtMs : Infinity;
};

const isFresh = (builtAt, now = Date.now()) => {
  if (!builtAt) {
    return false;
  }

  if (DASHBOARD_SNAPSHOT_TTL_MS <= 0) {
    return true;
  }

  return getSnapshotAgeMs(builtAt, now) < DASHBOARD_SNAPSHOT_TTL_MS;
};

const isUsableStale = (builtAt, now = Date.now()) => {
  if (!builtAt) {
    return false;
  }

  return isFresh(builtAt, now) ||
    (DASHBOARD_SNAPSHOT_STALE_MAX_MS > 0 && getSnapshotAgeMs(builtAt, now) < DASHBOARD_SNAPSHOT_STALE_MAX_MS);
};

const scheduleDashboardSnapshotRefresh = (key, reason = 'dashboard-stale-read') => {
  try {
    const { scheduleReadModelSnapshotRebuild } = require('./readModelSnapshotService');
    const options = {
      reason,
      targets: ['dashboard']
    };

    if (String(key || '').startsWith('agent:')) {
      options.agentIds = [String(key).slice('agent:'.length)].filter(Boolean);
    }

    scheduleReadModelSnapshotRebuild(options);
  } catch (error) {
    console.warn('Failed to schedule dashboard snapshot refresh:', error.message);
  }
};

const createDashboardSnapshotDocument = (key, payload) => ({
  key,
  payload: payload || {},
  builtAt: new Date(),
  version: 1
});

const restoreDashboardSnapshotDocument = (document) => {
  if (!document?.payload || typeof document.payload !== 'object') {
    return null;
  }

  return document.payload;
};

const loadDashboardSnapshotState = async (key, now = Date.now(), { allowStale = false } = {}) => {
  const document = await DashboardSnapshot.findOne({ key }).lean();
  if (!document) {
    return null;
  }

  const payload = restoreDashboardSnapshotDocument(document);
  if (!payload) {
    return null;
  }

  const fresh = isFresh(document.builtAt, now);
  if (!fresh && (!allowStale || !isUsableStale(document.builtAt, now))) {
    return null;
  }

  return {
    payload,
    builtAt: document.builtAt,
    isFresh: fresh
  };
};

const loadDashboardSnapshot = async (key, now = Date.now()) => {
  const snapshot = await loadDashboardSnapshotState(key, now);
  return snapshot?.payload || null;
};

const saveDashboardSnapshot = async (key, payload) => {
  const document = createDashboardSnapshotDocument(key, payload);
  await DashboardSnapshot.findOneAndUpdate(
    { key },
    document,
    {
      new: true,
      upsert: true,
      setDefaultsOnInsert: true
    }
  );
};

const getSnapshot = async (key, builder, { force = false } = {}) => {
  const now = Date.now();
  const cached = snapshotCache.get(key);

  if (!force && cached && isFresh(cached.builtAt, now)) {
    return cached.payload;
  }

  if (!force && cached?.payload && isUsableStale(cached.builtAt, now)) {
    scheduleDashboardSnapshotRefresh(key, 'dashboard-stale-memory-read');
    return cached.payload;
  }

  if (!force) {
    const persisted = await loadDashboardSnapshotState(key, now, { allowStale: true });
    if (persisted) {
      snapshotCache.set(key, {
        builtAt: persisted.builtAt,
        payload: persisted.payload
      });
      if (!persisted.isFresh) {
        scheduleDashboardSnapshotRefresh(key, 'dashboard-stale-persistent-read');
      }
      return persisted.payload;
    }
  }

  if (snapshotInFlight.has(key)) {
    return snapshotInFlight.get(key);
  }

  const request = builder()
    .then(async (payload) => {
      snapshotCache.set(key, {
        builtAt: new Date(),
        payload
      });
      snapshotInFlight.delete(key);
      await saveDashboardSnapshot(key, payload).catch((error) => {
        console.warn('Failed to save dashboard snapshot:', error.message);
      });
      return payload;
    })
    .catch((error) => {
      snapshotInFlight.delete(key);
      throw error;
    });

  snapshotInFlight.set(key, request);
  return request;
};

const buildAdminDashboardPayload = async () => {
  const [
    totalAgents,
    totalCustomers,
    activeAgents,
    activeCustomers,
    betStats,
    recentBets
  ] = await Promise.all([
    User.countDocuments({ role: 'agent' }),
    User.countDocuments({ role: 'customer' }),
    User.countDocuments({ role: 'agent', isActive: true }),
    User.countDocuments({ role: 'customer', isActive: true }),
    getBetTotals(),
    getRecentBetItems({ limit: 10 })
  ]);

  return {
    stats: {
      totalAgents,
      totalCustomers,
      activeAgents,
      activeCustomers,
      totalBets: betStats.totalBets,
      pendingBets: betStats.pendingBets,
      totalAmount: betStats.totalAmount,
      totalWon: betStats.totalWon,
      netProfit: betStats.netProfit
    },
    recentBets
  };
};

const buildAgentDashboardPayload = async ({ agent }) => {
  const agentId = agent?._id || agent?.id;
  const onlineSince = new Date(Date.now() - 5 * 60 * 1000);
  const [totalCustomers, activeCustomers, onlineCustomers, memberRows, betStats, recentBets, onlineMemberRows] = await Promise.all([
    User.countDocuments({ agentId, role: 'customer' }),
    User.countDocuments({ agentId, role: 'customer', isActive: true }),
    User.countDocuments({
      agentId,
      role: 'customer',
      isActive: true,
      status: 'active',
      lastActiveAt: { $gte: onlineSince }
    }),
    User.find({ agentId, role: 'customer' })
      .select('creditBalance stockPercent isActive status lastActiveAt')
      .lean(),
    getBetTotals({ agentId }),
    getRecentBetItems({ agentId, limit: 10 }),
    User.find({
      agentId,
      role: 'customer',
      isActive: true,
      status: 'active',
      lastActiveAt: { $gte: onlineSince }
    })
      .select('name username lastActiveAt isActive status')
      .sort({ lastActiveAt: -1 })
      .limit(6)
      .lean()
  ]);

  const totalCreditBalance = memberRows.reduce((sum, member) => sum + (member.creditBalance || 0), 0);
  const averageStockPercent = memberRows.length
    ? memberRows.reduce((sum, member) => sum + (member.stockPercent || 0), 0) / memberRows.length
    : 0;

  return {
    stats: {
      totalCustomers,
      activeCustomers,
      onlineCustomers,
      agentCreditBalance: agent?.creditBalance || 0,
      totalBets: betStats.totalBets,
      pendingBets: betStats.pendingBets,
      totalAmount: betStats.totalAmount,
      totalWon: betStats.totalWon,
      netProfit: betStats.netProfit,
      totalCreditBalance,
      averageStockPercent
    },
    recentBets,
    onlineMembers: onlineMemberRows.map((member) => ({
      id: member._id.toString(),
      name: member.name,
      username: member.username,
      lastActiveAt: member.lastActiveAt,
      isOnline: isUserOnline(member)
    }))
  };
};

const getAdminDashboardSummary = async (options = {}) =>
  getSnapshot(getAdminDashboardKey(), buildAdminDashboardPayload, options);

const getAgentDashboardSummary = async ({ agent, force = false }) =>
  getSnapshot(getAgentDashboardKey(agent?._id || agent?.id), () => buildAgentDashboardPayload({ agent }), { force });

const clearDashboardSnapshots = ({ includePersistent = true } = {}) => {
  snapshotCache.clear();
  snapshotInFlight.clear();

  if (includePersistent) {
    return DashboardSnapshot.deleteMany({}).catch((error) => {
      console.warn('Failed to clear dashboard snapshots:', error.message);
    });
  }

  return Promise.resolve();
};

const rebuildDashboardSnapshots = async ({ includeAgents = false, agentLimit = 50, agentIds = [] } = {}) => {
  const summary = {
    admin: false,
    agentsAttempted: 0,
    agentsRebuilt: 0,
    failed: 0,
    errors: []
  };

  try {
    await getAdminDashboardSummary({ force: true });
    summary.admin = true;
  } catch (error) {
    summary.failed += 1;
    summary.errors.push({ key: getAdminDashboardKey(), message: error.message });
  }

  const scopedAgentIds = [...new Set(
    (Array.isArray(agentIds) ? agentIds : [agentIds])
      .map(toIdString)
      .filter(Boolean)
  )];

  if (!includeAgents && !scopedAgentIds.length) {
    return summary;
  }

  const agentQuery = includeAgents
    ? {
      role: 'agent',
      isActive: { $ne: false }
    }
    : { _id: { $in: scopedAgentIds }, role: 'agent' };

  const agents = await User.find(agentQuery)
    .select('_id creditBalance')
    .sort({ createdAt: 1 })
    .limit(includeAgents ? Math.max(1, Number(agentLimit) || 50) : scopedAgentIds.length)
    .lean();

  summary.agentsAttempted = agents.length;

  for (const agent of agents) {
    try {
      await getAgentDashboardSummary({ agent, force: true });
      summary.agentsRebuilt += 1;
    } catch (error) {
      summary.failed += 1;
      summary.errors.push({
        key: getAgentDashboardKey(agent._id),
        message: error.message
      });
    }
  }

  return summary;
};

module.exports = {
  getAdminDashboardSummary,
  getAgentDashboardSummary,
  clearDashboardSnapshots,
  rebuildDashboardSnapshots,
  __test: {
    getAdminDashboardKey,
    getAgentDashboardKey,
    createDashboardSnapshotDocument,
    restoreDashboardSnapshotDocument,
    isFresh,
    isUsableStale
  }
};
