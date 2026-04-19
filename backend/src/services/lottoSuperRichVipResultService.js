const axios = require('axios');
const { createBangkokDate } = require('../utils/bangkokTime');

const LOTTO_SUPER_RICH_PROVIDER_NAME = 'Lotto Super Rich Official';
const LOTTO_SUPER_RICH_SITE_URL = 'https://lottosuperrich.com/';
const LOTTO_SUPER_RICH_CURRENT_URL = 'https://gcp.lottosuperrich.com/result';
const LOTTO_SUPER_RICH_HISTORY_URL = 'https://gcp.lottosuperrich.com/history';
const LOTTO_SUPER_RICH_TIMEOUT_MS = Number(process.env.LOTTO_SUPER_RICH_TIMEOUT_MS || 15000);

const ENGLAND_VIP_MARKET_ID = 'england_vip';
const ENGLAND_VIP_MARKET_NAME = 'อังกฤษ VIP';
const GERMANY_VIP_MARKET_ID = 'germany_vip';
const GERMANY_VIP_MARKET_NAME = 'เยอรมัน VIP';
const RUSSIA_VIP_MARKET_ID = 'russia_vip';
const RUSSIA_VIP_MARKET_NAME = 'รัสเชีย VIP';

const MARKET_CONFIGS = {
  gb: {
    marketId: ENGLAND_VIP_MARKET_ID,
    marketName: ENGLAND_VIP_MARKET_NAME,
    drawHour: 21,
    drawMinute: 50
  },
  de: {
    marketId: GERMANY_VIP_MARKET_ID,
    marketName: GERMANY_VIP_MARKET_NAME,
    drawHour: 22,
    drawMinute: 50
  },
  ru: {
    marketId: RUSSIA_VIP_MARKET_ID,
    marketName: RUSSIA_VIP_MARKET_NAME,
    drawHour: 23,
    drawMinute: 50
  }
};

const http = axios.create({
  timeout: LOTTO_SUPER_RICH_TIMEOUT_MS,
  headers: {
    'User-Agent': 'Mozilla/5.0 Codex AdminAgentLotterry'
  }
});

const stringValue = (value) => {
  if (value === null || value === undefined) return '';
  if (typeof value === 'string') return value.trim();
  if (typeof value === 'number') return String(value);
  return '';
};

const compactDigits = (value) => stringValue(value).replace(/\D/g, '');
const tailDigits = (value, length) => compactDigits(value).slice(-length);
const uniqueDigits = (value) => [...new Set(compactDigits(value).split('').filter(Boolean))];

const parseRoundCode = (value) => {
  const normalized = stringValue(value);
  return /^\d{4}-\d{2}-\d{2}$/.test(normalized) ? normalized : '';
};

const parseBangkokDateTime = (value) => {
  const normalized = stringValue(value);
  const match = normalized.match(/^(\d{4})-(\d{2})-(\d{2})[\sT](\d{2}):(\d{2})(?::(\d{2}))?$/);

  if (!match) {
    const parsed = new Date(normalized);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }

  return createBangkokDate(
    Number(match[1]),
    Number(match[2]),
    Number(match[3]),
    Number(match[4]),
    Number(match[5]),
    Number(match[6] || 0)
  );
};

const buildBangkokDateFromRoundCode = (roundCode, hour, minute) => {
  const [year, month, day] = roundCode.split('-').map(Number);
  if (!year || !month || !day) return null;
  return createBangkokDate(year, month, day, hour, minute, 0);
};

const buildSnapshot = ({ marketType, payload, publishedAt }) => {
  const marketConfig = MARKET_CONFIGS[marketType];
  const roundCode = parseRoundCode(payload?.lotto_date);
  const firstPrize = compactDigits(payload?.results?.prize_1st);
  const secondPrize = compactDigits(payload?.results?.prize_2nd);
  const threeTop = tailDigits(firstPrize, 3);
  const twoTop = tailDigits(firstPrize, 2);
  const twoBottom = tailDigits(secondPrize, 2);

  if (!marketConfig || !roundCode || !firstPrize || !secondPrize || !threeTop || !twoTop || !twoBottom) {
    return null;
  }

  return {
    lotteryCode: marketConfig.marketId,
    feedCode: marketConfig.marketId,
    marketName: marketConfig.marketName,
    roundCode,
    headline: threeTop,
    firstPrize,
    threeTop,
    threeFront: '',
    twoTop,
    twoBottom,
    threeBottom: '',
    threeTopHits: [threeTop],
    twoTopHits: [twoTop],
    twoBottomHits: [twoBottom],
    threeFrontHits: [],
    threeBottomHits: [],
    runTop: uniqueDigits(threeTop),
    runBottom: uniqueDigits(twoBottom),
    resultPublishedAt: publishedAt || null,
    isSettlementSafe: true,
    sourceUrl: LOTTO_SUPER_RICH_SITE_URL,
    rawPayload: payload
  };
};

