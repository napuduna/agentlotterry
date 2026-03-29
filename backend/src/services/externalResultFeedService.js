const axios = require('axios');
const LotteryResult = require('../models/LotteryResult');
const LotteryType = require('../models/LotteryType');
const MarketFeedResult = require('../models/MarketFeedResult');
const { createBangkokDate } = require('../utils/bangkokTime');
const { ensureRoundForLottery, settleRoundById, upsertRoundResult } = require('./resultService');

const legacyBaseUrl = (process.env.MANYCAI_BASE_URL || 'http://vip.manycai.com').replace(/\/$/, '');
const legacyApiKey = String(process.env.MANYCAI_API_KEY || '').trim();
const MANYCAI_FEED_BASE_URL = (
  process.env.MANYCAI_FEED_BASE_URL ||
  (legacyApiKey ? `${legacyBaseUrl}/${legacyApiKey}` : 'http://vip.manycai.com/K269c291856f58e')
).replace(/\/$/, '');
const RESULT_SYNC_TIMEOUT_MS = Number(process.env.RESULT_SYNC_TIMEOUT_MS || 12000);

const FEED_CONFIGS = [
  { feedCode: 'tgfc', lotteryCode: 'thai_government', marketName: 'รัฐบาลไทย', parser: 'government', syncToResults: true },
  { feedCode: 'baac', lotteryCode: 'baac', marketName: 'ธกส', parser: 'baac', syncToResults: false },
  { feedCode: 'bfhn', lotteryCode: 'hanoi_special', marketName: 'ฮานอยพิเศษ', parser: 'simple5', syncToResults: true },
  { feedCode: 'zcvip', lotteryCode: 'lao_vip', marketName: 'ลาว VIP', parser: 'simple5', syncToResults: true },
  { feedCode: 'gsus', lotteryCode: 'dowjones_vip', marketName: 'ดาวโจนส์ VIP', parser: 'stock', syncToResults: true },
  { feedCode: 'gsjpa', lotteryCode: 'nikkei_morning', marketName: 'นิเคอิเช้า', parser: 'stock', syncToResults: true },
  { feedCode: 'gscnp', lotteryCode: 'china_afternoon', marketName: 'จีนบ่าย', parser: 'stock', syncToResults: true }
];

const syncState = {
  running: false,
  lastStartedAt: null,
  lastCompletedAt: null,
  lastError: null,
  lastSummary: null
};

let autoSyncTimer = null;

const flattenValues = (value) => Array.isArray(value) ? value.flatMap(flattenValues) : [value];
const joinDigits = (value) => String(value || '').replace(/\D/g, '');
const uniqueDigits = (value) => [...new Set(flattenValues(value).map(joinDigits).filter(Boolean))];
const parseIssueToRoundCode = (value) => {
  const digits = joinDigits(value);
  if (digits.length !== 8) return '';
  return `${digits.slice(0, 4)}-${digits.slice(4, 6)}-${digits.slice(6, 8)}`;
};

const parseBangkokDateTime = (value) => {
  const match = String(value || '').match(/^(\d{4})-(\d{2})-(\d{2})\s+(\d{2}):(\d{2})(?::(\d{2}))?$/);
  if (!match) return null;

  return createBangkokDate(
    Number(match[1]),
    Number(match[2]),
    Number(match[3]),
    Number(match[4]),
    Number(match[5]),
    Number(match[6] || 0)
  );
};

const toHeadline = (...candidates) => {
  for (const candidate of candidates) {
    const value = joinDigits(candidate);
    if (value) return value;
  }
  return '';
};

const buildRunDigits = (values) => [...new Set(values.join('').split('').filter(Boolean))];

const buildGovernmentSnapshot = (config, row) => {
  const firstPrize = joinDigits(row?.code?.code);
  const frontThreeHits = uniqueDigits(row?.code?.code1);
  const backThreeHits = uniqueDigits(row?.code?.code2);
  const twoBottom = joinDigits(row?.code?.code3);
  const threeTop = firstPrize ? firstPrize.slice(-3) : '';
  const twoTop = firstPrize ? firstPrize.slice(-2) : '';

  return {
    lotteryCode: config.lotteryCode,
    feedCode: config.feedCode,
    marketName: config.marketName,
    roundCode: parseIssueToRoundCode(row?.officialissue || row?.issue),
    headline: toHeadline(firstPrize, twoBottom),
    firstPrize,
    threeTop,
    twoTop,
    twoBottom,
    threeBottom: backThreeHits[0] || '',
    threeTopHits: threeTop ? [threeTop] : [],
    twoTopHits: twoTop ? [twoTop] : [],
    twoBottomHits: twoBottom ? [twoBottom] : [],
    threeBottomHits: backThreeHits,
    runTop: buildRunDigits(threeTop ? [threeTop] : []),
    runBottom: buildRunDigits(twoBottom ? [twoBottom] : []),
    resultPublishedAt: parseBangkokDateTime(row?.opendate),
    isSettlementSafe: true,
    sourceUrl: `${MANYCAI_FEED_BASE_URL}/${config.feedCode}.json`,
    rawPayload: row,
    legacyGovernmentPayload: {
      roundDate: parseIssueToRoundCode(row?.officialissue || row?.issue),
      firstPrize,
      threeTopList: frontThreeHits,
      threeBotList: backThreeHits,
      twoBottom,
      runTop: buildRunDigits(threeTop ? [threeTop] : []),
      runBottom: buildRunDigits(twoBottom ? [twoBottom] : []),
      fetchedAt: new Date()
    }
  };
};

