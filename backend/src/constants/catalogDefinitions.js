const { BET_TYPES, DEFAULT_GLOBAL_RATES } = require('./betting');

const DEFAULT_RATE_TIERS = [
  {
    code: 'default-global',
    name: 'เรทกลาง',
    description: 'เรทตั้งต้นกลางของระบบสำหรับทุกหวย โดยให้ admin และ agent ปรับต่อรายสมาชิกได้',
    isDefault: true,
    rates: {
      ...DEFAULT_GLOBAL_RATES
    },
    commissions: {
      '3top': 0,
      '3bottom': 0,
      '3tod': 0,
      '2top': 0,
      '2bottom': 0,
      '2tod': 0,
      'run_top': 0,
      'run_bottom': 0
    }
  }
];

const LOTTERY_LEAGUES = [
  {
    code: 'government',
    name: 'รัฐบาล',
    description: 'หวยรัฐบาลและหวยกึ่งรัฐที่ออกรอบใหญ่',
    sortOrder: 1
  },
  {
    code: 'foreign',
    name: 'ต่างประเทศ',
    description: 'หวยต่างประเทศและหวยอิงตลาดต่างประเทศ',
    sortOrder: 2
  },
  {
    code: 'daily',
    name: 'รายวัน',
    description: 'หวยรายวันออกรายรอบตลอดสัปดาห์',
    sortOrder: 3
  },
  {
    code: 'stocks',
    name: 'หุ้น',
    description: 'หวยอิงผลตลาดหุ้นในประเทศและต่างประเทศ',
    sortOrder: 4
  },
  {
    code: 'vip',
    name: 'VIP',
    description: 'โต๊ะเรทสูงและสินค้าพิเศษ',
    sortOrder: 5
  }
];

const LOTTERY_TYPES = [
  {
    code: 'thai_government',
    leagueCode: 'government',
    name: 'รัฐบาลไทย',
    shortName: 'ไทย',
    description: 'หวยรัฐบาลไทย งวดวันที่ 1 และ 16 ของเดือน',
    provider: 'Internal Feed',
    schedule: {
      type: 'monthly',
      days: [1, 16],
      openLeadDays: 7,
      closeHour: 14,
      closeMinute: 30,
      drawHour: 16,
      drawMinute: 0
    },
    supportedBetTypes: BET_TYPES,
    resultSource: 'legacy'
  },
  {
    code: 'baac',
    leagueCode: 'government',
    name: 'ธกส',
    shortName: 'ธกส',
    description: 'หวย ธกส รอบเช้าสำหรับตลาดรัฐบาล',
    provider: 'Internal Feed',
    schedule: {
      type: 'monthly',
      days: [1, 16],
      openLeadDays: 5,
      closeHour: 11,
      closeMinute: 45,
      drawHour: 12,
      drawMinute: 15
    },
    supportedBetTypes: ['3top', '3bottom', '3tod', '2top', '2bottom', '2tod'],
    resultSource: 'manual'
  },
  {
    code: 'hanoi_special',
    leagueCode: 'foreign',
    name: 'ฮานอยพิเศษ',
    shortName: 'ฮานอยพิเศษ',
    description: 'หวยต่างประเทศรอบรายวันช่วงเช้า',
    provider: 'Market Feed',
    schedule: {
      type: 'daily',
      weekdays: [1, 2, 3, 4, 5, 6],
      openLeadDays: 1,
      closeHour: 16,
      closeMinute: 5,
      drawHour: 16,
      drawMinute: 20
    },
    supportedBetTypes: BET_TYPES,
    resultSource: 'manual'
  },
  {
    code: 'lao_vip',
    leagueCode: 'daily',
    name: 'ลาว VIP',
    shortName: 'ลาว VIP',
    description: 'หวยลาวรอบเรทสูง รายวัน',
    provider: 'Market Feed',
    schedule: {
      type: 'daily',
      weekdays: [1, 2, 3, 4, 5, 6, 0],
      openLeadDays: 1,
      closeHour: 20,
      closeMinute: 15,
      drawHour: 20,
      drawMinute: 30
    },
    supportedBetTypes: BET_TYPES,
    resultSource: 'manual'
  },
  {
    code: 'dowjones_vip',
    leagueCode: 'vip',
    name: 'ดาวโจนส์ VIP',
    shortName: 'ดาวโจนส์ VIP',
    description: 'หวย VIP อิงผลต่างประเทศรอบค่ำ',
    provider: 'Market Feed',
    schedule: {
      type: 'daily',
      weekdays: [1, 2, 3, 4, 5],
      openLeadDays: 1,
      closeHour: 22,
      closeMinute: 45,
      drawHour: 23,
      drawMinute: 5
    },
    supportedBetTypes: BET_TYPES,
    resultSource: 'manual'
  },
  {
    code: 'nikkei_morning',
    leagueCode: 'stocks',
    name: 'นิเคอิเช้า',
    shortName: 'นิเคอิเช้า',
    description: 'หวยหุ้นเช้าอิงผลนิเคอิ',
    provider: 'Market Feed',
    schedule: {
      type: 'daily',
      weekdays: [1, 2, 3, 4, 5],
      openLeadDays: 1,
      closeHour: 9,
      closeMinute: 20,
      drawHour: 9,
      drawMinute: 35
    },
    supportedBetTypes: ['3top', '3bottom', '2top', '2bottom', '2tod', 'run_top', 'run_bottom'],
    resultSource: 'manual'
  },
  {
    code: 'china_afternoon',
    leagueCode: 'stocks',
    name: 'จีนบ่าย',
    shortName: 'จีนบ่าย',
    description: 'หวยหุ้นจีนภาคบ่าย',
    provider: 'Market Feed',
    schedule: {
      type: 'daily',
      weekdays: [1, 2, 3, 4, 5],
      openLeadDays: 1,
      closeHour: 13,
      closeMinute: 20,
      drawHour: 13,
      drawMinute: 40
    },
    supportedBetTypes: ['3top', '3bottom', '2top', '2bottom', '2tod', 'run_top', 'run_bottom'],
    resultSource: 'manual'
  }
];

const DEFAULT_ANNOUNCEMENTS = [
  {
    code: 'phase1-launch',
    title: 'เปิดใช้งานล็อตเตอรี่หลายตลาดแบบอ่านอย่างเดียว',
    body: 'ระบบเริ่มรองรับการเลือกตลาดหวยและงวดหลายประเภทเพื่อเตรียมต่อยอดหน้า member แบบใหม่ใน phase ถัดไป',
    audience: ['admin', 'agent', 'customer']
  }
];

module.exports = {
  DEFAULT_RATE_TIERS,
  LOTTERY_LEAGUES,
  LOTTERY_TYPES,
  DEFAULT_ANNOUNCEMENTS
};
