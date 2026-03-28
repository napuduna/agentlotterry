require('dotenv').config({ path: require('path').join(__dirname, '..', '..', '.env') });

const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const BetItem = require('../models/BetItem');
const BetSlip = require('../models/BetSlip');
const LotteryLeague = require('../models/LotteryLeague');
const LotteryType = require('../models/LotteryType');
const RateProfile = require('../models/RateProfile');
const User = require('../models/User');
const { ensureRoundForLottery } = require('../services/resultService');
const { buildDirectMongoUri } = require('../utils/mongoUri');
const { normalizeLotteryCode } = require('../utils/lotteryCode');

const ALL_BET_TYPES = ['3top', '3tod', '2top', '2bottom', 'run_top', 'run_bottom'];
const SECTION_TO_LEAGUE_CODE = {
  government: 'government',
  international: 'foreign',
  stocks: 'stocks',
  vip: 'vip'
};
const VALID_MODES = new Set(['dry-run', 'validate', 'migrate', 'archive', 'purge']);
const WRITE_MODES = new Set(['migrate', 'archive', 'purge']);

const parseArgs = () => {
  const options = {
    mode: 'dry-run',
    yes: false,
    archiveName: '',
    strict: false,
    reportFile: ''
  };

  process.argv.slice(2).forEach((arg) => {
    if (arg.startsWith('--mode=')) {
      options.mode = arg.split('=')[1];
      return;
    }

    if (arg === '--yes') {
      options.yes = true;
      return;
    }

    if (arg === '--strict') {
      options.strict = true;
      return;
    }

    if (arg.startsWith('--archive-name=')) {
      options.archiveName = arg.split('=')[1];
      return;
    }

    if (arg.startsWith('--report-file=')) {
      options.reportFile = arg.split('=')[1];
    }
  });

  return options;
};

const formatBatchId = (date = new Date()) => {
  const pad = (value) => String(value).padStart(2, '0');
  return [
    date.getFullYear(),
    pad(date.getMonth() + 1),
    pad(date.getDate())
  ].join('') + '_' + [
    pad(date.getHours()),
    pad(date.getMinutes()),
    pad(date.getSeconds())
  ].join('');
};

const collectionExists = async (db, name) => {
  const collections = await db.listCollections({ name }).toArray();
  return collections.length > 0;
};

const resolveLegacySourceFilter = () => ({
  $and: [
    {
      $or: [
        { sourceType: { $exists: false } },
        { sourceType: { $ne: 'member-slip' } }
      ]
    },
    {
      $or: [
        { slipId: { $exists: false } },
        { slipId: null }
      ]
    },
    {
      $or: [
        { betItemId: { $exists: false } },
        { betItemId: null }
      ]
    }
  ]
});

const isShadowBetDocument = (doc) =>
  Boolean(doc.slipId) || Boolean(doc.betItemId) || doc.sourceType === 'member-slip';

const resolveLegacyLeagueCode = (sectionId) =>
  SECTION_TO_LEAGUE_CODE[String(sectionId || '').trim()] || 'daily';

const truncateName = (value, max = 20) => {
  const normalized = String(value || '').trim();
  if (!normalized) return '';
  return normalized.length > max ? normalized.slice(0, max) : normalized;
};

const buildLegacySlipNumber = (legacyBetId) =>
  `LGC-${String(legacyBetId).slice(-8).toUpperCase()}`;

const matchRateProfile = (profiles, betType, payRate) =>
  profiles.find((profile) => Number(profile.rates?.[betType] || 0) === Number(payRate || 0)) || null;