const buildSimple5Snapshot = (config, row) => {
  const firstPrize = joinDigits(row?.code?.code);
  const threeTop = joinDigits(row?.code?.code_last3) || (firstPrize ? firstPrize.slice(-3) : '');
  const twoTail = joinDigits(row?.code?.code_last2) || (firstPrize ? firstPrize.slice(-2) : '');

  return {
    lotteryCode: config.lotteryCode,
    feedCode: config.feedCode,
    marketName: config.marketName,
    roundCode: parseIssueToRoundCode(row?.officialissue || row?.issue),
    headline: toHeadline(firstPrize, threeTop, twoTail),
    firstPrize,
    threeTop,
    twoTop: twoTail,
    twoBottom: twoTail,
    threeBottom: '',
    threeTopHits: threeTop ? [threeTop] : [],
    twoTopHits: twoTail ? [twoTail] : [],
    twoBottomHits: twoTail ? [twoTail] : [],
    threeBottomHits: [],
    runTop: buildRunDigits(threeTop ? [threeTop] : []),
    runBottom: buildRunDigits(twoTail ? [twoTail] : []),
    resultPublishedAt: parseBangkokDateTime(row?.opendate),
    isSettlementSafe: true,
    sourceUrl: `${MANYCAI_FEED_BASE_URL}/${config.feedCode}.json`,
    rawPayload: row
  };
};

const buildStockSnapshot = (config, row) => {
  const threeDigits = joinDigits(row?.code?.code);
  const twoDigits = joinDigits(row?.code?.code1);

  return {
    lotteryCode: config.lotteryCode,
    feedCode: config.feedCode,
    marketName: config.marketName,
    roundCode: parseIssueToRoundCode(row?.officialissue || row?.issue),
    headline: toHeadline(threeDigits, twoDigits),
    firstPrize: threeDigits,
    threeTop: threeDigits,
    twoTop: twoDigits,
    twoBottom: twoDigits,
    threeBottom: '',
    threeTopHits: threeDigits ? [threeDigits] : [],
    twoTopHits: twoDigits ? [twoDigits] : [],
    twoBottomHits: twoDigits ? [twoDigits] : [],
    threeBottomHits: [],
    runTop: buildRunDigits(threeDigits ? [threeDigits] : []),
    runBottom: buildRunDigits(twoDigits ? [twoDigits] : []),
    resultPublishedAt: parseBangkokDateTime(row?.opendate),
    isSettlementSafe: true,
    sourceUrl: `${MANYCAI_FEED_BASE_URL}/${config.feedCode}.json`,
    rawPayload: row
  };
};

const buildBaacSnapshot = (config, row) => {
  const firstPrize = joinDigits(row?.code?.code);
  const threeTopHits = [
    ...uniqueDigits(row?.code?.code_last3),
    ...uniqueDigits(row?.code?.code_last3_1)
  ];
  const threeTop = threeTopHits[0] || (firstPrize ? firstPrize.slice(-3) : '');
  const twoTail = firstPrize ? firstPrize.slice(-2) : '';

  return {
    lotteryCode: config.lotteryCode,
    feedCode: config.feedCode,
    marketName: config.marketName,
    roundCode: parseIssueToRoundCode(row?.officialissue || row?.issue),
    headline: toHeadline(firstPrize, threeTop),
    firstPrize,
    threeTop,
    twoTop: twoTail,
    twoBottom: twoTail,
    threeBottom: '',
    threeTopHits,
    twoTopHits: twoTail ? [twoTail] : [],
    twoBottomHits: twoTail ? [twoTail] : [],
    threeBottomHits: [],
    runTop: buildRunDigits(threeTopHits),
    runBottom: buildRunDigits(twoTail ? [twoTail] : []),
    resultPublishedAt: parseBangkokDateTime(row?.opendate),
    isSettlementSafe: false,
    sourceUrl: `${MANYCAI_FEED_BASE_URL}/${config.feedCode}.json`,
    rawPayload: row
  };
};

