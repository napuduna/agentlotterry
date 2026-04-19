const axios = require('axios');
const { createBangkokDate } = require('../utils/bangkokTime');

const KOREA_VIP_PROVIDER_NAME = 'KTop VIP Index Official';
const KOREA_VIP_SITE_URL = 'https://ktopvipindex.com/';
const KOREA_VIP_CURRENT_URL = 'https://api.ktopvipindex.com/api/kr';
const KOREA_VIP_HISTORY_URL = 'https://api.ktopvipindex.com/api/history/kr';
const KOREA_VIP_TIMEOUT_MS = Number(process.env.KOREA_VIP_TIMEOUT_MS || 15000);

const KOREA_VIP_MARKET_ID = 'korea_vip';
const KOREA_VIP_MARKET_NAME = 'เกาหลี VIP';
const KOREA_VIP_DRAW_HOUR = 14;
const KOREA_VIP_DRAW_MINUTE = 35;

const http = axios.create({
  timeout: KOREA_VIP_TIMEOUT_MS,
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
    lotteryCode: KOREA_VIP_MARKET_ID,
    feedCode: KOREA_VIP_MARKET_ID,
    marketName: KOREA_VIP_MARKET_NAME,
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
    sourceUrl: KOREA_VIP_SITE_URL,
    rawPayload
  };
};

const buildCurrentSnapshot = (payload) => {
  const roundCode = parseRoundCode(payload?.date);
  return buildSnapshot({
    roundCode,
    threeTop: payload?.results?.r2?.prize_1st,
    twoBottom: payload?.results?.r2?.prize_2nd,
    publishedAt: buildBangkokDateFromRoundCode(roundCode, KOREA_VIP_DRAW_HOUR, KOREA_VIP_DRAW_MINUTE),
    rawPayload: payload
  });
};

const buildHistorySnapshot = (row) => {
  const roundCode = parseRoundCode(row?.date);
  return buildSnapshot({
    roundCode,
    threeTop: row?.r2?.prize_1st,
    twoBottom: row?.r2?.prize_2nd,
    publishedAt: buildBangkokDateFromRoundCode(roundCode, KOREA_VIP_DRAW_HOUR, KOREA_VIP_DRAW_MINUTE),
    rawPayload: row
  });
};

const fetchCurrentPayload = async () => {
  const response = await http.get(KOREA_VIP_CURRENT_URL);
  return response.data?.data || null;
};

const fetchHistoryRows = async () => {
  const response = await http.get(KOREA_VIP_HISTORY_URL);
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

const fetchKoreaVipSnapshots = async ({ limit = 10 } = {}) => {
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

const fetchLatestKoreaVipSnapshot = async () => {
  const snapshots = await fetchKoreaVipSnapshots({ limit: 1 });
  return snapshots[0] || null;
};

module.exports = {
  KOREA_VIP_PROVIDER_NAME,
  KOREA_VIP_SITE_URL,
  KOREA_VIP_MARKET_ID,
  KOREA_VIP_MARKET_NAME,
  fetchKoreaVipSnapshots,
  fetchLatestKoreaVipSnapshot
};
