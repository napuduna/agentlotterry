const MIN_DRAW_AFTER_CLOSE_MINUTES = 10;
const DAY_MINUTES = 24 * 60;

const LOTTERY_CLOSE_TIME_OVERRIDES = Object.freeze({
  thai_government: { closeHour: 15, closeMinute: 30 },

  nikkei_morning: { closeHour: 9, closeMinute: 20 },
  gscna: { closeHour: 10, closeMinute: 20 },
  gshka: { closeHour: 10, closeMinute: 50 },
  gstw: { closeHour: 12, closeMinute: 0 },
  gskr: { closeHour: 12, closeMinute: 40 },
  gsjpp: { closeHour: 12, closeMinute: 50 },
  china_afternoon: { closeHour: 13, closeMinute: 30 },
  gshkp: { closeHour: 14, closeMinute: 50 },
  gssg: { closeHour: 15, closeMinute: 50 },

  nikkei_morning_vip: { closeHour: 9, closeMinute: 0 },
  china_morning_vip: { closeHour: 10, closeMinute: 0 },
  hangseng_morning_vip: { closeHour: 10, closeMinute: 30 },
  taiwan_vip: { closeHour: 11, closeMinute: 30 },
  korea_vip: { closeHour: 12, closeMinute: 30 },
  nikkei_afternoon_vip: { closeHour: 13, closeMinute: 20 },
  china_afternoon_vip: { closeHour: 14, closeMinute: 20 },
  hangseng_afternoon_vip: { closeHour: 15, closeMinute: 20 },

  lao_extra: { closeHour: 8, closeMinute: 20 },
  hanoi_asean: { closeHour: 9, closeMinute: 10 },
  lao_tv: { closeHour: 10, closeMinute: 25 },
  hanoi_hd: { closeHour: 11, closeMinute: 10 },
  hanoi_star: { closeHour: 12, closeMinute: 10 },
  lao_hd: { closeHour: 13, closeMinute: 30 },
  hanoi_tv: { closeHour: 14, closeMinute: 10 },
  lao_star: { closeHour: 15, closeMinute: 40 },
  hanoi_redcross: { closeHour: 16, closeMinute: 10 },
  cqhn: { closeHour: 16, closeMinute: 10 },
  hanoi_union: { closeHour: 17, closeMinute: 10 },
  hanoi_special: { closeHour: 17, closeMinute: 10 },
  ynhn: { closeHour: 18, closeMinute: 10 },
  hanoi_develop: { closeHour: 19, closeMinute: 10 },
  hnvip: { closeHour: 19, closeMinute: 10 },
  lao_pathana: { closeHour: 20, closeMinute: 10 },
  tlzc: { closeHour: 20, closeMinute: 20 },
  lao_asean: { closeHour: 20, closeMinute: 40 },
  lao_union: { closeHour: 20, closeMinute: 20 },
  lao_vip: { closeHour: 21, closeMinute: 0 },
  england_vip: { closeHour: 21, closeMinute: 20 },
  lao_union_vip: { closeHour: 21, closeMinute: 25 },
  lao_star_vip: { closeHour: 21, closeMinute: 45 },
  hanoi_extra: { closeHour: 22, closeMinute: 10 },
  germany_vip: { closeHour: 22, closeMinute: 20 },
  russia_vip: { closeHour: 23, closeMinute: 20 },
  lao_redcross: { closeHour: 23, closeMinute: 25 },
  gsus: { closeHour: 23, closeMinute: 30 },
  dowjones_vip: { closeHour: 23, closeMinute: 30 }
});

const toMinutes = (hour, minute) => hour * 60 + minute;

const fromMinutes = (value) => {
  const normalized = ((value % DAY_MINUTES) + DAY_MINUTES) % DAY_MINUTES;
  return {
    hour: Math.floor(normalized / 60),
    minute: normalized % 60
  };
};

const makeDrawAfterCloseIfNeeded = (schedule) => {
  const closeTotal = toMinutes(schedule.closeHour, schedule.closeMinute);
  const drawTotal = toMinutes(schedule.drawHour, schedule.drawMinute);

  if (drawTotal > closeTotal) {
    return schedule;
  }

  const { hour, minute } = fromMinutes(closeTotal + MIN_DRAW_AFTER_CLOSE_MINUTES);
  return {
    ...schedule,
    drawHour: hour,
    drawMinute: minute
  };
};

const getScheduleWithCloseTimeOverride = (lottery) => {
  const override = LOTTERY_CLOSE_TIME_OVERRIDES[lottery.code];
  if (!override || !lottery.schedule) {
    return lottery.schedule;
  }

  return makeDrawAfterCloseIfNeeded({
    ...lottery.schedule,
    closeHour: override.closeHour,
    closeMinute: override.closeMinute
  });
};

const applyCloseTimeOverridesToLotteryTypes = (lotteries) => lotteries.map((lottery) => ({
  ...lottery,
  schedule: getScheduleWithCloseTimeOverride(lottery)
}));

module.exports = {
  LOTTERY_CLOSE_TIME_OVERRIDES,
  getScheduleWithCloseTimeOverride,
  applyCloseTimeOverridesToLotteryTypes
};