const snapshotBuilders = {
  government: buildGovernmentSnapshot,
  simple5: buildSimple5Snapshot,
  stock: buildStockSnapshot,
  baac: buildBaacSnapshot
};

const fetchFeedRows = async (feedCode) => {
  const response = await axios.get(`${MANYCAI_FEED_BASE_URL}/${feedCode}.json`, {
    timeout: RESULT_SYNC_TIMEOUT_MS
  });

  if (!Array.isArray(response.data)) {
    throw new Error(`Unexpected feed payload for ${feedCode}`);
  }

  return response.data;
};

const buildSnapshot = (config, row) => {
  const builder = snapshotBuilders[config.parser];
  if (!builder) {
    throw new Error(`Parser "${config.parser}" is not supported`);
  }

  return builder(config, row);
};

const upsertSnapshot = async (snapshot, lotteryType) => {
  return MarketFeedResult.findOneAndUpdate(
    {
      feedCode: snapshot.feedCode,
      roundCode: snapshot.roundCode
    },
    {
      $set: {
        lotteryTypeId: lotteryType?._id || null,
        lotteryCode: snapshot.lotteryCode,
        marketName: snapshot.marketName,
        headline: snapshot.headline,
        firstPrize: snapshot.firstPrize,
        twoTop: snapshot.twoTop,
        twoBottom: snapshot.twoBottom,
        threeTop: snapshot.threeTop,
        threeBottom: snapshot.threeBottom,
        threeTopHits: snapshot.threeTopHits,
        twoTopHits: snapshot.twoTopHits,
        twoBottomHits: snapshot.twoBottomHits,
        threeBottomHits: snapshot.threeBottomHits,
        runTop: snapshot.runTop,
        runBottom: snapshot.runBottom,
        resultPublishedAt: snapshot.resultPublishedAt,
        isSettlementSafe: snapshot.isSettlementSafe,
        sourceUrl: snapshot.sourceUrl,
        rawPayload: snapshot.rawPayload
      }
    },
    {
      new: true,
      upsert: true
    }
  );
};

const upsertLegacyGovernmentResult = async (snapshot) => {
  const payload = snapshot.legacyGovernmentPayload;
  if (!payload?.roundDate || !payload.firstPrize) {
    return null;
  }

  const existing = await LotteryResult.findOne({ roundDate: payload.roundDate });
  if (existing) {
    Object.assign(existing, payload);
    return existing.save();
  }

  return LotteryResult.create(payload);
};

const syncSnapshotToResults = async (snapshot, lotteryType) => {
  if (!snapshot.isSettlementSafe || !lotteryType) {
    return { synced: false, settlement: null };
  }

  const round = await ensureRoundForLottery(lotteryType, snapshot.roundCode);
  if (!round) {
    throw new Error(`Round "${snapshot.roundCode}" not found for ${snapshot.lotteryCode}`);
  }

  await upsertRoundResult({
    roundId: round._id,
    lotteryTypeId: lotteryType._id,
    resultData: {
      headline: snapshot.headline,
      firstPrize: snapshot.firstPrize,
      threeTop: snapshot.threeTop,
      twoTop: snapshot.twoTop,
      twoBottom: snapshot.twoBottom,
      threeBottom: snapshot.threeBottom,
      threeTopHits: snapshot.threeTopHits,
      twoTopHits: snapshot.twoTopHits,
      twoBottomHits: snapshot.twoBottomHits,
      threeBottomHits: snapshot.threeBottomHits,
      runTop: snapshot.runTop,
      runBottom: snapshot.runBottom
    },
    sourceType: 'api',
    sourceUrl: snapshot.sourceUrl,
    isPublished: true
  });

  const settlement = await settleRoundById(round._id, { force: true });
  return { synced: true, settlement };
};