const getOrCreateLegacyLotteryType = async ({
  legacyBet,
  lotteryCache,
  rateProfiles,
  fallbackLeague
}) => {
  const lotteryCode = normalizeLotteryCode(legacyBet.marketId || legacyBet.marketName || 'legacy-market');
  if (lotteryCache.has(lotteryCode)) {
    return lotteryCache.get(lotteryCode);
  }

  let lotteryType = await LotteryType.findOne({ code: lotteryCode });
  if (!lotteryType) {
    const leagueCode = resolveLegacyLeagueCode(legacyBet.marketSectionId);
    const league =
      (await LotteryLeague.findOne({ code: leagueCode })) ||
      fallbackLeague;

    const defaultRateProfile = rateProfiles.find((profile) => profile.isDefault) || rateProfiles[0] || null;

    lotteryType = await LotteryType.create({
      code: lotteryCode,
      leagueId: league._id,
      name: legacyBet.marketName || lotteryCode,
      shortName: truncateName(legacyBet.marketName || lotteryCode, 16),
      description: 'Migrated from legacy bets collection',
      provider: 'Legacy Import',
      supportedBetTypes: ALL_BET_TYPES,
      rateProfileIds: rateProfiles.map((profile) => profile._id),
      defaultRateProfileId: defaultRateProfile?._id || null,
      resultSource: 'manual',
      schedule: {
        type: 'daily',
        weekdays: [0, 1, 2, 3, 4, 5, 6],
        openLeadDays: 1,
        closeHour: 23,
        closeMinute: 0,
        drawHour: 23,
        drawMinute: 30
      },
      sortOrder: 999,
      isActive: false
    });
  }

  lotteryCache.set(lotteryCode, lotteryType);
  return lotteryType;
};

const ensureLegacyRound = async ({ lotteryType, roundCode, roundCache }) => {
  const cacheKey = `${lotteryType._id.toString()}:${roundCode}`;
  if (roundCache.has(cacheKey)) {
    return roundCache.get(cacheKey);
  }

  const round = await ensureRoundForLottery(lotteryType, roundCode);
  if (!round) {
    throw new Error(`Unable to create round for ${roundCode}`);
  }

  roundCache.set(cacheKey, round);
  return round;
};

const setDocumentTimestamps = async (collection, id, source) => {
  const createdAt = source.createdAt || new Date();
  const updatedAt = source.updatedAt || createdAt;

  await collection.updateOne(
    { _id: id },
    {
      $set: {
        createdAt,
        updatedAt
      }
    }
  );
};

const archiveLegacyCollection = async ({ db, sourceName, targetName, batchId, mode }) => {
  const source = db.collection(sourceName);
  const target = db.collection(targetName);
  const cursor = source.find({}).sort({ _id: 1 });

  let archivedCount = 0;
  let batch = [];

  for await (const doc of cursor) {
    batch.push({
      ...doc,
      _cleanupBatchId: batchId,
      _cleanupMode: mode,
      _archivedAt: new Date(),
      _archivedFrom: sourceName
    });

    if (batch.length >= 500) {
      await target.insertMany(batch, { ordered: false });
      archivedCount += batch.length;
      batch = [];
    }
  }

  if (batch.length) {
    await target.insertMany(batch, { ordered: false });
    archivedCount += batch.length;
  }

  return archivedCount;
};

const loadExistingMigrationIds = async () => {
  const items = await BetItem.find({ migrationSourceType: 'legacy-bet' })
    .select('migrationSourceId')
    .lean();

  return new Set(
    items
      .map((item) => item.migrationSourceId)
      .filter(Boolean)
      .map((id) => id.toString())
  );
};

const analyzeLegacyBets = async ({ db, migratedIds }) => {
  if (!(await collectionExists(db, 'bets'))) {
    return {
      totalLegacyBets: 0,
      shadowBetCount: 0,
      migratedStandaloneCount: migratedIds.size,
      pendingStandaloneCount: 0,
      staleLegacyFieldCount: await db.collection('betitems').countDocuments({ legacyBetId: { $exists: true } })
    };
  }

  const cursor = db.collection('bets').find({}, { projection: { _id: 1, slipId: 1, betItemId: 1, sourceType: 1 } });

  const summary = {
    totalLegacyBets: 0,
    shadowBetCount: 0,
    migratedStandaloneCount: 0,
    pendingStandaloneCount: 0,
    staleLegacyFieldCount: await db.collection('betitems').countDocuments({ legacyBetId: { $exists: true } })
  };

  for await (const doc of cursor) {
    summary.totalLegacyBets += 1;

    if (isShadowBetDocument(doc)) {
      summary.shadowBetCount += 1;
      continue;
    }

    if (migratedIds.has(doc._id.toString())) {
      summary.migratedStandaloneCount += 1;
      continue;
    }

    summary.pendingStandaloneCount += 1;
  }

  return summary;
};

