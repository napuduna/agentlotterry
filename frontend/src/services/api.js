import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || '';

const api = axios.create({
  baseURL: `${API_URL}/api`,
  headers: {
    'Content-Type': 'application/json'
  }
});
const buildNoCacheConfig = (params = {}) => ({
  params: {
    ...params,
    _t: Date.now()
  },
  headers: {
    'Cache-Control': 'no-cache',
    Pragma: 'no-cache'
  }
});
const READ_CACHE_DEFAULT_TTL_MS = Number(import.meta.env.VITE_API_READ_CACHE_MS || 15000);
const readCache = new Map();

const stableStringify = (value = {}) => {
  if (!value || typeof value !== 'object') return String(value);

  return JSON.stringify(
    Object.keys(value)
      .sort()
      .reduce((acc, key) => {
        const nextValue = value[key];
        if (nextValue !== undefined && nextValue !== null && nextValue !== '') {
          acc[key] = nextValue;
        }
        return acc;
      }, {})
  );
};

const getReadCacheKey = (url, params = {}) => {
  const token = localStorage.getItem('token') || '';
  return `${token}:${url}:${stableStringify(params)}`;
};

export const clearApiReadCache = () => {
  readCache.clear();
};

const cachedGet = (url, { params = {}, ttlMs = READ_CACHE_DEFAULT_TTL_MS, force = false } = {}) => {
  const cacheKey = getReadCacheKey(url, params);
  const now = Date.now();
  const cached = readCache.get(cacheKey);

  if (!force && cached && cached.expiresAt > now) {
    return cached.promise;
  }

  const request = api.get(
    url,
    force ? buildNoCacheConfig(params) : { params }
  ).catch((error) => {
    readCache.delete(cacheKey);
    throw error;
  });

  readCache.set(cacheKey, {
    expiresAt: now + Math.max(0, ttlMs),
    promise: request
  });

  return request;
};

// Add auth token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 401 responses
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      clearApiReadCache();
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth
export const login = (data) => api.post('/auth/login', data);
export const getMe = () => api.get('/auth/me');

// Admin
export const getAdminDashboard = () => api.get('/admin/dashboard');
export const getAgents = () => api.get('/admin/agents');
export const createAgent = (data) => api.post('/admin/agents', data);
export const updateAgent = (id, data) => api.put(`/admin/agents/${id}`, data);
export const deleteAgent = (id) => api.delete(`/admin/agents/${id}`);
export const getAdminCustomers = (agentId) => api.get(`/admin/customers${agentId ? `?agentId=${agentId}` : ''}`);
export const getAdminMemberBootstrap = (agentId) => api.get('/admin/customers/bootstrap', { params: { agentId } });
export const getAdminCustomerDetail = (id) => api.get(`/admin/customers/${id}`);
export const createAdminCustomer = (data) => api.post('/admin/customers', data);
export const updateAdminCustomer = (id, data) => api.put(`/admin/customers/${id}`, data);
export const deleteAdminCustomer = (id) => api.delete(`/admin/customers/${id}`);
export const getAdminBets = (params) => api.get('/admin/bets', { params });
export const getAdminReports = (params) => api.get('/admin/reports', { params });
export const searchAdminBettingMembers = (params) => api.get('/admin/betting/members/search', { params });
export const getAdminBettingMemberContext = (memberId) => api.get(`/admin/betting/members/${memberId}/context`);
export const parseAdminBettingSlip = (data) => api.post('/admin/betting/slips/parse', data);
export const createAdminBettingSlip = (data) => api.post('/admin/betting/slips', data);
export const cancelAdminBettingSlip = (slipId) => api.post(`/admin/betting/slips/${slipId}/cancel`);
export const getAdminRecentBettingItems = (params) => api.get('/admin/betting/items/recent', { params });
export const getAdminBettingDraft = (params) => api.get('/admin/betting/draft', { params });
export const saveAdminBettingDraft = (data) => api.put('/admin/betting/draft', data);
export const clearAdminBettingDraft = (data) => api.delete('/admin/betting/draft', { data });

