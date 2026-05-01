require('dotenv').config({ path: require('path').join(__dirname, '..', '..', '.env') });

const mongoose = require('mongoose');
const connectDB = require('../config/db');
const DrawRound = require('../models/DrawRound');
const LotteryType = require('../models/LotteryType');
const { getRoundStatus } = require('../services/catalogService');
const { rebuildReadModelSnapshots } = require('../services/readModelSnapshotService');
const { createBangkokDate, formatBangkokDateTime } = require('../utils/bangkokTime');

const LOTTERY_CODE = 'thai_government';
const ROUND_CODE = '2026-05-01';
const CLOSE_AT = createBangkokDate(2026, 5, 2, 15, 30);
const DRAW_AT = createBangkokDate(2026, 5, 2, 16, 0);

const main = async () => {
  try {
    await connectDB();

    const lottery = await LotteryType.findOne({ code: LOTTERY_CODE }).select('_id code name').lean();
    if (!lottery) {
      throw new Error(`Lottery not found: ${LOTTERY_CODE}`);
    }

    const round = await DrawRound.findOne({
      lotteryTypeId: lottery._id,
      code: ROUND_CODE,
      isActive: true,
      resultPublishedAt: null
    });
    if (!round) {
      throw new Error(`Active unpublished round not found: ${LOTTERY_CODE} ${ROUND_CODE}`);
    }

    const previousTiming = {
      openAt: round.openAt,
      closeAt: round.closeAt,
      drawAt: round.drawAt,
      status: round.status
    };

    round.closeAt = CLOSE_AT;
    round.drawAt = DRAW_AT;
    round.isManualTiming = true;
    round.timingUpdatedAt = new Date();
    round.status = getRoundStatus(round).status;
    await round.save();

    const snapshot = await rebuildReadModelSnapshots({
      reason: 'extend-thai-government-2026-05-01-round',
      targets: ['catalog', 'market']
    });

    console.log(JSON.stringify({
      ok: true,
      lotteryCode: lottery.code,
      lotteryName: lottery.name,
      roundCode: round.code,
      previousTiming: {
        openAt: formatBangkokDateTime(previousTiming.openAt),
        closeAt: formatBangkokDateTime(previousTiming.closeAt),
        drawAt: formatBangkokDateTime(previousTiming.drawAt),
        status: previousTiming.status
      },
      updatedTiming: {
        openAt: formatBangkokDateTime(round.openAt),
        closeAt: formatBangkokDateTime(round.closeAt),
        drawAt: formatBangkokDateTime(round.drawAt),
        status: round.status
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