const getLegacySourceStats = async (db) => {
  if (!(await collectionExists(db, 'bets'))) {
    return {
      sourceAvailable: false,
      count: 0,
      totalAmount: 0,
      totalWonAmount: 0
    };
  }

  const rows = await db.collection('bets').aggregate([
    { $match: resolveLegacySourceFilter() },
    {
      $group: {
        _id: null,
        count: { $sum: 1 },
        totalAmount: { $sum: '$amount' },
        totalWonAmount: { $sum: '$wonAmount' }
      }
    }
  ]).toArray();

  return {
    sourceAvailable: true,
    count: rows[0]?.count || 0,
    totalAmount: rows[0]?.totalAmount || 0,
    totalWonAmount: rows[0]?.totalWonAmount || 0
  };
};

const getMigratedLegacyStats = async () => {
  const rows = await BetItem.aggregate([
    { $match: { migrationSourceType: 'legacy-bet' } },
    {
      $group: {
        _id: null,
        count: { $sum: 1 },
        totalAmount: { $sum: '$amount' },
        totalWonAmount: { $sum: '$wonAmount' }
      }
    }
  ]);

  return rows[0] || {
    count: 0,
    totalAmount: 0,
    totalWonAmount: 0
  };
};

const getDuplicateMigrationSourceCount = async () => {
  const rows = await BetItem.aggregate([
    {
      $match: {
        migrationSourceType: 'legacy-bet',
        migrationSourceId: { $exists: true, $ne: null }
      }
    },
    {
      $group: {
        _id: '$migrationSourceId',
        count: { $sum: 1 }
      }
    },
    { $match: { count: { $gt: 1 } } },
    { $count: 'count' }
  ]);

  return rows[0]?.count || 0;
};

const countLookupOrphans = async ({ db, sourceCollection, localField, targetCollection }) => {
  const rows = await db.collection(sourceCollection).aggregate([
    {
      $lookup: {
        from: targetCollection,
        localField,
        foreignField: '_id',
        as: '__ref'
      }
    },
    {
      $match: {
        $expr: {
          $eq: [{ $size: '$__ref' }, 0]
        }
      }
    },
    { $count: 'count' }
  ]).toArray();

  return rows[0]?.count || 0;
};

const countSlipsWithoutItems = async (db) => {
  const rows = await db.collection(BetSlip.collection.name).aggregate([
    {
      $lookup: {
        from: BetItem.collection.name,
        localField: '_id',
        foreignField: 'slipId',
        as: '__items'
      }
    },
    {
      $match: {
        $expr: {
          $eq: [{ $size: '$__items' }, 0]
        }
      }
    },
    { $count: 'count' }
  ]).toArray();

  return rows[0]?.count || 0;
};

const listArchiveCollections = async (db) => {
  const collections = await db.listCollections().toArray();
  return collections
    .map((item) => item.name)
    .filter((name) => /^bets_legacy_archive_/.test(name))
    .sort();
};

