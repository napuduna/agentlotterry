require('dotenv').config({ path: require('path').join(__dirname, '..', '..', '.env') });

const mongoose = require('mongoose');
const connectDB = require('../config/db');
const DrawRound = require('../models/DrawRound');
const LotteryType = require('../models/LotteryType');
const {
  LOTTERY_CLOSE_TIME_OVERRIDES,
  getScheduleWithCloseTimeOverride
} = require('../constants/lotteryCloseTimeOverrides');
const {
  createBangkokDate,
  getBangkokParts
} = require('../utils/bangkokTime');
const { getRoundStatus } = require('../services/catalogService');
const { rebuildReadModelSnapshots } = require('../services/readModelSnapshotService');

const DAY_MS = 24 * 60 * 60 * 1000;
const ROUND_CODE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;

const parseRoundCode = (code) => {
  const match = String(code || '').match(ROUND_CODE_PATTERN);
  if (!match) return null;

  return {
    year: Number(match[1]),
    month: Number(match[2]),
    day: Number(match[3])
  };
};

const buildRoundTiming = (schedule, roundCode) => {
  const parts = parseRoundCode(roundCode);
  if (!parts) return null;

  const drawAt = createBangkokDate(parts.year, parts.month, parts.day, schedule.drawHour, schedule.drawMinute);
  const closeAt = createBangkokDate(parts.year, parts.month, parts.day, schedule.closeHour, schedule.closeMinute);
  const openAt = new Date(drawAt.getTime() - Number(schedule.openLeadDays || 1) * DAY_MS);

  return {
    openAt,
    closeAt,
    drawAt,
    status: getRoundStatus({ openAt, closeAt, drawAt }).status
  };
};

const getBangkokDateCode = (offsetDays = 0) => {
  const now = new Date();
  const parts = getBangkokParts(now);
  const target = createBangkokDate(parts.year, parts.month, parts.day, 0, 0);
  const shifted = getBangkokParts(new Date(target.getTime() + offsetDays * DAY_MS));
  return `${shifted.year}-${String(shifted.month).padStart(2, '0')}-${String(shifted.day).padStart(2, '0')}`;
};

const syncLottery = async (lottery) => {
  if (lottery.isManualScheduleTiming) {
    return {
      code: lottery.code,
      name: lottery.name,
      updatedRounds: 0,
      skipped: true,
      reason: 'manual-schedule-timing'
    };
  }

  const schedule = getScheduleWithCloseTimeOverride(lottery);
  if (!schedule) {
    return { code: lottery.code, updatedRounds: 0, skipped: true };
  }

  await LotteryType.updateOne(
    { _id: lottery._id },
    {
      $set: {
        'schedule.closeHour': schedule.closeHour,
        'schedule.closeMinute': schedule.closeMinute,
        'schedule.drawHour': schedule.drawHour,
        'schedule.drawMinute': schedule.drawMinute
      }
    }
  );

  const minRoundCode = getBangkokDateCode(-1);
  const rounds = await DrawRound.find({
    lotteryTypeId: lottery._id,
    isActive: true,
    isManualTiming: { $ne: true },
    resultPublishedAt: null,
    code: { $gte: minRoundCode }
  }).select('_id code').lean();

  const operations = rounds
    .map((round) => {
      const timing = buildRoundTiming(schedule, round.code);
      if (!timing) return null;

      return {
        updateOne: {
          filter: { _id: round._id, isManualTiming: { $ne: true }, resultPublishedAt: null },
          update: { $set: timing }
        }
      };
    })
    .filter(Boolean);

  if (operations.length) {
    await DrawRound.bulkWrite(operations, { ordered: false });
  }

  return {
    code: lottery.code,
    name: lottery.name,
    closeTime: `${String(schedule.closeHour).padStart(2, '0')}:${String(schedule.closeMinute).padStart(2, '0')}`,
    drawTime: `${String(schedule.drawHour).padStart(2, '0')}:${String(schedule.drawMinute).padStart(2, '0')}`,
    updatedRounds: operations.length
  };
};

const main = async () => {
  try {
    await connectDB();
    const codes = Object.keys(LOTTERY_CLOSE_TIME_OVERRIDES);
    const lotteries = await LotteryType.find({ code: { $in: codes } }).lean();
    const foundCodes = new Set(lotteries.map((lottery) => lottery.code));

    const summaries = [];
    for (const lottery of lotteries) {
      summaries.push(await syncLottery(lottery));
    }

    const missingCodes = codes.filter((code) => !foundCodes.has(code));
    const snapshot = await rebuildReadModelSnapshots({
      reason: 'sync-lottery-close-times',
      targets: ['catalog', 'market']
    });

    console.log(JSON.stringify({
      ok: true,
      updatedLotteries: summaries.length,
      missingCodes,
      summaries,
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
