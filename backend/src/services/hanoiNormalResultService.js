const axios = require('axios');
const { createBangkokDate, getBangkokParts } = require('../utils/bangkokTime');

const HANOI_NORMAL_PROVIDER_NAME = 'XSMB Official';
const HANOI_NORMAL_MARKET_ID = 'ynhn';
const HANOI_NORMAL_MARKET_NAME = '\u0e2e\u0e32\u0e19\u0e2d\u0e22\u0e18\u0e23\u0e23\u0e21\u0e14\u0e32';
const HANOI_NORMAL_SITE_URL = 'https://xosodaiphat.com/';
const HANOI_NORMAL_TIMEOUT_MS = Number(process.env.HANOI_NORMAL_TIMEOUT_MS || 15000);
const HANOI_NORMAL_DRAW_HOUR = 19;
const HANOI_NORMAL_DRAW_MINUTE = 30;

const http = axios.create({
  timeout: HANOI_NORMAL_TIMEOUT_MS,
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
const tailDigits = (value, length) => compactDigits(value).slice(-length);

const formatDatePath = ({ year, month, day }) =>
  `${String(day).padStart(2, '0')}-${String(month).padStart(2, '0')}-${year}`;

const formatRoundCode = ({ year, month, day }) =>
  `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

const getBangkokDateFromOffset = (offsetDays = 0, date = new Date()) => {
  const parts = getBangkokParts(date);
  const bangkokMidnight = createBangkokDate(parts.year, parts.month, parts.day, 0, 0, 0);
  return getBangkokParts(new Date(bangkokMidnight.getTime() - offsetDays * 24 * 60 * 60 * 1000));
};

const buildPublishedAt = (roundCode) => {
  const match = String(roundCode || '').match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return null;

  return createBangkokDate(
    Number(match[1]),
    Number(match[2]),
    Number(match[3]),
    HANOI_NORMAL_DRAW_HOUR,
    HANOI_NORMAL_DRAW_MINUTE,
    0
  );
};

const extractFirstMatch = (html, pattern) => {
  const match = stringValue(html).match(pattern);
  return match ? compactDigits(match[1]) : '';
};

const extractSnapshotFromHtml = ({ html, roundCode, sourceUrl }) => {
  const specialPrize = extractFirstMatch(html, /special-prize-lg[^>]*>(\d+)<\/span>/i);
  const firstPrize = extractFirstMatch(html, /G\.[\s\S]{0,5}1[\s\S]{0,250}?number-black-bold[^>]*>(\d+)<\/span>/i);
  const threeTop = tailDigits(specialPrize, 3);
  const twoTop = tailDigits(specialPrize, 2);
  const twoBottom = tailDigits(firstPrize, 2);

  if (!roundCode || !specialPrize || !firstPrize || !threeTop || !twoTop || !twoBottom) {
    return null;
  }

  return {
    lotteryCode: HANOI_NORMAL_MARKET_ID,
    feedCode: HANOI_NORMAL_MARKET_ID,
    marketName: HANOI_NORMAL_MARKET_NAME,
    roundCode,
    headline: threeTop,
    firstPrize: specialPrize,
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
    resultPublishedAt: buildPublishedAt(roundCode),
    isSettlementSafe: true,
    sourceUrl,
    rawPayload: {
      roundCode,
      specialPrize,
      firstPrize
    }
  };
};

const fetchSnapshotByOffset = async (offsetDays) => {
  const dateParts = getBangkokDateFromOffset(offsetDays);
  const datePath = formatDatePath(dateParts);
  const roundCode = formatRoundCode(dateParts);
  const sourceUrl = `${HANOI_NORMAL_SITE_URL}xsmb-${datePath}.html`;
  const response = await http.get(sourceUrl);

  return extractSnapshotFromHtml({
    html: response.data,
    roundCode,
    sourceUrl
  });
};

const fetchHanoiNormalSnapshots = async ({ limit = 10 } = {}) => {
  const normalizedLimit = Math.max(1, Number(limit) || 1);
  const snapshots = [];

  for (let offset = 0; snapshots.length < normalizedLimit && offset < normalizedLimit + 14; offset += 1) {
    try {
      const snapshot = await fetchSnapshotByOffset(offset);
      if (snapshot) {
        snapshots.push(snapshot);
      }
    } catch (_) {
      // Missing future/current pages are expected before the official result is published.
    }
  }

  return snapshots
    .sort((left, right) => right.roundCode.localeCompare(left.roundCode))
    .slice(0, normalizedLimit);
};

const fetchLatestHanoiNormalSnapshot = async () => {
  const snapshots = await fetchHanoiNormalSnapshots({ limit: 1 });
  return snapshots[0] || null;
};

module.exports = {
  HANOI_NORMAL_PROVIDER_NAME,
  HANOI_NORMAL_MARKET_ID,
  HANOI_NORMAL_MARKET_NAME,
  HANOI_NORMAL_SITE_URL,
  extractSnapshotFromHtml,
  fetchHanoiNormalSnapshots,
  fetchLatestHanoiNormalSnapshot
};