const buildValidationReport = async ({ db, before, after, migration, mode }) => {
  const [
    legacySource,
    migratedLegacy,
    duplicateMigrationSourceIds,
    orphanedItemsWithoutSlip,
    orphanedItemsWithoutCustomer,
    orphanedItemsWithoutAgent,
    orphanedItemsWithoutLottery,
    orphanedItemsWithoutRound,
    orphanedSlipsWithoutCustomer,
    orphanedSlipsWithoutAgent,
    orphanedSlipsWithoutLottery,
    orphanedSlipsWithoutRound,
    slipsWithoutItems,
    archiveCollections
  ] = await Promise.all([
    getLegacySourceStats(db),
    getMigratedLegacyStats(),
    getDuplicateMigrationSourceCount(),
    countLookupOrphans({
      db,
      sourceCollection: BetItem.collection.name,
      localField: 'slipId',
      targetCollection: BetSlip.collection.name
    }),
    countLookupOrphans({
      db,
      sourceCollection: BetItem.collection.name,
      localField: 'customerId',
      targetCollection: User.collection.name
    }),
    countLookupOrphans({
      db,
      sourceCollection: BetItem.collection.name,
      localField: 'agentId',
      targetCollection: User.collection.name
    }),
    countLookupOrphans({
      db,
      sourceCollection: BetItem.collection.name,
      localField: 'lotteryTypeId',
      targetCollection: LotteryType.collection.name
    }),
    countLookupOrphans({
      db,
      sourceCollection: BetItem.collection.name,
      localField: 'drawRoundId',
      targetCollection: 'drawrounds'
    }),
    countLookupOrphans({
      db,
      sourceCollection: BetSlip.collection.name,
      localField: 'customerId',
      targetCollection: User.collection.name
    }),
    countLookupOrphans({
      db,
      sourceCollection: BetSlip.collection.name,
      localField: 'agentId',
      targetCollection: User.collection.name
    }),
    countLookupOrphans({
      db,
      sourceCollection: BetSlip.collection.name,
      localField: 'lotteryTypeId',
      targetCollection: LotteryType.collection.name
    }),
    countLookupOrphans({
      db,
      sourceCollection: BetSlip.collection.name,
      localField: 'drawRoundId',
      targetCollection: 'drawrounds'
    }),
    countSlipsWithoutItems(db),
    listArchiveCollections(db)
  ]);

  const sourceAvailable = Boolean(legacySource.sourceAvailable);
  const parity = {
    sourceAvailable,
    skipped: !sourceAvailable,
    source: legacySource,
    migrated: migratedLegacy,
    countMatches: sourceAvailable ? legacySource.count === migratedLegacy.count : null,
    amountMatches: sourceAvailable ? Number(legacySource.totalAmount || 0) === Number(migratedLegacy.totalAmount || 0) : null,
    totalWonMatches: sourceAvailable ? Number(legacySource.totalWonAmount || 0) === Number(migratedLegacy.totalWonAmount || 0) : null
  };

  const errors = [];
  const warnings = [];

  if ((migration?.failedCount || 0) > 0) {
    errors.push(`Migration reported ${migration.failedCount} failed legacy bet rows`);
  }

  if ((after?.pendingStandaloneCount || 0) > 0) {
    errors.push(`There are still ${after.pendingStandaloneCount} standalone legacy bets waiting to be migrated`);
  }

  if (duplicateMigrationSourceIds > 0) {
    errors.push(`Found ${duplicateMigrationSourceIds} duplicate migrationSourceId values in bet items`);
  }

  if (sourceAvailable && (!parity.countMatches || !parity.amountMatches || !parity.totalWonMatches)) {
    errors.push('Legacy source totals do not match migrated legacy bet item totals');
  }

  if ((after?.staleLegacyFieldCount || 0) > 0) {
    errors.push(`Found ${after.staleLegacyFieldCount} stale legacyBetId fields in bet items`);
  }

  const orphanSummary = {
    orphanedItemsWithoutSlip,
    orphanedItemsWithoutCustomer,
    orphanedItemsWithoutAgent,
    orphanedItemsWithoutLottery,
    orphanedItemsWithoutRound,
    orphanedSlipsWithoutCustomer,
    orphanedSlipsWithoutAgent,
    orphanedSlipsWithoutLottery,
    orphanedSlipsWithoutRound,
    slipsWithoutItems
  };

  Object.entries(orphanSummary).forEach(([label, count]) => {
    if (count > 0) {
      errors.push(`Integrity check failed: ${label}=${count}`);
    }
  });

  if (mode === 'dry-run' && before.totalLegacyBets === 0) {
    warnings.push('Legacy bets collection does not exist or is already empty');
  }

  if (!sourceAvailable) {
    warnings.push(
      archiveCollections.length
        ? 'Legacy bets collection has already been archived or removed; parity checks are informational only'
        : 'Legacy bets collection has already been removed; parity checks are informational only'
    );
  }

  if (archiveCollections.length > 0) {
    warnings.push(`Detected ${archiveCollections.length} legacy archive collection(s)`);
  }

  return {
    collections: {
      betsExists: await collectionExists(db, 'bets'),
      betSlipCount: await db.collection(BetSlip.collection.name).countDocuments({}),
      betItemCount: await db.collection(BetItem.collection.name).countDocuments({}),
      archiveCollections
    },
    parity,
    integrity: {
      duplicateMigrationSourceIds,
      ...orphanSummary
    },
    safeToArchive: sourceAvailable && errors.length === 0,
    warnings,
    errors
  };
};