const syncLatestExternalResults = async () => {
  if (syncState.running) {
    return {
      skipped: true,
      reason: 'sync-already-running',
      ...syncState.lastSummary
    };
  }

  syncState.running = true;
  syncState.lastStartedAt = new Date().toISOString();
  syncState.lastError = null;

  try {
    const lotteryTypes = await LotteryType.find({
      code: { $in: FEED_CONFIGS.map((config) => config.lotteryCode) }
    });
    const lotteryByCode = new Map(lotteryTypes.map((item) => [item.code, item]));
    const summary = {
      syncedAt: new Date().toISOString(),
      fetched: 0,
      savedSnapshots: 0,
      syncedResults: 0,
      settlements: 0,
      skipped: 0,
      warnings: []
    };

    for (const config of FEED_CONFIGS) {
      try {
        const rows = await fetchFeedRows(config.feedCode);
        const row = rows[0];
        if (!row) {
          summary.skipped++;
          summary.warnings.push(`No data in feed ${config.feedCode}`);
          continue;
        }

        const snapshot = buildSnapshot(config, row);
        if (!snapshot.roundCode || !snapshot.headline) {
          summary.skipped++;
          summary.warnings.push(`Incomplete snapshot for ${config.feedCode}`);
          continue;
        }

        const lotteryType = lotteryByCode.get(config.lotteryCode) || null;
        await upsertSnapshot(snapshot, lotteryType);
        summary.fetched++;
        summary.savedSnapshots++;

        if (snapshot.lotteryCode === 'thai_government') {
          await upsertLegacyGovernmentResult(snapshot);
        }

        if (config.syncToResults) {
          const result = await syncSnapshotToResults(snapshot, lotteryType);
          if (result.synced) {
            summary.syncedResults++;
          }
          if (result.settlement) {
            summary.settlements++;
          }
        }
      } catch (error) {
        summary.warnings.push(`${config.feedCode}: ${error.message}`);
      }
    }

    syncState.lastCompletedAt = new Date().toISOString();
    syncState.lastSummary = summary;
    return summary;
  } catch (error) {
    syncState.lastError = error.message;
    throw error;
  } finally {
    syncState.running = false;
  }
};

const getStoredLatestExternalResults = async ({ lotteryId = null, limit = 20 } = {}) => {
  const query = lotteryId ? { lotteryTypeId: lotteryId } : {};
  const items = await MarketFeedResult.find(query)
    .sort({ resultPublishedAt: -1, updatedAt: -1 })
    .limit(limit)
    .populate('lotteryTypeId', 'code name shortName provider');

  return items.map((item) => ({
    id: `feed-${item._id.toString()}`,
    lotteryTypeId: item.lotteryTypeId?._id?.toString() || item.lotteryTypeId?.toString() || null,
    lotteryCode: item.lotteryTypeId?.code || item.lotteryCode,
    lotteryName: item.lotteryTypeId?.name || item.marketName,
    lotteryShortName: item.lotteryTypeId?.shortName || '',
    provider: item.lotteryTypeId?.provider || 'ManyCai Feed',
    roundCode: item.roundCode,
    roundTitle: item.roundCode ? `งวด ${item.roundCode}` : '',
    drawAt: item.resultPublishedAt,
    resultPublishedAt: item.resultPublishedAt || item.updatedAt,
    headline: item.headline || item.firstPrize || item.twoBottom || '-',
    firstPrize: item.firstPrize || '',
    twoTop: item.twoTop || '',
    twoBottom: item.twoBottom || '',
    threeTop: item.threeTop || '',
    threeBottom: item.threeBottom || '',
    threeTopHits: item.threeTopHits || [],
    twoTopHits: item.twoTopHits || [],
    twoBottomHits: item.twoBottomHits || [],
    threeBottomHits: item.threeBottomHits || [],
    runTop: item.runTop || [],
    runBottom: item.runBottom || [],
    sourceType: 'api',
    sourceUrl: item.sourceUrl || '',
    isExternalSnapshot: true
  }));
};

const getExternalSyncState = () => ({
  ...syncState,
  feedBaseUrl: MANYCAI_FEED_BASE_URL
});

const startExternalResultAutoSync = (intervalMs) => {
  if (autoSyncTimer) {
    clearInterval(autoSyncTimer);
  }

  const runSync = async () => {
    try {
      const summary = await syncLatestExternalResults();
      console.log(`External result sync finished: ${JSON.stringify(summary)}`);
    } catch (error) {
      console.error('External result sync error:', error.message);
      syncState.lastError = error.message;
    }
  };

  runSync();
  autoSyncTimer = setInterval(runSync, intervalMs);
  return autoSyncTimer;
};

const fetchThaiGovernmentResultByRoundCode = async (roundCode) => {
  const rows = await fetchFeedRows('tgfc');
  const row = rows.find((item) => parseIssueToRoundCode(item.officialissue || item.issue) === roundCode);
  if (!row) {
    return null;
  }

  const snapshot = buildGovernmentSnapshot(FEED_CONFIGS[0], row);
  return snapshot.legacyGovernmentPayload;
};

module.exports = {
  MANYCAI_FEED_BASE_URL,
  FEED_CONFIGS,
  fetchFeedRows,
  fetchThaiGovernmentResultByRoundCode,
  syncLatestExternalResults,
  startExternalResultAutoSync,
  getStoredLatestExternalResults,
  getExternalSyncState
};
