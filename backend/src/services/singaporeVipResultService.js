const axios = require('axios');
const { createBangkokDate } = require('../utils/bangkokTime');

const SINGAPORE_VIP_PROVIDER_NAME = 'Stocks VIP Official';
const SINGAPORE_VIP_SITE_URL = 'https://stocks-vip.com/';
const SINGAPORE_VIP_CURRENT_URL = 'https://api.stocks-vip.com/api/sg';
const SINGAPORE_VIP_HISTORY_URL = 'https://api.stocks-vip.com/api/history/sg';
const SINGAPORE_VIP_TIMEOUT_MS = Number(process.env.SINGAPORE_VIP_TIMEOUT_MS || 15000);

const SINGAPORE_VIP_MARKET_ID = 'singapore_vip';
const SINGAPORE_VIP_MARKET_NAME = 'สิงคโปร์ VIP';
const SINGAPORE_VIP_DRAW_HOUR = 18;
const SINGAPORE_VIP_DRAW_MINUTE = 5;
const SINGAPORE_VIP_CLOSE_TIME = '18:05';

const http = axios.create({
  timeout: SINGAPORE_VIP_TIMEOUT_MS,
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

const buildBangkokDateFromRoundCode = (roundCode, hour, minute) => {
  const [year, month, day] = roundCode.split('-').map(Number);
  if (!year || !month || !day) return null;
  return createBangkokDate(year, month, day, hour, minute, 0);
};

const formatTopFromPrice = (price) => {
  const parsed = Number(price);
  if (!Number.isFinite(parsed)) return '';

  const [integerPart, decimalPart = '00'] = Math.abs(parsed).toFixed(2).split('.');
  return `${integerPart.slice(-1)}${decimalPart}`.replace(/\D/g, '');
};

const formatBottomFromDiff = (diff) => {
  const parsed = Number(diff);
  if (!Number.isFinite(parsed)) return '';
  return Math.abs(parsed).toFixed(2).split('.')[1].replace(/\D/g, '');
};

const buildSnapshot = ({
  roundCode,
  threeTop,
  twoBottom,
  publishedAt,
  rawPayload
}) => {
  const normalizedRoundCode = parseRoundCode(roundCode);
  const normalizedThreeTop = compactDigits(threeTop);
  const normalizedTwoBottom = compactDigits(twoBottom);
  const twoTop = tailDigits(normalizedThreeTop, 2);

  if (!normalizedRoundCode || !normalizedThreeTop || !twoTop || !normalizedTwoBottom) {
    return null;
  }

  return {
    lotteryCode: SINGAPORE_VIP_MARKET_ID,
    feedCode: SINGAPORE_VIP_MARKET_ID,
    marketName: SINGAPORE_VIP_MARKET_NAME,
    roundCode: normalizedRoundCode,
    headline: normalizedThreeTop,
    firstPrize: normalizedThreeTop,
    threeTop: normalizedThreeTop,
    threeFront: '',
    twoTop,
    twoBottom: normalizedTwoBottom,
    threeBottom: '',
    threeTopHits: [normalizedThreeTop],
    twoTopHits: [twoTop],
    twoBottomHits: [normalizedTwoBottom],
    threeFrontHits: [],
    threeBottomHits: [],
    runTop: uniqueDigits(normalizedThreeTop),
    runBottom: uniqueDigits(normalizedTwoBottom),
    resultPublishedAt: publishedAt || null,
    isSettlementSafe: true,
    sourceUrl: SINGAPORE_VIP_SITE_URL,
    rawPayload
  };
};

const selectCloseRow = (prices) => {
  if (!Array.isArray(prices)) return null;

  const availableRows = prices.filter((item) => item && item.available === true);
  return (
    availableRows.find((item) => stringValue(item.note).toLowerCase() === 'close')
    || availableRows.find((item) => stringValue(item.time) === SINGAPORE_VIP_CLOSE_TIME)
    || availableRows[availableRows.length - 1]
    || null
  );
};

const buildCurrentSnapshot = (payload) => {
  const roundCode = parseRoundCode(payload?.date);
  const row = selectCloseRow(payload?.prices);

  if (!roundCode || !row) {
    return null;
  }

  return buildSnapshot({
    roundCode,
    threeTop: formatTopFromPrice(row.price),
    twoBottom: formatBottomFromDiff(row.diff),
    publishedAt: buildBangkokDateFromRoundCode(
      roundCode,
      SINGAPORE_VIP_DRAW_HOUR,
      SINGAPORE_VIP_DRAW_MINUTE
    ),
    rawPayload: payload
  });
};

const buildHistorySnapshot = (row) => {
  const roundCode = parseRoundCode(row?.date);
  return buildSnapshot({
    roundCode,
    threeTop: row?.r2?.prize_1st,
    twoBottom: row?.r2?.prize_2nd,
    publishedAt: buildBangkokDateFromRoundCode(
      roundCode,
      SINGAPORE_VIP_DRAW_HOUR,
      SINGAPORE_VIP_DRAW_MINUTE
    ),
    rawPayload: row
  });
};

const fetchCurrentPayload = async () => {
  const response = await http.get(SINGAPORE_VIP_CURRENT_URL);
  return response.data?.data || null;
};

const fetchHistoryRows = async () => {
  const response = await http.get(SINGAPORE_VIP_HISTORY_URL);
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

const fetchSingaporeVipSnapshots = async ({ limit = 10 } = {}) => {
  const [currentPayloadResult, historyRowsResult] = await Promise.allSettled([
    fetchCurrentPayload(),
    fetchHistoryRows()
  ]);

  const currentPayload = currentPayloadResult.status === 'fulfilled' ? currentPayloadResult.value : null;
  const historyRows = historyRowsResult.status === 'fulfilled' ? historyRowsResult.value : [];

  return dedupeSnapshots([
    buildCurrentSnapshot(currentPayload),
    ...historyRows.map(buildHistorySnapshot)
  ], limit);
};

const fetchLatestSingaporeVipSnapshot = async () => {
  const snapshots = await fetchSingaporeVipSnapshots({ limit: 1 });
  return snapshots[0] || null;
};

module.exports = {
  SINGAPORE_VIP_PROVIDER_NAME,
  SINGAPORE_VIP_SITE_URL,
  SINGAPORE_VIP_MARKET_ID,
  SINGAPORE_VIP_MARKET_NAME,
  fetchSingaporeVipSnapshots,
  fetchLatestSingaporeVipSnapshot
};