const migrateLegacyBets = async ({ db, batchId }) => {
  if (!(await collectionExists(db, 'bets'))) {
    return {
      migratedCount: 0,
      skippedShadowCount: 0,
      skippedAlreadyMigratedCount: 0,
      failedCount: 0,
      failures: []
    };
  }

  const migratedIds = await loadExistingMigrationIds();
  const rateProfiles = await RateProfile.find().sort({ isDefault: -1, createdAt: 1 });
  const fallbackLeague =
    (await LotteryLeague.findOne({ code: 'daily' })) ||
    (await LotteryLeague.findOne().sort({ sortOrder: 1, createdAt: 1 }));

  const lotteryCache = new Map();
  const roundCache = new Map();
  const cursor = db.collection('bets').find({}).sort({ _id: 1 });
  const result = {
    migratedCount: 0,
    skippedShadowCount: 0,
    skippedAlreadyMigratedCount: 0,
    failedCount: 0,
    failures: []
  };

  for await (const legacyBet of cursor) {
    if (isShadowBetDocument(legacyBet)) {
      result.skippedShadowCount += 1;
      continue;
    }

    if (migratedIds.has(legacyBet._id.toString())) {
      result.skippedAlreadyMigratedCount += 1;
      continue;
    }

    try {
      const customer = await User.findById(legacyBet.customerId).select('_id agentId');
      if (!customer) {
        throw new Error('Customer not found');
      }

      const agentId = legacyBet.agentId || customer.agentId;
      if (!agentId) {
        throw new Error('Agent not found for legacy bet');
      }

      const lotteryType = await getOrCreateLegacyLotteryType({
        legacyBet,
        lotteryCache,
        rateProfiles,
        fallbackLeague
      });
      const round = await ensureLegacyRound({
        lotteryType,
        roundCode: legacyBet.roundDate,
        roundCache
      });
      const rateProfile = matchRateProfile(rateProfiles, legacyBet.betType, legacyBet.payRate);

      const slip = await BetSlip.create({
        customerId: customer._id,
        agentId,
        lotteryTypeId: lotteryType._id,
        drawRoundId: round._id,
        rateProfileId: rateProfile?._id || null,
        slipNumber: buildLegacySlipNumber(legacyBet._id),
        lotteryCode: lotteryType.code,
        lotteryName: lotteryType.name,
        roundCode: round.code,
        roundTitle: round.title,
        rateProfileName: rateProfile?.name || 'Legacy Imported',
        openAt: round.openAt,
        closeAt: round.closeAt,
        drawAt: round.drawAt,
        sourceType: 'legacy-import',
        status: 'submitted',
        memo: `Migrated from legacy bet ${legacyBet._id}`,
        itemCount: 1,
        totalAmount: legacyBet.amount,
        potentialPayout: Number(legacyBet.amount || 0) * Number(legacyBet.payRate || 0),
        submittedAt: legacyBet.createdAt || new Date()
      });

      const item = await BetItem.create({
        slipId: slip._id,
        customerId: customer._id,
        agentId,
        lotteryTypeId: lotteryType._id,
        drawRoundId: round._id,
        rateProfileId: rateProfile?._id || null,
        migrationSourceType: 'legacy-bet',
        migrationSourceId: legacyBet._id,
        sequence: 1,
        betType: legacyBet.betType,
        number: legacyBet.number,
        amount: legacyBet.amount,
        payRate: legacyBet.payRate,
        potentialPayout: Number(legacyBet.amount || 0) * Number(legacyBet.payRate || 0),
        status: 'submitted',
        result: legacyBet.result || 'pending',
        wonAmount: legacyBet.wonAmount || 0,
        isLocked: Boolean(legacyBet.isLocked)
      });

      await setDocumentTimestamps(BetSlip.collection, slip._id, legacyBet);
      await setDocumentTimestamps(BetItem.collection, item._id, legacyBet);

      migratedIds.add(legacyBet._id.toString());
      result.migratedCount += 1;
    } catch (error) {
      result.failedCount += 1;
      result.failures.push({
        legacyBetId: legacyBet._id.toString(),
        message: error.message
      });
    }
  }

  return {
    ...result,
    batchId
  };
};

const cleanupLegacyReferences = async (db) => {
  const cleanup = await db.collection('betitems').updateMany(
    { legacyBetId: { $exists: true } },
    { $unset: { legacyBetId: '' } }
  );

  return {
    matchedCount: cleanup.matchedCount || 0,
    modifiedCount: cleanup.modifiedCount || 0
  };
};