// Agent
export const getAgentDashboard = () => api.get('/agent/dashboard');
export const getAgentMemberBootstrap = () => api.get('/agent/config/bootstrap');
export const getAgentMembers = (params) => api.get('/agent/members', { params });
export const getAgentMemberDetail = (id) => api.get(`/agent/members/${id}`);
export const createAgentMember = (data) => api.post('/agent/members', data);
export const updateAgentMemberProfile = (id, data) => api.put(`/agent/members/${id}`, data);
export const getAgentCustomers = (params) => api.get('/agent/customers', { params });
export const createCustomer = (data) => api.post('/agent/customers', data);
export const updateCustomer = (id, data) => api.put(`/agent/customers/${id}`, data);
export const deleteCustomer = (id) => api.delete(`/agent/customers/${id}`);
export const getAgentBets = (params) => api.get('/agent/bets', { params });
export const getAgentReports = (params) => api.get('/agent/reports', { params });
export const searchAgentBettingMembers = (params) => api.get('/agent/betting/members/search', { params });
export const getAgentBettingMemberContext = (memberId) => api.get(`/agent/betting/members/${memberId}/context`);
export const parseAgentBettingSlip = (data) => api.post('/agent/betting/slips/parse', data);
export const createAgentBettingSlip = (data) => api.post('/agent/betting/slips', data);
export const cancelAgentBettingSlip = (slipId) => api.post(`/agent/betting/slips/${slipId}/cancel`);
export const getAgentRecentBettingItems = (params) => api.get('/agent/betting/items/recent', { params });
export const getAgentBettingDraft = (params) => api.get('/agent/betting/draft', { params });
export const saveAgentBettingDraft = (data) => api.put('/agent/betting/draft', data);
export const clearAgentBettingDraft = (data) => api.delete('/agent/betting/draft', { data });

// Wallet
export const getWalletSummary = (params) => api.get('/wallet/summary', { params });
export const getWalletHistory = (params) => api.get('/wallet/history', { params });
export const transferWalletCredit = (data) => api.post('/wallet/transfer', data);
export const adjustWalletCredit = (data) => api.post('/wallet/adjust', data);

// Member slip flow
export const parseMemberSlip = (data) => api.post('/member/slips/parse', data);
export const createMemberSlip = (data) => api.post('/member/slips', data);
export const getMemberSlips = (params) => api.get('/member/slips', { params });
export const getMemberSlip = (slipId) => api.get(`/member/slips/${slipId}`);
export const cancelMemberSlip = (slipId) => api.post(`/member/slips/${slipId}/cancel`);
export const getMemberBetItems = (params) => api.get('/member/bets', { params });
export const getMemberSummary = (params) => api.get('/member/reports/summary', { params });

// Catalog
export const getCatalogOverview = (options = {}) => cachedGet('/catalog/overview', {
  ttlMs: 30000,
  force: Boolean(options.force)
});
export const getCatalogLotteries = () => api.get('/catalog/lotteries');
export const getCatalogRounds = (lotteryId) => api.get('/catalog/rounds', { params: { lotteryId } });
export const markCatalogAnnouncementRead = async (announcementId) => {
  const response = await api.post(`/catalog/announcements/${announcementId}/read`);
  clearApiReadCache();
  return response;
};

// Presence
export const sendPresenceHeartbeat = () => api.post('/presence/heartbeat');

// Results feed
export const getRecentMarketResults = (params, options = {}) => cachedGet('/results/recent', {
  params,
  ttlMs: 60000,
  force: Boolean(options.force)
});

// Lottery
export const getMarketOverview = (options = {}) => cachedGet('/lottery/markets', {
  ttlMs: 15000,
  force: Boolean(options.force)
});
export const getLotterySyncStatus = (options = {}) => cachedGet('/lottery/sync-status', {
  ttlMs: 5000,
  force: Boolean(options.force)
});
export const syncLatestLottery = async () => {
  const response = await api.post('/lottery/sync-latest');
  clearApiReadCache();
  return response;
};
export const getLatestLottery = () => api.get('/lottery/latest');
export const getLotteryResults = () => api.get('/lottery/results');
export const fetchLottery = async (data) => {
  const response = await api.post('/lottery/fetch', data);
  clearApiReadCache();
  return response;
};
export const manualLottery = async (data) => {
  const response = await api.post('/lottery/manual', data);
  clearApiReadCache();
  return response;
};
export const updateRoundClosedBetTypes = async (roundId, data) => {
  const response = await api.put(`/lottery/rounds/${roundId}/closed-bet-types`, data);
  clearApiReadCache();
  return response;
};
export const updateRoundBettingOverride = async (roundId, data) => {
  const response = await api.put(`/lottery/rounds/${roundId}/betting-override`, data);
  clearApiReadCache();
  return response;
};
export const reconcileLotteryRoundSettlement = (roundId) => api.get(`/lottery/rounds/${roundId}/settlement/reconcile`);
export const reverseLotteryRoundSettlement = async (roundId) => {
  const response = await api.post(`/lottery/rounds/${roundId}/settlement/reverse`);
  clearApiReadCache();
  return response;
};
export const rerunLotteryRoundSettlement = async (roundId) => {
  const response = await api.post(`/lottery/rounds/${roundId}/settlement/rerun`);
  clearApiReadCache();
  return response;
};

export default api;
