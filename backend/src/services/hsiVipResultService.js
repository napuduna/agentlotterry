const axios = require('axios');
const { createBangkokDate } = require('../utils/bangkokTime');

const HSI_VIP_PROVIDER_NAME = 'HSI VIP Official';
const HSI_VIP_SITE_URL = 'https://www.hsi-vip.com/';
const HSI_VIP_CURRENT_URL = 'https://api.hsi-vip.com/api/hk';
const HSI_VIP_HISTORY_URL = 'https://api.hsi-vip.com/api/history/hk';

const HSI_MORNING_VIP_MARKET_ID = 'hangseng_morning_vip';
const HSI_MORNING_VIP_MARKET_NAME = 'ฮั่งเส็งเช้า VIP';
const HSI_AFTERNOON_VIP_MARKET_ID = 'hangseng_afternoon_vip';
const HSI_AFTERNOON_VIP_MARKET_NAME = 'ฮั่งเส็งบ่าย VIP';

const HSI_VIP_TIMEOUT_MS = Number(process.env.HSI_VIP_TIMEOUT_MS || 15000);
const MORNING_DRAW_HOUR = 11;
const MORNING_DRAW_MINUTE = 40;
const AFTERNOON_DRAW_HOUR = 15;
const AFTERNOON_DRAW_MINUTE = 40;

const http = axios.create({
  timeout: HSI_VIP_TIMEOUT_MS,
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
    sourceUrl: HSI_VIP_SITE_URL,
    rawPayload
  };
};

const buildMorningCurrentSnapshot = (payload) => {
  const roundCode = parseRoundCode(payload?.date);
  return buildSnapshot({
    marketId: HSI_MORNING_VIP_MARKET_ID,
    marketName: HSI_MORNING_VIP_MARKET_NAME,
    roundCode,
    threeTop: payload?.results?.r1?.prize_1st,
    twoBottom: payload?.results?.r1?.prize_2nd,
    publishedAt: buildBangkokDateFromRoundCode(roundCode, MORNING_DRAW_HOUR, MORNING_DRAW_MINUTE),
    rawPayload: payload
  });
};

const buildAfternoonCurrentSnapshot = (payload) => {
  const roundCode = parseRoundCode(payload?.date);
  return buildSnapshot({
    marketId: HSI_AFTERNOON_VIP_MARKET_ID,
    marketName: HSI_AFTERNOON_VIP_MARKET_NAME,
    roundCode,
    threeTop: payload?.results?.r2?.prize_1st,
    twoBottom: payload?.results?.r2?.prize_2nd,
    publishedAt: buildBangkokDateFromRoundCode(roundCode, AFTERNOON_DRAW_HOUR, AFTERNOON_DRAW_MINUTE),
    rawPayload: payload
  });
};

const buildMorningHistorySnapshot = (row) => {
  const roundCode = parseRoundCode(row?.date);
  return buildSnapshot({
    marketId: HSI_MORNING_VIP_MARKET_ID,
    marketName: HSI_MORNING_VIP_MARKET_NAME,
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
    marketId: HSI_AFTERNOON_VIP_MARKET_ID,
    marketName: HSI_AFTERNOON_VIP_MARKET_NAME,
    roundCode,
    threeTop: row?.r2?.prize_1st,
    twoBottom: row?.r2?.prize_2nd,
    publishedAt: buildBangkokDateFromRoundCode(roundCode, AFTERNOON_DRAW_HOUR, AFTERNOON_DRAW_MINUTE),
    rawPayload: row
  });
};

const fetchCurrentPayload = async () => {
  const response = await http.get(HSI_VIP_CURRENT_URL);
  return response.data?.data || null;
};

const fetchHistoryRows = async () => {
  const response = await http.get(HSI_VIP_HISTORY_URL);
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

const fetchHsiMorningVipSnapshots = async ({ limit = 10 } = {}) => {
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

const fetchHsiAfternoonVipSnapshots = async ({ limit = 10 } = {}) => {
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

const fetchLatestHsiMorningVipSnapshot = async () => {
  const snapshots = await fetchHsiMorningVipSnapshots({ limit: 1 });
  return snapshots[0] || null;
};

const fetchLatestHsiAfternoonVipSnapshot = async () => {
  const snapshots = await fetchHsiAfternoonVipSnapshots({ limit: 1 });
  return snapshots[0] || null;
};

module.exports = {
  HSI_VIP_PROVIDER_NAME,
  HSI_VIP_SITE_URL,
  HSI_MORNING_VIP_MARKET_ID,
  HSI_MORNING_VIP_MARKET_NAME,
  HSI_AFTERNOON_VIP_MARKET_ID,
  HSI_AFTERNOON_VIP_MARKET_NAME,
  fetchHsiMorningVipSnapshots,
  fetchLatestHsiMorningVipSnapshot,
  fetchHsiAfternoonVipSnapshots,
  fetchLatestHsiAfternoonVipSnapshot
};