const writeReportFile = (reportFile, payload) => {
  if (!reportFile) {
    return '';
  }

  const resolvedPath = path.isAbsolute(reportFile)
    ? reportFile
    : path.resolve(process.cwd(), reportFile);

  fs.mkdirSync(path.dirname(resolvedPath), { recursive: true });
  fs.writeFileSync(resolvedPath, JSON.stringify(payload, null, 2));
  return resolvedPath;
};

const shouldFailValidation = ({ options, validation }) => {
  if (!validation) {
    return false;
  }

  if (validation.errors.length > 0) {
    return true;
  }

  if (options.strict && validation.warnings.length > 0) {
    return true;
  }

  return false;
};

const main = async () => {
  const options = parseArgs();
  if (!VALID_MODES.has(options.mode)) {
    throw new Error(`Unsupported mode: ${options.mode}`);
  }

  if (WRITE_MODES.has(options.mode) && !options.yes) {
    throw new Error('Write modes require --yes');
  }

  if (!process.env.MONGODB_URI) {
    throw new Error('MONGODB_URI is missing');
  }

  const mongoUri = await buildDirectMongoUri(process.env.MONGODB_URI);
  await mongoose.connect(mongoUri);
  const db = mongoose.connection.db;
  const batchId = formatBatchId();
  const initialMigratedIds = await loadExistingMigrationIds();
  const before = await analyzeLegacyBets({ db, migratedIds: initialMigratedIds });

  const output = {
    mode: options.mode,
    batchId,
    before,
    migration: null,
    cleanup: null,
    archive: null,
    validation: null,
    after: null,
    reportFile: ''
  };

  if (options.mode === 'dry-run' || options.mode === 'validate') {
    output.after = before;
    output.validation = await buildValidationReport({
      db,
      before,
      after: output.after,
      migration: null,
      mode: options.mode
    });
  } else {
    output.migration = await migrateLegacyBets({ db, batchId });
    output.cleanup = await cleanupLegacyReferences(db);

    const postMigrationIds = await loadExistingMigrationIds();
    const postMigrationState = await analyzeLegacyBets({ db, migratedIds: postMigrationIds });

    output.validation = await buildValidationReport({
      db,
      before,
      after: postMigrationState,
      migration: output.migration,
      mode: options.mode
    });

    if ((output.migration.failedCount || 0) > 0 && options.mode !== 'migrate') {
      throw new Error('Migration reported failures. Archive/purge aborted.');
    }

    if ((options.mode === 'archive' || options.mode === 'purge') && !output.validation.safeToArchive) {
      throw new Error('Validation failed after migration. Archive/purge aborted.');
    }

    if (options.mode === 'archive' || options.mode === 'purge') {
      const betsExists = await collectionExists(db, 'bets');
      if (betsExists) {
        const sourceCount = await db.collection('bets').countDocuments({});

        if (options.mode === 'archive') {
          const archiveName = options.archiveName || `bets_legacy_archive_${batchId}`;
          if (await collectionExists(db, archiveName)) {
            throw new Error(`Archive collection already exists: ${archiveName}`);
          }

          const archivedCount = await archiveLegacyCollection({
            db,
            sourceName: 'bets',
            targetName: archiveName,
            batchId,
            mode: options.mode
          });

          if (archivedCount !== sourceCount) {
            throw new Error(`Archive mismatch: sourceCount=${sourceCount}, archivedCount=${archivedCount}`);
          }

          output.archive = {
            collection: archiveName,
            archivedCount
          };
        }

        await db.collection('bets').drop();
      }
    }

    const finalMigratedIds = await loadExistingMigrationIds();
    output.after = await analyzeLegacyBets({ db, migratedIds: finalMigratedIds });
  }

  output.reportFile = writeReportFile(options.reportFile, output);
  console.log(JSON.stringify(output, null, 2));

  if (shouldFailValidation({ options, validation: output.validation })) {
    process.exitCode = 1;
  }

  await mongoose.disconnect();
};

main().catch(async (error) => {
  console.error(error.message || error);
  if (mongoose.connection.readyState) {
    await mongoose.disconnect();
  }
  process.exit(1);
});
