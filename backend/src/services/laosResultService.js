const axios = require('axios');
const { createBangkokDate } = require('../utils/bangkokTime');

const LAOS_PROVIDER_NAME = 'Huay Lao Official';
const LAOS_MARKET_ID = 'tlzc';
const LAOS_MARKET_NAME = 'หวยลาว';
const LAOS_SITE_URL = 'https://huaylao.la/';
const LAOS_TIMEOUT_MS = Number(process.env.LAOS_TIMEOUT_MS || 15000);
const LAOS_DRAW_TIME = '20:30';

const RESULT_CARD_PATTERN = /<article\s+class=\"panel result-card premium-result-card\"[\s\S]*?<div class=\"result-meta-line\">[\s\S]*?<span>([^<]+)<\/span>[\s\S]*?<div class=\"result-strip result-strip--small lzh-strip\">([\s\S]*?)<\/div>[\s\S]*?<\/article>/g;

const THAI_MONTHS = {
  มกราคม: 1,
  กุมภาพันธ์: 2,
  มีนาคม: 3,
  เมษายน: 4,
  พฤษภาคม: 5,
  มิถุนายน: 6,
  กรกฎาคม: 7,
  สิงหาคม: 8,
  กันยายน: 9,
  ตุลาคม: 10,
  พฤศจิกายน: 11,
  ธันวาคม: 12
};

const http = axios.create({
  timeout: LAOS_TIMEOUT_MS,
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

const prefixDigits = (value, length) => {
  const digits = compactDigits(value);
  if (!digits) return '';
  return digits.slice(0, length);
};

const parseThaiDateToRoundCode = (value) => {
  const normalized = stringValue(value).replace(/\s+/g, ' ');
  const match = normalized.match(/^(\d{1,2})\s+([^\s]+)\s+(\d{4})$/);
  if (!match) return '';

  const day = Number(match[1]);
  const month = THAI_MONTHS[match[2]];
  const buddhistYear = Number(match[3]);
  if (!day || !month || !buddhistYear) {
    return '';
  }

  const year = buddhistYear - 543;
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
};

const buildPublishedAt = (roundCode, drawTime = LAOS_DRAW_TIME) => {
  const dateMatch = String(roundCode || '').match(/^(\d{4})-(\d{2})-(\d{2})$/);
  const timeMatch = String(drawTime || '').match(/^(\d{2}):(\d{2})$/);
  if (!dateMatch || !timeMatch) return null;

  return createBangkokDate(
    Number(dateMatch[1]),
    Number(dateMatch[2]),
    Number(dateMatch[3]),
    Number(timeMatch[1]),
    Number(timeMatch[2]),
    0
  );
};

const buildSnapshot = ({ roundCode, firstPrize, sourceUrl }) => {
  const normalizedRoundCode = stringValue(roundCode);
  const firstPrizeDigits = compactDigits(firstPrize);
  const threeTop = firstPrizeDigits.slice(-3);
  const twoTop = firstPrizeDigits.slice(-2);
  const twoBottom = prefixDigits(firstPrizeDigits, 2);

  if (!normalizedRoundCode || firstPrizeDigits.length !== 4 || !threeTop || !twoTop || !twoBottom) {
    return null;
  }

  return {
    lotteryCode: LAOS_MARKET_ID,
    feedCode: LAOS_MARKET_ID,
    marketName: LAOS_MARKET_NAME,
    roundCode: normalizedRoundCode,
    headline: threeTop,
    firstPrize: firstPrizeDigits,
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
    resultPublishedAt: buildPublishedAt(normalizedRoundCode),
    isSettlementSafe: true,
    sourceUrl,
    rawPayload: {
      roundCode: normalizedRoundCode,
      firstPrize: firstPrizeDigits
    }
  };
};

const extractSnapshotsFromHtml = (html, sourceUrl) => {
  const snapshots = [];
  const byRoundCode = new Map();
  let match;
  RESULT_CARD_PATTERN.lastIndex = 0;

  while ((match = RESULT_CARD_PATTERN.exec(html))) {
    const roundCode = parseThaiDateToRoundCode(match[1]);
    const firstPrize = [...match[2].matchAll(/>(\d)</g)].map((entry) => entry[1]).join('');
    const snapshot = buildSnapshot({ roundCode, firstPrize, sourceUrl });

    if (snapshot && !byRoundCode.has(snapshot.roundCode)) {
      byRoundCode.set(snapshot.roundCode, snapshot);
      snapshots.push(snapshot);
    }
  }

  return snapshots;
};

const fetchLaosSnapshots = async ({ limit = 10 } = {}) => {
  const normalizedLimit = Math.max(1, Number(limit) || 1);
  const response = await http.get(LAOS_SITE_URL);

  return extractSnapshotsFromHtml(stringValue(response.data), LAOS_SITE_URL)
    .sort((left, right) => right.roundCode.localeCompare(left.roundCode))
    .slice(0, normalizedLimit);
};

const fetchLatestLaosSnapshot = async () => {
  const snapshots = await fetchLaosSnapshots({ limit: 20 });
  return snapshots[0] || null;
};

module.exports = {
  LAOS_PROVIDER_NAME,
  LAOS_MARKET_ID,
  LAOS_MARKET_NAME,
  LAOS_SITE_URL,
  fetchLaosSnapshots,
  fetchLatestLaosSnapshot
};