const fetchCurrentPayload = async (marketType) => {
  const response = await http.get(LOTTO_SUPER_RICH_CURRENT_URL);
  return response.data?.data?.[marketType] || null;
};

const fetchHistoryRows = async (marketType) => {
  const response = await http.get(`${LOTTO_SUPER_RICH_HISTORY_URL}/${marketType}?date=`);
  return Array.isArray(response.data?.data) ? response.data.data : [];
};

const dedupeSnapshots = (snapshots, limit) => {
  const byRoundCode = new Map();

  snapshots.filter(Boolean).forEach((snapshot) => {
    if (!byRoundCode.has(snapshot.roundCode)) {
      byRoundCode.set(snapshot.roundCode, snapshot);
    }
  });

  return [...byRoundCode.values()]
    .sort((left, right) => right.roundCode.localeCompare(left.roundCode))
    .slice(0, Math.max(1, Number(limit) || 1));
};

const fetchSnapshotsByMarketType = async (marketType, { limit = 10 } = {}) => {
  const marketConfig = MARKET_CONFIGS[marketType];
  if (!marketConfig) {
    return [];
  }

  const [currentPayloadResult, historyRowsResult] = await Promise.allSettled([
    fetchCurrentPayload(marketType),
    fetchHistoryRows(marketType)
  ]);

  const currentPayload = currentPayloadResult.status === 'fulfilled' ? currentPayloadResult.value : null;
  const historyRows = historyRowsResult.status === 'fulfilled' ? historyRowsResult.value : [];

  return dedupeSnapshots([
    buildSnapshot({
      marketType,
      payload: currentPayload,
      publishedAt: parseBangkokDateTime(currentPayload?.show_1st)
        || buildBangkokDateFromRoundCode(parseRoundCode(currentPayload?.lotto_date), marketConfig.drawHour, marketConfig.drawMinute)
    }),
    ...historyRows.map((row) => buildSnapshot({
      marketType,
      payload: row,
      publishedAt: buildBangkokDateFromRoundCode(parseRoundCode(row?.lotto_date), marketConfig.drawHour, marketConfig.drawMinute)
    }))
  ], limit);
};

const fetchEnglandVipSnapshots = async ({ limit = 10 } = {}) => fetchSnapshotsByMarketType('gb', { limit });
const fetchGermanyVipSnapshots = async ({ limit = 10 } = {}) => fetchSnapshotsByMarketType('de', { limit });
const fetchRussiaVipSnapshots = async ({ limit = 10 } = {}) => fetchSnapshotsByMarketType('ru', { limit });

const fetchLatestEnglandVipSnapshot = async () => {
  const snapshots = await fetchEnglandVipSnapshots({ limit: 1 });
  return snapshots[0] || null;
};

const fetchLatestGermanyVipSnapshot = async () => {
  const snapshots = await fetchGermanyVipSnapshots({ limit: 1 });
  return snapshots[0] || null;
};

const fetchLatestRussiaVipSnapshot = async () => {
  const snapshots = await fetchRussiaVipSnapshots({ limit: 1 });
  return snapshots[0] || null;
};

module.exports = {
  LOTTO_SUPER_RICH_PROVIDER_NAME,
  LOTTO_SUPER_RICH_SITE_URL,
  ENGLAND_VIP_MARKET_ID,
  ENGLAND_VIP_MARKET_NAME,
  GERMANY_VIP_MARKET_ID,
  GERMANY_VIP_MARKET_NAME,
  RUSSIA_VIP_MARKET_ID,
  RUSSIA_VIP_MARKET_NAME,
  fetchEnglandVipSnapshots,
  fetchLatestEnglandVipSnapshot,
  fetchGermanyVipSnapshots,
  fetchLatestGermanyVipSnapshot,
  fetchRussiaVipSnapshots,
  fetchLatestRussiaVipSnapshot
};
