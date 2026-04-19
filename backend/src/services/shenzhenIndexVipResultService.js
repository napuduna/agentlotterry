const axios = require('axios');
const { createBangkokDate } = require('../utils/bangkokTime');

const SHENZHEN_INDEX_PROVIDER_NAME = 'Shenzhen Index Official';
const SHENZHEN_INDEX_SITE_URL = 'https://shenzhenindex.com/';
const SHENZHEN_INDEX_CURRENT_URL = 'https://api.shenzhenindex.com/api/cn';
const SHENZHEN_INDEX_HISTORY_URL = 'https://api.shenzhenindex.com/api/history/cn';

const CHINA_MORNING_VIP_MARKET_ID = 'china_morning_vip';
const CHINA_MORNING_VIP_MARKET_NAME = 'จีนเช้า VIP';
const CHINA_AFTERNOON_VIP_MARKET_ID = 'china_afternoon_vip';
const CHINA_AFTERNOON_VIP_MARKET_NAME = 'จีนบ่าย VIP';

const SHENZHEN_INDEX_TIMEOUT_MS = Number(process.env.SHENZHEN_INDEX_TIMEOUT_MS || 15000);
const MORNING_DRAW_HOUR = 11;
const MORNING_DRAW_MINUTE = 5;
const AFTERNOON_DRAW_HOUR = 15;
const AFTERNOON_DRAW_MINUTE = 25;

const http = axios.create({
  timeout: SHENZHEN_INDEX_TIMEOUT_MS,
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
  const lastIntegerDigit = integerPart.slice(-1);
  return `${lastIntegerDigit}${decimalPart}`.replace(/\D/g, '');
};

const formatBottomFromDiff = (diff) => {
  const parsed = Number(diff);
  if (!Number.isFinite(parsed)) return '';
  const [, decimalPart = '00'] = Math.abs(parsed).toFixed(2).split('.');
  return decimalPart.replace(/\D/g, '');
};

const buildSnapshot = ({
  marketId,
  marketName,
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
    lotteryCode: marketId,
    feedCode: marketId,
    marketName,
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
    sourceUrl: SHENZHEN_INDEX_SITE_URL,
    rawPayload
  };
};

const buildMorningCurrentSnapshot = (payload) => {
  const roundCode = parseRoundCode(payload?.date);
  const row = Array.isArray(payload?.prices)
    ? payload.prices.find((item) => stringValue(item?.time) === '11:05' && item?.available === true)
    : null;

  if (!row) return null;

  return buildSnapshot({
    marketId: CHINA_MORNING_VIP_MARKET_ID,
    marketName: CHINA_MORNING_VIP_MARKET_NAME,
    roundCode,
    threeTop: formatTopFromPrice(row.price),
    twoBottom: formatBottomFromDiff(row.diff),
    publishedAt: buildBangkokDateFromRoundCode(roundCode, MORNING_DRAW_HOUR, MORNING_DRAW_MINUTE),
    rawPayload: payload
  });
};

const buildAfternoonCurrentSnapshot = (payload) => {
  const roundCode = parseRoundCode(payload?.date);
  const row = Array.isArray(payload?.prices)
    ? payload.prices.find((item) => stringValue(item?.time) === '15:25' && item?.available === true)
    : null;

  if (!row) return null;

  return buildSnapshot({
    marketId: CHINA_AFTERNOON_VIP_MARKET_ID,
    marketName: CHINA_AFTERNOON_VIP_MARKET_NAME,
    roundCode,
    threeTop: formatTopFromPrice(row.price),
    twoBottom: formatBottomFromDiff(row.diff),
    publishedAt: buildBangkokDateFromRoundCode(roundCode, AFTERNOON_DRAW_HOUR, AFTERNOON_DRAW_MINUTE),
    rawPayload: payload
  });
};

const buildMorningHistorySnapshot = (row) => {
  const roundCode = parseRoundCode(row?.date);
  return buildSnapshot({
    marketId: CHINA_MORNING_VIP_MARKET_ID,
    marketName: CHINA_MORNING_VIP_MARKET_NAME,
    roundCode,
    threeTop: row?.r1?.prize_1st,
    twoBottom: row?.r1?.prize_2nd,
    publishedAt: buildBangkokDateFromRoundCode(roundCode, MORNING_DRAW_HOUR, MORNING_DRAW_MINUTE),
    rawPayload: row
  });
};

const buildAfternoonHistorySnapshot = (row) => {
  const roundCode = parseRoundCode(row?.date);
  return buildSnapshot({
    marketId: CHINA_AFTERNOON_VIP_MARKET_ID,
    marketName: CHINA_AFTERNOON_VIP_MARKET_NAME,
    roundCode,
    threeTop: row?.r2?.prize_1st,
    twoBottom: row?.r2?.prize_2nd,
    publishedAt: buildBangkokDateFromRoundCode(roundCode, AFTERNOON_DRAW_HOUR, AFTERNOON_DRAW_MINUTE),
    rawPayload: row
  });
};

const fetchCurrentPayload = async () => {
  const response = await http.get(SHENZHEN_INDEX_CURRENT_URL);
  return response.data?.data || null;
};

const fetchHistoryRows = async () => {
  const response = await http.get(SHENZHEN_INDEX_HISTORY_URL);
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

const fetchShenzhenMorningVipSnapshots = async ({ limit = 10 } = {}) => {
  const [currentPayloadResult, historyRowsResult] = await Promise.allSettled([
    fetchCurrentPayload(),
    fetchHistoryRows()
  ]);

  const currentPayload = currentPayloadResult.status === 'fulfilled' ? currentPayloadResult.value : null;
  const historyRows = historyRowsResult.status === 'fulfilled' ? historyRowsResult.value : [];

  return dedupeSnapshots([
    buildMorningCurrentSnapshot(currentPayload),
    ...historyRows.map(buildMorningHistorySnapshot)
  ], limit);
};

const fetchShenzhenAfternoonVipSnapshots = async ({ limit = 10 } = {}) => {
  const [currentPayloadResult, historyRowsResult] = await Promise.allSettled([
    fetchCurrentPayload(),
    fetchHistoryRows()
  ]);

  const currentPayload = currentPayloadResult.status === 'fulfilled' ? currentPayloadResult.value : null;
  const historyRows = historyRowsResult.status === 'fulfilled' ? historyRowsResult.value : [];

  return dedupeSnapshots([
    buildAfternoonCurrentSnapshot(currentPayload),
    ...historyRows.map(buildAfternoonHistorySnapshot)
  ], limit);
};

const fetchLatestShenzhenMorningVipSnapshot = async () => {
  const snapshots = await fetchShenzhenMorningVipSnapshots({ limit: 1 });
  return snapshots[0] || null;
};

const fetchLatestShenzhenAfternoonVipSnapshot = async () => {
  const snapshots = await fetchShenzhenAfternoonVipSnapshots({ limit: 1 });
  return snapshots[0] || null;
};

module.exports = {
  SHENZHEN_INDEX_PROVIDER_NAME,
  SHENZHEN_INDEX_SITE_URL,
  CHINA_MORNING_VIP_MARKET_ID,
  CHINA_MORNING_VIP_MARKET_NAME,
  CHINA_AFTERNOON_VIP_MARKET_ID,
  CHINA_AFTERNOON_VIP_MARKET_NAME,
  fetchShenzhenMorningVipSnapshots,
  fetchLatestShenzhenMorningVipSnapshot,
  fetchShenzhenAfternoonVipSnapshots,
  fetchLatestShenzhenAfternoonVipSnapshot
};
