require('dotenv').config({ path: require('path').join(__dirname, '..', '..', '.env') });

const mongoose = require('mongoose');
const connectDB = require('../config/db');
const DrawRound = require('../models/DrawRound');
const LotteryType = require('../models/LotteryType');
const { getRoundStatus, selectCatalogActiveRound } = require('../services/catalogService');
const { rebuildReadModelSnapshots } = require('../services/readModelSnapshotService');
const { createBangkokDate, formatBangkokDateTime } = require('../utils/bangkokTime');

const LOTTERY_CODE = 'thai_government';
const POSTPONED_ROUND_CODE = '2026-05-01';
const RESULT_LOOKUP_CODE = '2026-05-02';
const NEXT_ROUND_CODE = '2026-05-16';
const CLOSE_AT = createBangkokDate(2026, 5, 2, 15, 30);
const DRAW_AT = createBangkokDate(2026, 5, 2, 16, 0);

const toPlainTiming = (round) => {
  if (!round) return null;
  return {
    code: round.code,
    openAt: formatBangkokDateTime(round.openAt),
    closeAt: formatBangkokDateTime(round.closeAt),
    drawAt: formatBangkokDateTime(round.drawAt),
    resultLookupCode: round.resultLookupCode || '',
    bettingOverride: round.bettingOverride || 'auto',
    status: round.status
  };
};

const getScheduledTimingForCode = (schedule = {}, roundCode) => {
  const [year, month, day] = roundCode.split('-').map(Number);
  const drawAt = createBangkokDate(
    year,
    month,
    day,
    Number(schedule.drawHour || 16),
    Number(schedule.drawMinute || 0)
  );
  const closeAt = createBangkokDate(
    year,
    month,
    day,
    Number(schedule.closeHour || schedule.drawHour || 15),
    Number(schedule.closeMinute || 0)
  );
  const openAt = new Date(drawAt.getTime() - (Number(schedule.openLeadDays) || 7) * 24 * 60 * 60 * 1000);

  return { openAt, closeAt, drawAt };
};

const ensurePostponedRound = async (lottery) => {
  const fallbackTiming = getScheduledTimingForCode(lottery.schedule || {}, POSTPONED_ROUND_CODE);
  const round = await DrawRound.findOneAndUpdate(
    {
      lotteryTypeId: lottery._id,
      code: POSTPONED_ROUND_CODE
    },
    {
      $set: {
        title: `Round ${POSTPONED_ROUND_CODE}`,
        closeAt: CLOSE_AT,
        drawAt: DRAW_AT,
        resultLookupCode: RESULT_LOOKUP_CODE,
        bettingOverride: 'auto',
        isManualTiming: true,
        timingUpdatedAt: new Date(),
        isActive: true
      },
      $setOnInsert: {
        openAt: fallbackTiming.openAt
      }
    },
    {
      new: true,
      upsert: true
    }
  );

  if (round.openAt.getTime() >= CLOSE_AT.getTime()) {
    round.openAt = fallbackTiming.openAt;
  }
  round.status = getRoundStatus(round).status;
  await round.save();
  return round;
};

const resetNextRoundIfNeeded = async (lottery) => {
  const round = await DrawRound.findOne({
    lotteryTypeId: lottery._id,
    code: NEXT_ROUND_CODE
  });
  if (!round) return null;

  const scheduledTiming = getScheduledTimingForCode(lottery.schedule || {}, NEXT_ROUND_CODE);
  const hasPostponedTiming = round.drawAt.getTime() < scheduledTiming.openAt.getTime()
    || round.closeAt.getTime() < scheduledTiming.openAt.getTime()
    || round.resultLookupCode === RESULT_LOOKUP_CODE
    || round.bettingOverride === 'open';

  if (!hasPostponedTiming) {
    return round;
  }

  round.openAt = scheduledTiming.openAt;
  round.closeAt = scheduledTiming.closeAt;
  round.drawAt = scheduledTiming.drawAt;
  round.resultLookupCode = '';
  round.bettingOverride = 'auto';
  round.isManualTiming = false;
  round.timingUpdatedAt = new Date();
  round.status = getRoundStatus(round).status;
  await round.save();
  return round;
};

const main = async () => {
  try {
    await connectDB();

    const lottery = await LotteryType.findOne({ code: LOTTERY_CODE });
    if (!lottery) {
      throw new Error(`Lottery not found: ${LOTTERY_CODE}`);
    }

    const beforeRounds = await DrawRound.find({
      lotteryTypeId: lottery._id,
      code: { $in: [POSTPONED_ROUND_CODE, NEXT_ROUND_CODE] }
    }).lean();

    const postponedRound = await ensurePostponedRound(lottery);
    const nextRound = await resetNextRoundIfNeeded(lottery);

    const candidateRounds = await DrawRound.find({
      lotteryTypeId: lottery._id,
      isActive: true,
      resultPublishedAt: null,
      drawAt: { $gte: createBangkokDate(2026, 5, 1, 0, 0) }
    }).sort({ drawAt: 1 }).lean();
    const selectedRound = selectCatalogActiveRound(candidateRounds, new Date());

    const snapshot = await rebuildReadModelSnapshots({
      reason: 'fix-thai-government-2026-05-01-postponed-round',
      targets: ['catalog', 'market']
    });

    console.log(JSON.stringify({
      ok: true,
      lotteryCode: lottery.code,
      lotteryName: lottery.name,
      before: beforeRounds.map(toPlainTiming),
      after: {
        postponedRound: toPlainTiming(postponedRound),
        nextRound: toPlainTiming(nextRound),
        selectedRound: toPlainTiming(selectedRound)
      },
      settlementExpectation: {
        betRoundCode: POSTPONED_ROUND_CODE,
        officialResultRoundCode: RESULT_LOOKUP_CODE
      },
      snapshot
    }, null, 2));
  } catch (error) {
    console.error(error);
    process.exitCode = 1;
  } finally {
    if (mongoose.connection.readyState) {
      await mongoose.disconnect();
    }
  }
};

main();
