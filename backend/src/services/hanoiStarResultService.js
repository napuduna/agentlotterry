const axios = require('axios');
const { createBangkokDate } = require('../utils/bangkokTime');

const HANOI_STAR_PROVIDER_NAME = 'Exphuay Minh Ngoc Star';
const HANOI_STAR_MARKET_ID = 'hanoi_star';
const HANOI_STAR_MARKET_NAME = 'ฮานอยสตาร์';
const HANOI_STAR_SITE_URL = 'https://exphuay.com/result/minhngocstar';
const HANOI_STAR_HISTORY_URL = 'https://exphuay.com/backward/minhngocstar';
const HANOI_STAR_TIMEOUT_MS = Number(process.env.HANOI_STAR_TIMEOUT_MS || 15000);

const RESULT_ENTRY_PATTERN = /lottosName:"minhngocstar"[\s\S]{0,500}?lottosDate:"([^"]+)"[\s\S]{0,300}?lottosTime:"([^"]+)"[\s\S]{0,300}?lottosNumber:"([^"]+)"[\s\S]{0,200}?lottosUnder:"([^"]+)"/g;

const http = axios.create({
  timeout: HANOI_STAR_TIMEOUT_MS,
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
const uniqueDigits = (value) => [...new Set(compactDigits(value).split('').filter(Boolean))];

const tailDigits = (value, length) => {
  const digits = compactDigits(value);
  if (!digits) return '';
  return digits.slice(-length);
};

const parseRoundCode = (value) => {
  const normalized = stringValue(value);
  const match = normalized.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!match) return '';
  return `${match[1]}-${match[2]}-${match[3]}`;
};

const parsePublishedAt = (roundCode, drawTime) => {
  const dateMatch = stringValue(roundCode).match(/^(\d{4})-(\d{2})-(\d{2})$/);
  const timeMatch = stringValue(drawTime).match(/^(\d{2}):(\d{2})$/);
  if (!dateMatch || !timeMatch) {
    return null;
  }

  return createBangkokDate(
    Number(dateMatch[1]),
    Number(dateMatch[2]),
    Number(dateMatch[3]),
    Number(timeMatch[1]),
    Number(timeMatch[2]),
    0
  );
};

const buildSnapshot = ({ roundCode, drawTime, firstPrize, twoBottom, sourceUrl }) => {
  const normalizedRoundCode = parseRoundCode(roundCode);
  const firstPrizeDigits = compactDigits(firstPrize);
  const twoBottomDigits = compactDigits(twoBottom);
  const threeTop = tailDigits(firstPrizeDigits, 3);
  const twoTop = tailDigits(firstPrizeDigits, 2);

  if (!normalizedRoundCode || !firstPrizeDigits || !threeTop || !twoTop || !twoBottomDigits) {
    return null;
  }

  return {
    lotteryCode: HANOI_STAR_MARKET_ID,
    feedCode: HANOI_STAR_MARKET_ID,
    marketName: HANOI_STAR_MARKET_NAME,
    roundCode: normalizedRoundCode,
    headline: threeTop,
    firstPrize: firstPrizeDigits,
    threeTop,
    threeFront: '',
    twoTop,
    twoBottom: twoBottomDigits,
    threeBottom: '',
    threeTopHits: [threeTop],
    twoTopHits: [twoTop],
    twoBottomHits: [twoBottomDigits],
    threeFrontHits: [],
    threeBottomHits: [],
    runTop: uniqueDigits(threeTop),
    runBottom: uniqueDigits(twoBottomDigits),
    resultPublishedAt: parsePublishedAt(normalizedRoundCode, drawTime),
    isSettlementSafe: true,
    sourceUrl,
    rawPayload: {
      lottosDate: roundCode,
      lottosTime: drawTime,
      lottosNumber: firstPrizeDigits,
      lottosUnder: twoBottomDigits
    }
  };
};

const extractSnapshotsFromHtml = (html, sourceUrl, limit = 10) => {
  const snapshots = [];
  const byRoundCode = new Map();
  let match;
  RESULT_ENTRY_PATTERN.lastIndex = 0;

  while ((match = RESULT_ENTRY_PATTERN.exec(html)) && snapshots.length < limit) {
    const snapshot = buildSnapshot({
      roundCode: match[1],
      drawTime: match[2],
      firstPrize: match[3],
      twoBottom: match[4],
      sourceUrl
    });

    if (snapshot && !byRoundCode.has(snapshot.roundCode)) {
      byRoundCode.set(snapshot.roundCode, snapshot);
      snapshots.push(snapshot);
    }
  }

  return snapshots;
};

const fetchSnapshotsFromUrl = async (url, limit) => {
  const response = await http.get(url);
  return extractSnapshotsFromHtml(stringValue(response.data), url, limit);
};

const fetchHanoiStarSnapshots = async ({ limit = 10 } = {}) => {
  const normalizedLimit = Math.max(1, Number(limit) || 1);
  const primarySnapshots = await fetchSnapshotsFromUrl(HANOI_STAR_SITE_URL, normalizedLimit);

  if (primarySnapshots.length >= normalizedLimit) {
    return primarySnapshots
      .sort((left, right) => right.roundCode.localeCompare(left.roundCode))
      .slice(0, normalizedLimit);
  }

  const fallbackSnapshots = await fetchSnapshotsFromUrl(HANOI_STAR_HISTORY_URL, normalizedLimit);
  const byRoundCode = new Map();

  [...primarySnapshots, ...fallbackSnapshots].forEach((snapshot) => {
    if (snapshot && !byRoundCode.has(snapshot.roundCode)) {
      byRoundCode.set(snapshot.roundCode, snapshot);
    }
  });

  return [...byRoundCode.values()]
    .sort((left, right) => right.roundCode.localeCompare(left.roundCode))
    .slice(0, normalizedLimit);
};

const fetchLatestHanoiStarSnapshot = async () => {
  const snapshots = await fetchHanoiStarSnapshots({ limit: 1 });
  return snapshots[0] || null;
};

module.exports = {
  HANOI_STAR_PROVIDER_NAME,
  HANOI_STAR_MARKET_ID,
  HANOI_STAR_MARKET_NAME,
  HANOI_STAR_SITE_URL,
  fetchHanoiStarSnapshots,
  fetchLatestHanoiStarSnapshot
};
