const axios = require('axios');
const { createBangkokDate } = require('../utils/bangkokTime');

const DOWJONES_VIP_PROVIDER_NAME = 'Dow Jones Powerball Official';
const DOWJONES_VIP_SITE_URL = 'https://dowjonespowerball.com/';
const DOWJONES_VIP_RESULT_URL = 'https://api.dowjonespowerball.com/result';
const DOWJONES_VIP_TIMEOUT_MS = Number(process.env.DOWJONES_VIP_TIMEOUT_MS || 15000);

const DOWJONES_VIP_MARKET_ID = 'dowjones_vip';
const DOWJONES_VIP_MARKET_NAME = 'ดาวโจนส์ VIP';
const DOWJONES_VIP_FEED_CODE = 'gsus';

const http = axios.create({
  timeout: DOWJONES_VIP_TIMEOUT_MS,
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

const fetchCurrentPayload = async () => {
  const response = await http.get(DOWJONES_VIP_RESULT_URL);
  return response.data || null;
};

const fetchPayloadByDraw = async (draw) => {
  const roundCode = parseRoundCode(draw);
  if (!roundCode) {
    return null;
  }

  const response = await http.get(DOWJONES_VIP_RESULT_URL, {
    params: { draw: roundCode }
  });
  return response.data || null;
};

const buildSnapshot = (payload) => {
  const data = payload?.data || null;
  const roundCode = parseRoundCode(data?.lotto_date);
  const firstPrize = compactDigits(data?.results?.prize_1st);
  const secondPrize = compactDigits(data?.results?.prize_2nd);
  const threeTop = tailDigits(firstPrize, 3);
  const twoTop = tailDigits(firstPrize, 2);
  const twoBottom = tailDigits(secondPrize, 2);

  if (!roundCode || !firstPrize || !secondPrize || !threeTop || !twoTop || !twoBottom) {
    return null;
  }

  return {
    lotteryCode: DOWJONES_VIP_MARKET_ID,
    feedCode: DOWJONES_VIP_FEED_CODE,
    marketName: DOWJONES_VIP_MARKET_NAME,
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
    resultPublishedAt: parseBangkokDateTime(data?.show_1st) || null,
    isSettlementSafe: true,
    sourceUrl: DOWJONES_VIP_SITE_URL,
    rawPayload: payload
  };
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

const fetchDowjonesVipSnapshots = async ({ limit = 10 } = {}) => {
  const snapshots = [];
  const seenRounds = new Set();
  let payload = await fetchCurrentPayload();

  while (payload && snapshots.length < Math.max(1, Number(limit) || 1)) {
    const snapshot = buildSnapshot(payload);
    if (!snapshot || seenRounds.has(snapshot.roundCode)) {
      break;
    }

    snapshots.push(snapshot);
    seenRounds.add(snapshot.roundCode);

    const prevRoundCode = parseRoundCode(payload?.data?.prev || payload?.prev);
    if (!prevRoundCode || seenRounds.has(prevRoundCode)) {
      break;
    }

    payload = await fetchPayloadByDraw(prevRoundCode);
  }

  return dedupeSnapshots(snapshots, limit);
};

const fetchLatestDowjonesVipSnapshot = async () => {
  const snapshots = await fetchDowjonesVipSnapshots({ limit: 1 });
  return snapshots[0] || null;
};

module.exports = {
  DOWJONES_VIP_PROVIDER_NAME,
  DOWJONES_VIP_SITE_URL,
  DOWJONES_VIP_MARKET_ID,
  DOWJONES_VIP_MARKET_NAME,
  fetchDowjonesVipSnapshots,
  fetchLatestDowjonesVipSnapshot
};
