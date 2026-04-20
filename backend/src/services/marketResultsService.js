const axios = require('axios');
const LotteryResult = require('../models/LotteryResult');
const LotteryType = require('../models/LotteryType');
const ResultRecord = require('../models/ResultRecord');
const MarketFeedResult = require('../models/MarketFeedResult');
const MarketOverviewSnapshot = require('../models/MarketOverviewSnapshot');
const { LOTTERY_TYPES } = require('../constants/catalogDefinitions');
const { createBangkokDate } = require('../utils/bangkokTime');
const { normalizeLotteryCode } = require('../utils/lotteryCode');
const { MANYCAI_FEED_BASE_URL } = require('./externalResultFeedService');
const {
  GSB_MARKET_ID,
  GSB_MARKET_NAME,
  GSB_PROVIDER_NAME,
  fetchLatestGsbSnapshot
} = require('./gsbResultService');
const {
  THAI_GOV_MARKET_ID,
  THAI_GOV_MARKET_NAME,
  THAI_GOV_PROVIDER_NAME,
  fetchLatestThaiGovernmentSnapshot
} = require('./thaiGovernmentResultService');
const {
  BAAC_MARKET_ID,
  BAAC_MARKET_NAME,
  BAAC_PROVIDER_NAME,
  fetchLatestBaacSnapshot
} = require('./baacResultService');
const {
  LAOS_MARKET_NAME,
  LAOS_PROVIDER_NAME,
  fetchLatestLaosSnapshot
} = require('./laosResultService');
const {
  LAOS_VIP_MARKET_NAME,
  LAOS_VIP_PROVIDER_NAME,
  fetchLatestLaosVipSnapshot
} = require('./laosVipResultService');
const {
  LAOS_PATHANA_MARKET_ID,
  LAOS_PATHANA_MARKET_NAME,
  LAOS_PATHANA_PROVIDER_NAME,
  fetchLatestLaosPathanaSnapshot
} = require('./laosPathanaResultService');
const {
  LAOS_REDCROSS_MARKET_ID,
  LAOS_REDCROSS_MARKET_NAME,
  LAOS_REDCROSS_PROVIDER_NAME,
  fetchLatestLaosRedcrossSnapshot
} = require('./laosRedcrossResultService');
const {
  LAOS_TV_MARKET_ID,
  LAOS_TV_MARKET_NAME,
  LAOS_TV_PROVIDER_NAME,
  fetchLatestLaosTvSnapshot
} = require('./laosTvResultService');
const {
  LAOS_HD_MARKET_ID,
  LAOS_HD_MARKET_NAME,
  LAOS_HD_PROVIDER_NAME,
  fetchLatestLaosHdSnapshot
} = require('./laosHdResultService');
const {
  LAOS_EXTRA_MARKET_ID,
  LAOS_EXTRA_MARKET_NAME,
  LAOS_EXTRA_PROVIDER_NAME,
  fetchLatestLaosExtraSnapshot
} = require('./laosExtraResultService');
const {
  LAOS_STAR_MARKET_ID,
  LAOS_STAR_MARKET_NAME,
  LAOS_STAR_PROVIDER_NAME,
  fetchLatestLaosStarsSnapshot
} = require('./laosStarsResultService');
const {
  LAOS_STAR_VIP_MARKET_ID,
  LAOS_STAR_VIP_MARKET_NAME,
  LAOS_STAR_VIP_PROVIDER_NAME,
  fetchLatestLaosStarsVipSnapshot
} = require('./laosStarsVipResultService');
const {
  LAOS_UNION_MARKET_ID,
  LAOS_UNION_MARKET_NAME,
  LAOS_UNION_PROVIDER_NAME,
  fetchLatestLaosUnionSnapshot
} = require('./laosUnionResultService');
const {
  LAOS_UNION_VIP_MARKET_ID,
  LAOS_UNION_VIP_MARKET_NAME,
  LAOS_UNION_VIP_PROVIDER_NAME,
  fetchLatestLaosUnionVipSnapshot
} = require('./laosUnionVipResultService');
const {
  LAOS_ASEAN_MARKET_ID,
  LAOS_ASEAN_MARKET_NAME,
  LAOS_ASEAN_PROVIDER_NAME,
  fetchLatestLaosAseanSnapshot
} = require('./laosAseanResultService');
const {
  HANOI_EXTRA_MARKET_ID,
  HANOI_EXTRA_MARKET_NAME,
  HANOI_EXTRA_PROVIDER_NAME,
  fetchLatestHanoiExtraSnapshot
} = require('./hanoiExtraResultService');
const {
  HANOI_STAR_MARKET_ID,
  HANOI_STAR_MARKET_NAME,
  HANOI_STAR_PROVIDER_NAME,
  fetchLatestHanoiStarSnapshot
} = require('./hanoiStarResultService');
const {
  HANOI_DEVELOP_MARKET_ID,
  HANOI_DEVELOP_MARKET_NAME,
  HANOI_DEVELOP_PROVIDER_NAME,
  fetchLatestHanoiDevelopSnapshot
} = require('./hanoiDevelopResultService');
const {
  HANOI_HD_MARKET_ID,
  HANOI_HD_MARKET_NAME,
  HANOI_HD_PROVIDER_NAME,
  fetchLatestHanoiHdSnapshot
} = require('./hanoiHdResultService');
const {
  HANOI_TV_MARKET_ID,
  HANOI_TV_MARKET_NAME,
  HANOI_TV_PROVIDER_NAME,
  fetchLatestHanoiTvSnapshot
} = require('./hanoiTvResultService');
const {
  HANOI_REDCROSS_MARKET_ID,
  HANOI_REDCROSS_MARKET_NAME,
  HANOI_REDCROSS_PROVIDER_NAME,
  fetchLatestHanoiRedcrossSnapshot
} = require('./hanoiRedcrossResultService');
const {
  HANOI_UNION_MARKET_ID,
  HANOI_UNION_MARKET_NAME,
  HANOI_UNION_PROVIDER_NAME,
  fetchLatestHanoiUnionSnapshot
} = require('./hanoiUnionResultService');
const {
  HANOI_ASEAN_MARKET_ID,
  HANOI_ASEAN_MARKET_NAME,
  HANOI_ASEAN_PROVIDER_NAME,
  fetchLatestHanoiAseanSnapshot
} = require('./hanoiAseanResultService');
const {
  CHINA_MORNING_VIP_MARKET_ID,
  CHINA_MORNING_VIP_MARKET_NAME,
  CHINA_AFTERNOON_VIP_MARKET_ID,
  CHINA_AFTERNOON_VIP_MARKET_NAME,
  SHENZHEN_INDEX_PROVIDER_NAME,
  fetchLatestShenzhenMorningVipSnapshot,
  fetchLatestShenzhenAfternoonVipSnapshot
} = require('./shenzhenIndexVipResultService');
const {
  NIKKEI_MORNING_VIP_MARKET_ID,
  NIKKEI_MORNING_VIP_MARKET_NAME,
  NIKKEI_AFTERNOON_VIP_MARKET_ID,
  NIKKEI_AFTERNOON_VIP_MARKET_NAME,
  NIKKEI_VIP_PROVIDER_NAME,
  fetchLatestNikkeiMorningVipSnapshot,
  fetchLatestNikkeiAfternoonVipSnapshot
} = require('./nikkeiVipResultService');
const {
  HSI_MORNING_VIP_MARKET_ID,
  HSI_MORNING_VIP_MARKET_NAME,
  HSI_AFTERNOON_VIP_MARKET_ID,
  HSI_AFTERNOON_VIP_MARKET_NAME,
  HSI_VIP_PROVIDER_NAME,
  fetchLatestHsiMorningVipSnapshot,
  fetchLatestHsiAfternoonVipSnapshot
} = require('./hsiVipResultService');
const {
  ENGLAND_VIP_MARKET_ID,
  ENGLAND_VIP_MARKET_NAME,
  GERMANY_VIP_MARKET_ID,
  GERMANY_VIP_MARKET_NAME,
  RUSSIA_VIP_MARKET_ID,
  RUSSIA_VIP_MARKET_NAME,
  LOTTO_SUPER_RICH_PROVIDER_NAME,
  fetchLatestEnglandVipSnapshot,
  fetchLatestGermanyVipSnapshot,
  fetchLatestRussiaVipSnapshot
} = require('./lottoSuperRichVipResultService');
const {
  KOREA_VIP_MARKET_ID,
  KOREA_VIP_MARKET_NAME,
  KOREA_VIP_PROVIDER_NAME,
  fetchLatestKoreaVipSnapshot
} = require('./koreaVipResultService');
const {
  TAIWAN_VIP_MARKET_ID,
  TAIWAN_VIP_MARKET_NAME,
  TAIWAN_VIP_PROVIDER_NAME,
  fetchLatestTaiwanVipSnapshot
} = require('./taiwanVipResultService');
const {
  SINGAPORE_VIP_MARKET_ID,
  SINGAPORE_VIP_MARKET_NAME,
  SINGAPORE_VIP_PROVIDER_NAME,
  fetchLatestSingaporeVipSnapshot
} = require('./singaporeVipResultService');
const {
  DOWJONES_VIP_MARKET_ID,
  DOWJONES_VIP_MARKET_NAME,
  DOWJONES_VIP_PROVIDER_NAME,
  fetchLatestDowjonesVipSnapshot
} = require('./dowjonesVipResultService');

const PROVIDER_NAME = 'manycai';
const RAW_PROVIDER_KEY = String(process.env.MANYCAI_API_KEY || '').trim();
const PROVIDER_KEY = RAW_PROVIDER_KEY || '__feed_fallback__';
const PROVIDER_BASE_URL = (
  RAW_PROVIDER_KEY
    ? `${(process.env.MANYCAI_BASE_URL || 'http://vip.manycai.com').replace(/\/$/, '')}/${RAW_PROVIDER_KEY}`
    : MANYCAI_FEED_BASE_URL
).replace(/\/$/, '');
const DEFAULT_MARKET_RESULTS_CACHE_MS = 300000;
const DEFAULT_MARKET_RESULTS_BATCH_SIZE = 12;
const CACHE_TTL_MS = Number(process.env.MARKET_RESULTS_CACHE_MS || DEFAULT_MARKET_RESULTS_CACHE_MS);
const MARKET_RESULTS_BATCH_SIZE = Math.max(
  1,
  Number(process.env.MARKET_RESULTS_BATCH_SIZE || DEFAULT_MARKET_RESULTS_BATCH_SIZE)
);
const LAOS_NOTE = 'ตรวจจับจาก Huay Lao Official และแปลงผลแบบลาว 4 ตัวของระบบ';
const LAOS_VIP_NOTE = 'ตรวจจับจาก Lao VIP Official และแปลงผลแบบลาว VIP ของระบบ';
const LAOS_NUMBER_LABELS = {
  threeTop: '3 ตัวบน',
  twoTop: '2 ตัวบน',
  twoBottom: '2 ตัวล่าง'
};
const LAOS_PATHANA_NOTE = '\u0e15\u0e23\u0e27\u0e08\u0e08\u0e31\u0e1a\u0e08\u0e32\u0e01\u0e40\u0e27\u0e47\u0e1a\u0e44\u0e0b\u0e15\u0e4c Lao Pathana \u0e41\u0e25\u0e30\u0e41\u0e1b\u0e25\u0e07\u0e1c\u0e25\u0e41\u0e1a\u0e1a\u0e40\u0e14\u0e35\u0e22\u0e27\u0e01\u0e31\u0e1a GOGOLot';
const LAOS_PATHANA_NUMBER_LABELS = {
  threeTop: '\u0033 \u0e15\u0e31\u0e27\u0e1a\u0e19',
  twoTop: '\u0032 \u0e15\u0e31\u0e27\u0e1a\u0e19',
  twoBottom: '\u0032 \u0e15\u0e31\u0e27\u0e25\u0e48\u0e32\u0e07'
};
const LAOS_REDCROSS_NOTE = '\u0e15\u0e23\u0e27\u0e08\u0e08\u0e31\u0e1a\u0e08\u0e32\u0e01 API Lao Red Cross \u0e15\u0e23\u0e07 \u0e41\u0e25\u0e30\u0e43\u0e0a\u0e49\u0e1c\u0e25 \u0033 \u0e15\u0e31\u0e27\u0e1a\u0e19 \u0032 \u0e15\u0e31\u0e27\u0e1a\u0e19 \u0e01\u0e31\u0e1a \u0032 \u0e15\u0e31\u0e27\u0e25\u0e48\u0e32\u0e07 \u0e15\u0e32\u0e21\u0e1f\u0e34\u0e25\u0e14\u0e4c\u0e17\u0e32\u0e07\u0e01\u0e32\u0e23';
const LAOS_REDCROSS_NUMBER_LABELS = {
  threeTop: '\u0033 \u0e15\u0e31\u0e27\u0e1a\u0e19',
  twoTop: '\u0032 \u0e15\u0e31\u0e27\u0e1a\u0e19',
  twoBottom: '\u0032 \u0e15\u0e31\u0e27\u0e25\u0e48\u0e32\u0e07'
};
const LAOS_TV_NOTE = '\u0e15\u0e23\u0e27\u0e08\u0e08\u0e31\u0e1a\u0e08\u0e32\u0e01 API Lao TV \u0e15\u0e23\u0e07 \u0e41\u0e25\u0e30\u0e43\u0e0a\u0e49\u0e1c\u0e25 \u0033 \u0e15\u0e31\u0e27\u0e1a\u0e19 \u0032 \u0e15\u0e31\u0e27\u0e1a\u0e19 \u0e01\u0e31\u0e1a \u0032 \u0e15\u0e31\u0e27\u0e25\u0e48\u0e32\u0e07 \u0e15\u0e32\u0e21\u0e1f\u0e34\u0e25\u0e14\u0e4c\u0e17\u0e32\u0e07\u0e01\u0e32\u0e23';
const LAOS_TV_NUMBER_LABELS = {
  threeTop: '\u0033 \u0e15\u0e31\u0e27\u0e1a\u0e19',
  twoTop: '\u0032 \u0e15\u0e31\u0e27\u0e1a\u0e19',
  twoBottom: '\u0032 \u0e15\u0e31\u0e27\u0e25\u0e48\u0e32\u0e07'
};
const LAOS_HD_NOTE = '\u0e15\u0e23\u0e27\u0e08\u0e08\u0e31\u0e1a\u0e08\u0e32\u0e01 API Lao HD \u0e15\u0e23\u0e07 \u0e41\u0e25\u0e30\u0e43\u0e0a\u0e49\u0e1c\u0e25 \u0033 \u0e15\u0e31\u0e27\u0e1a\u0e19 \u0032 \u0e15\u0e31\u0e27\u0e1a\u0e19 \u0e01\u0e31\u0e1a \u0032 \u0e15\u0e31\u0e27\u0e25\u0e48\u0e32\u0e07 \u0e15\u0e32\u0e21\u0e1f\u0e34\u0e25\u0e14\u0e4c\u0e17\u0e32\u0e07\u0e01\u0e32\u0e23';
const LAOS_HD_NUMBER_LABELS = {
  threeTop: '\u0033 \u0e15\u0e31\u0e27\u0e1a\u0e19',
  twoTop: '\u0032 \u0e15\u0e31\u0e27\u0e1a\u0e19',
  twoBottom: '\u0032 \u0e15\u0e31\u0e27\u0e25\u0e48\u0e32\u0e07'
};
const LAOS_EXTRA_NOTE = '\u0e15\u0e23\u0e27\u0e08\u0e08\u0e31\u0e1a\u0e08\u0e32\u0e01 API Lao Extra \u0e15\u0e23\u0e07 \u0e41\u0e25\u0e30\u0e43\u0e0a\u0e49\u0e1c\u0e25 \u0033 \u0e15\u0e31\u0e27\u0e1a\u0e19 \u0032 \u0e15\u0e31\u0e27\u0e1a\u0e19 \u0e01\u0e31\u0e1a \u0032 \u0e15\u0e31\u0e27\u0e25\u0e48\u0e32\u0e07 \u0e15\u0e32\u0e21\u0e1f\u0e34\u0e25\u0e14\u0e4c\u0e17\u0e32\u0e07\u0e01\u0e32\u0e23';
const LAOS_EXTRA_NUMBER_LABELS = {
  threeTop: '\u0033 \u0e15\u0e31\u0e27\u0e1a\u0e19',
  twoTop: '\u0032 \u0e15\u0e31\u0e27\u0e1a\u0e19',
  twoBottom: '\u0032 \u0e15\u0e31\u0e27\u0e25\u0e48\u0e32\u0e07'
};
const LAOS_STAR_NOTE = '\u0e15\u0e23\u0e27\u0e08\u0e08\u0e31\u0e1a\u0e08\u0e32\u0e01 API Lao Stars \u0e15\u0e23\u0e07 \u0e41\u0e25\u0e30\u0e43\u0e0a\u0e49\u0e1c\u0e25 \u0033 \u0e15\u0e31\u0e27\u0e1a\u0e19 \u0032 \u0e15\u0e31\u0e27\u0e1a\u0e19 \u0e01\u0e31\u0e1a \u0032 \u0e15\u0e31\u0e27\u0e25\u0e48\u0e32\u0e07 \u0e15\u0e32\u0e21\u0e1f\u0e34\u0e25\u0e14\u0e4c\u0e17\u0e32\u0e07\u0e01\u0e32\u0e23';
const LAOS_STAR_NUMBER_LABELS = {
  threeTop: '\u0033 \u0e15\u0e31\u0e27\u0e1a\u0e19',
  twoTop: '\u0032 \u0e15\u0e31\u0e27\u0e1a\u0e19',
  twoBottom: '\u0032 \u0e15\u0e31\u0e27\u0e25\u0e48\u0e32\u0e07'
};
const LAOS_STAR_VIP_NOTE = '\u0e15\u0e23\u0e27\u0e08\u0e08\u0e31\u0e1a\u0e08\u0e32\u0e01 API Lao Stars VIP \u0e15\u0e23\u0e07 \u0e41\u0e25\u0e30\u0e43\u0e0a\u0e49\u0e1c\u0e25 \u0033 \u0e15\u0e31\u0e27\u0e1a\u0e19 \u0032 \u0e15\u0e31\u0e27\u0e1a\u0e19 \u0e01\u0e31\u0e1a \u0032 \u0e15\u0e31\u0e27\u0e25\u0e48\u0e32\u0e07 \u0e15\u0e32\u0e21\u0e1f\u0e34\u0e25\u0e14\u0e4c\u0e17\u0e32\u0e07\u0e01\u0e32\u0e23';
const LAOS_STAR_VIP_NUMBER_LABELS = {
  threeTop: '\u0033 \u0e15\u0e31\u0e27\u0e1a\u0e19',
  twoTop: '\u0032 \u0e15\u0e31\u0e27\u0e1a\u0e19',
  twoBottom: '\u0032 \u0e15\u0e31\u0e27\u0e25\u0e48\u0e32\u0e07'
};
const LAOS_UNION_NOTE = '\u0e15\u0e23\u0e27\u0e08\u0e08\u0e31\u0e1a\u0e08\u0e32\u0e01 API Lao Union \u0e15\u0e23\u0e07 \u0e41\u0e25\u0e30\u0e43\u0e0a\u0e49\u0e1c\u0e25 \u0033 \u0e15\u0e31\u0e27\u0e1a\u0e19 \u0032 \u0e15\u0e31\u0e27\u0e1a\u0e19 \u0e01\u0e31\u0e1a \u0032 \u0e15\u0e31\u0e27\u0e25\u0e48\u0e32\u0e07 \u0e15\u0e32\u0e21\u0e1f\u0e34\u0e25\u0e14\u0e4c\u0e17\u0e32\u0e07\u0e01\u0e32\u0e23';
const LAOS_UNION_NUMBER_LABELS = {
  threeTop: '\u0033 \u0e15\u0e31\u0e27\u0e1a\u0e19',
  twoTop: '\u0032 \u0e15\u0e31\u0e27\u0e1a\u0e19',
  twoBottom: '\u0032 \u0e15\u0e31\u0e27\u0e25\u0e48\u0e32\u0e07'
};
const LAOS_UNION_VIP_NOTE = '\u0e15\u0e23\u0e27\u0e08\u0e08\u0e31\u0e1a\u0e08\u0e32\u0e01 API Lao Union VIP \u0e15\u0e23\u0e07 \u0e41\u0e25\u0e30\u0e43\u0e0a\u0e49\u0e1c\u0e25 \u0033 \u0e15\u0e31\u0e27\u0e1a\u0e19 \u0032 \u0e15\u0e31\u0e27\u0e1a\u0e19 \u0e01\u0e31\u0e1a \u0032 \u0e15\u0e31\u0e27\u0e25\u0e48\u0e32\u0e07 \u0e15\u0e32\u0e21\u0e1f\u0e34\u0e25\u0e14\u0e4c\u0e17\u0e32\u0e07\u0e01\u0e32\u0e23';
const LAOS_UNION_VIP_NUMBER_LABELS = {
  threeTop: '\u0033 \u0e15\u0e31\u0e27\u0e1a\u0e19',
  twoTop: '\u0032 \u0e15\u0e31\u0e27\u0e1a\u0e19',
  twoBottom: '\u0032 \u0e15\u0e31\u0e27\u0e25\u0e48\u0e32\u0e07'
};
const LAOS_ASEAN_NOTE = '\u0e15\u0e23\u0e27\u0e08\u0e08\u0e31\u0e1a\u0e08\u0e32\u0e01 API Lao ASEAN \u0e15\u0e23\u0e07 \u0e41\u0e25\u0e30\u0e43\u0e0a\u0e49\u0e1c\u0e25 \u0033 \u0e15\u0e31\u0e27\u0e1a\u0e19 \u0032 \u0e15\u0e31\u0e27\u0e1a\u0e19 \u0e01\u0e31\u0e1a \u0032 \u0e15\u0e31\u0e27\u0e25\u0e48\u0e32\u0e07 \u0e15\u0e32\u0e21\u0e1f\u0e34\u0e25\u0e14\u0e4c\u0e17\u0e32\u0e07\u0e01\u0e32\u0e23';
const LAOS_ASEAN_NUMBER_LABELS = {
  threeTop: '\u0033 \u0e15\u0e31\u0e27\u0e1a\u0e19',
  twoTop: '\u0032 \u0e15\u0e31\u0e27\u0e1a\u0e19',
  twoBottom: '\u0032 \u0e15\u0e31\u0e27\u0e25\u0e48\u0e32\u0e07'
};
const HSI_VIP_NOTE = 'Official HSI VIP results';
const HANOI_EXTRA_NOTE = '\u0e15\u0e23\u0e27\u0e08\u0e08\u0e31\u0e1a\u0e08\u0e32\u0e01 API Xoso Extra \u0e42\u0e14\u0e22\u0e43\u0e0a\u0e49\u0e23\u0e32\u0e07\u0e27\u0e31\u0e25\u0e1e\u0e34\u0e40\u0e28\u0e29 5 \u0e15\u0e31\u0e27\u0e40\u0e1b\u0e47\u0e19\u0e10\u0e32\u0e19\u0e43\u0e19\u0e01\u0e32\u0e23\u0e41\u0e1b\u0e25\u0e07 3 \u0e15\u0e31\u0e27\u0e1a\u0e19 2 \u0e15\u0e31\u0e27\u0e1a\u0e19 \u0e41\u0e25\u0e30 2 \u0e15\u0e31\u0e27\u0e25\u0e48\u0e32\u0e07';
const HANOI_EXTRA_NUMBER_LABELS = {
  threeTop: '\u0033 \u0e15\u0e31\u0e27\u0e1a\u0e19',
  twoTop: '\u0032 \u0e15\u0e31\u0e27\u0e1a\u0e19',
  twoBottom: '\u0032 \u0e15\u0e31\u0e27\u0e25\u0e48\u0e32\u0e07'
};
const HANOI_STAR_NOTE = '\u0e15\u0e23\u0e27\u0e08\u0e08\u0e31\u0e1a\u0e08\u0e32\u0e01\u0e2b\u0e19\u0e49\u0e32\u0e1c\u0e25 Minh Ngoc Star \u0e1c\u0e48\u0e32\u0e19 Exphuay \u0e42\u0e14\u0e22\u0e43\u0e0a\u0e49\u0e1c\u0e25 5 \u0e15\u0e31\u0e27\u0e08\u0e32\u0e01 prize 1 \u0e41\u0e25\u0e30 2 \u0e15\u0e31\u0e27\u0e25\u0e48\u0e32\u0e07 \u0e21\u0e32\u0e41\u0e1b\u0e25\u0e07\u0e40\u0e1b\u0e47\u0e19 3 \u0e15\u0e31\u0e27\u0e1a\u0e19 2 \u0e15\u0e31\u0e27\u0e1a\u0e19 \u0e41\u0e25\u0e30 2 \u0e15\u0e31\u0e27\u0e25\u0e48\u0e32\u0e07 \u0e15\u0e32\u0e21\u0e01\u0e15\u0e34\u0e01\u0e32 Hanoi \u0e02\u0e2d\u0e07\u0e23\u0e30\u0e1a\u0e1a';
const HANOI_STAR_NUMBER_LABELS = {
  threeTop: '\u0033 \u0e15\u0e31\u0e27\u0e1a\u0e19',
  twoTop: '\u0032 \u0e15\u0e31\u0e27\u0e1a\u0e19',
  twoBottom: '\u0032 \u0e15\u0e31\u0e27\u0e25\u0e48\u0e32\u0e07'
};
const HANOI_DEVELOP_NOTE = '\u0e15\u0e23\u0e27\u0e08\u0e08\u0e31\u0e1a\u0e08\u0e32\u0e01 API Xoso Develop \u0e42\u0e14\u0e22\u0e43\u0e0a\u0e49\u0e1c\u0e25 5 \u0e15\u0e31\u0e27\u0e08\u0e32\u0e01 prize 1 \u0e41\u0e25\u0e30 prize 2 \u0e21\u0e32\u0e41\u0e1b\u0e25\u0e07\u0e40\u0e1b\u0e47\u0e19 3 \u0e15\u0e31\u0e27\u0e1a\u0e19 2 \u0e15\u0e31\u0e27\u0e1a\u0e19 \u0e41\u0e25\u0e30 2 \u0e15\u0e31\u0e27\u0e25\u0e48\u0e32\u0e07 \u0e15\u0e32\u0e21\u0e01\u0e15\u0e34\u0e01\u0e32 Hanoi \u0e02\u0e2d\u0e07\u0e23\u0e30\u0e1a\u0e1a';
const HANOI_DEVELOP_NUMBER_LABELS = {
  threeTop: '\u0033 \u0e15\u0e31\u0e27\u0e1a\u0e19',
  twoTop: '\u0032 \u0e15\u0e31\u0e27\u0e1a\u0e19',
  twoBottom: '\u0032 \u0e15\u0e31\u0e27\u0e25\u0e48\u0e32\u0e07'
};
const HANOI_HD_NOTE = '\u0e15\u0e23\u0e27\u0e08\u0e08\u0e31\u0e1a\u0e08\u0e32\u0e01 API Xoso HD \u0e42\u0e14\u0e22\u0e43\u0e0a\u0e49\u0e1c\u0e25 5 \u0e15\u0e31\u0e27\u0e08\u0e32\u0e01 prize 1 \u0e41\u0e25\u0e30 prize 2 \u0e21\u0e32\u0e41\u0e1b\u0e25\u0e07\u0e40\u0e1b\u0e47\u0e19 3 \u0e15\u0e31\u0e27\u0e1a\u0e19 2 \u0e15\u0e31\u0e27\u0e1a\u0e19 \u0e41\u0e25\u0e30 2 \u0e15\u0e31\u0e27\u0e25\u0e48\u0e32\u0e07 \u0e15\u0e32\u0e21\u0e01\u0e15\u0e34\u0e01\u0e32 Hanoi \u0e02\u0e2d\u0e07\u0e23\u0e30\u0e1a\u0e1a';
const HANOI_HD_NUMBER_LABELS = {
  threeTop: '\u0033 \u0e15\u0e31\u0e27\u0e1a\u0e19',
  twoTop: '\u0032 \u0e15\u0e31\u0e27\u0e1a\u0e19',
  twoBottom: '\u0032 \u0e15\u0e31\u0e27\u0e25\u0e48\u0e32\u0e07'
};
const HANOI_TV_NOTE = '\u0e15\u0e23\u0e27\u0e08\u0e08\u0e31\u0e1a\u0e08\u0e32\u0e01 API Minh Ngoc TV \u0e42\u0e14\u0e22\u0e43\u0e0a\u0e49\u0e1c\u0e25 5 \u0e15\u0e31\u0e27\u0e08\u0e32\u0e01 prize 1 \u0e41\u0e25\u0e30 prize 2 \u0e21\u0e32\u0e41\u0e1b\u0e25\u0e07\u0e40\u0e1b\u0e47\u0e19 3 \u0e15\u0e31\u0e27\u0e1a\u0e19 2 \u0e15\u0e31\u0e27\u0e1a\u0e19 \u0e41\u0e25\u0e30 2 \u0e15\u0e31\u0e27\u0e25\u0e48\u0e32\u0e07 \u0e15\u0e32\u0e21\u0e01\u0e15\u0e34\u0e01\u0e32 Hanoi \u0e02\u0e2d\u0e07\u0e23\u0e30\u0e1a\u0e1a';
const HANOI_TV_NUMBER_LABELS = {
  threeTop: '\u0033 \u0e15\u0e31\u0e27\u0e1a\u0e19',
  twoTop: '\u0032 \u0e15\u0e31\u0e27\u0e1a\u0e19',
  twoBottom: '\u0032 \u0e15\u0e31\u0e27\u0e25\u0e48\u0e32\u0e07'
};
const HANOI_REDCROSS_NOTE = '\u0e15\u0e23\u0e27\u0e08\u0e08\u0e31\u0e1a\u0e08\u0e32\u0e01 API Xoso Redcross \u0e42\u0e14\u0e22\u0e43\u0e0a\u0e49\u0e1c\u0e25 5 \u0e15\u0e31\u0e27\u0e08\u0e32\u0e01 prize 1 \u0e41\u0e25\u0e30 prize 2 \u0e21\u0e32\u0e41\u0e1b\u0e25\u0e07\u0e40\u0e1b\u0e47\u0e19 3 \u0e15\u0e31\u0e27\u0e1a\u0e19 2 \u0e15\u0e31\u0e27\u0e1a\u0e19 \u0e41\u0e25\u0e30 2 \u0e15\u0e31\u0e27\u0e25\u0e48\u0e32\u0e07 \u0e15\u0e32\u0e21\u0e01\u0e15\u0e34\u0e01\u0e32 Hanoi \u0e02\u0e2d\u0e07\u0e23\u0e30\u0e1a\u0e1a';
const HANOI_REDCROSS_NUMBER_LABELS = {
  threeTop: '\u0033 \u0e15\u0e31\u0e27\u0e1a\u0e19',
  twoTop: '\u0032 \u0e15\u0e31\u0e27\u0e1a\u0e19',
  twoBottom: '\u0032 \u0e15\u0e31\u0e27\u0e25\u0e48\u0e32\u0e07'
};
const HANOI_UNION_NOTE = '\u0e15\u0e23\u0e27\u0e08\u0e08\u0e31\u0e1a\u0e08\u0e32\u0e01 API Xoso Union \u0e42\u0e14\u0e22\u0e43\u0e0a\u0e49\u0e1c\u0e25 5 \u0e15\u0e31\u0e27\u0e08\u0e32\u0e01 prize 1 \u0e41\u0e25\u0e30 prize 2 \u0e21\u0e32\u0e41\u0e1b\u0e25\u0e07\u0e40\u0e1b\u0e47\u0e19 3 \u0e15\u0e31\u0e27\u0e1a\u0e19 2 \u0e15\u0e31\u0e27\u0e1a\u0e19 \u0e41\u0e25\u0e30 2 \u0e15\u0e31\u0e27\u0e25\u0e48\u0e32\u0e07 \u0e15\u0e32\u0e21\u0e01\u0e15\u0e34\u0e01\u0e32 Hanoi \u0e02\u0e2d\u0e07\u0e23\u0e30\u0e1a\u0e1a';
const HANOI_UNION_NUMBER_LABELS = {
  threeTop: '\u0033 \u0e15\u0e31\u0e27\u0e1a\u0e19',
  twoTop: '\u0032 \u0e15\u0e31\u0e27\u0e1a\u0e19',
  twoBottom: '\u0032 \u0e15\u0e31\u0e27\u0e25\u0e48\u0e32\u0e07'
};
const HANOI_ASEAN_NOTE = '\u0e15\u0e23\u0e27\u0e08\u0e08\u0e31\u0e1a\u0e08\u0e32\u0e01 API Hanoi ASEAN \u0e42\u0e14\u0e22\u0e43\u0e0a\u0e49\u0e1c\u0e25 5 \u0e15\u0e31\u0e27\u0e08\u0e32\u0e01 prize 1 \u0e41\u0e25\u0e30 prize 2 \u0e21\u0e32\u0e41\u0e1b\u0e25\u0e07\u0e40\u0e1b\u0e47\u0e19 3 \u0e15\u0e31\u0e27\u0e1a\u0e19 2 \u0e15\u0e31\u0e27\u0e1a\u0e19 \u0e41\u0e25\u0e30 2 \u0e15\u0e31\u0e27\u0e25\u0e48\u0e32\u0e07 \u0e15\u0e32\u0e21\u0e01\u0e15\u0e34\u0e01\u0e32 Hanoi \u0e02\u0e2d\u0e07\u0e23\u0e30\u0e1a\u0e1a';
const HANOI_ASEAN_NUMBER_LABELS = {
  threeTop: '\u0033 \u0e15\u0e31\u0e27\u0e1a\u0e19',
  twoTop: '\u0032 \u0e15\u0e31\u0e27\u0e1a\u0e19',
  twoBottom: '\u0032 \u0e15\u0e31\u0e27\u0e25\u0e48\u0e32\u0e07'
};
const SHENZHEN_INDEX_VIP_NOTE = 'Official Shenzhen Index VIP results';
const NIKKEI_VIP_NOTE = 'Official Nikkei VIP Stock results';
const LOTTO_SUPER_RICH_VIP_NOTE = 'Official Lotto Super Rich VIP results';
const KOREA_VIP_NOTE = 'Official KTop VIP Index results';
const TAIWAN_VIP_NOTE = 'Official TSEC VIP Index results';
const SINGAPORE_VIP_NOTE = 'Official Stocks VIP results';
const DOWJONES_VIP_NOTE = 'Official Dow Jones Powerball results';

const cache = {
  data: null,
  fetchedAt: 0
};
const MARKET_OVERVIEW_SNAPSHOT_KEY = 'default';

const MANYCAI_MARKETS = [
  { code: 'hnvip', marketId: 'hanoi-vip', name: 'ฮานอย VIP', sectionId: 'international', type: 'standard' },
  { code: 'bfhn', marketId: 'hanoi-special', name: 'ฮานอยพิเศษ', sectionId: 'international', type: 'standard' },
  { code: 'cqhn', marketId: 'hanoi-specific', name: 'ฮานอยเฉพาะกิจ', sectionId: 'international', type: 'standard' },
  { code: 'tlzc', marketId: 'lao', name: 'หวยลาว', sectionId: 'international', type: 'standard' },
  { code: 'zcvip', marketId: 'lao-vip', name: 'หวยลาว VIP', sectionId: 'international', type: 'standard' },
  { code: 'ynhn', marketId: 'hanoi-normal', name: 'ฮานอยธรรมดา', sectionId: 'international', type: 'standard' },
  { code: 'ynma', marketId: 'malay', name: 'มาเลย์', sectionId: 'international', type: 'standard' },
  { code: 'tykc', marketId: 'yeekee-vip', name: 'จับยี่กี VIP', sectionId: 'international', type: 'standard' },
  { code: 'gsth', marketId: 'stock-thai', name: 'หุ้นไทย', sectionId: 'stocks', type: 'stock' },
  { code: 'gshka', marketId: 'stock-hangseng-morning', name: 'ฮั่งเส็งเช้า', sectionId: 'stocks', type: 'stock' },
  { code: 'gshkp', marketId: 'stock-hangseng-afternoon', name: 'ฮั่งเส็งบ่าย', sectionId: 'stocks', type: 'stock' },
  { code: 'gstw', marketId: 'stock-taiwan', name: 'หุ้นไต้หวัน', sectionId: 'stocks', type: 'stock' },
  { code: 'gsjpa', marketId: 'stock-nikkei-morning', name: 'นิเคอิเช้า', sectionId: 'stocks', type: 'stock' },
  { code: 'gsjpp', marketId: 'stock-nikkei-afternoon', name: 'นิเคอิบ่าย', sectionId: 'stocks', type: 'stock' },
  { code: 'gskr', marketId: 'stock-korea', name: 'หุ้นเกาหลี', sectionId: 'stocks', type: 'stock' },
  { code: 'gscna', marketId: 'stock-china-morning', name: 'หุ้นจีนเช้า', sectionId: 'stocks', type: 'stock' },
  { code: 'gscnp', marketId: 'stock-china-afternoon', name: 'หุ้นจีนบ่าย', sectionId: 'stocks', type: 'stock' },
  { code: 'gssg', marketId: 'stock-singapore', name: 'หุ้นสิงคโปร์', sectionId: 'stocks', type: 'stock' },
  { code: 'gsin', marketId: 'stock-india', name: 'หุ้นอินเดีย', sectionId: 'stocks', type: 'stock' },
  { code: 'gseg', marketId: 'stock-egypt', name: 'หุ้นอียิปต์', sectionId: 'stocks', type: 'stock' },
  { code: 'gsru', marketId: 'stock-russia', name: 'หุ้นรัสเซีย', sectionId: 'stocks', type: 'stock' },
  { code: 'gsde', marketId: 'stock-germany', name: 'หุ้นเยอรมัน', sectionId: 'stocks', type: 'stock' },
  { code: 'gsuk', marketId: 'stock-england', name: 'หุ้นอังกฤษ', sectionId: 'stocks', type: 'stock' },
  { code: 'gsus', marketId: 'stock-dowjones', name: 'หุ้นดาวโจนส์', sectionId: 'stocks', type: 'stock' }
];

const ACTIVE_MANYCAI_MARKETS = MANYCAI_MARKETS.filter(
  (market) => !['tlzc', 'zcvip', 'gsus'].includes(market.code)
);
const MANYCAI_MARKET_BY_ID = new Map(MANYCAI_MARKETS.map((market) => [market.marketId, market]));

const ROUND_CODE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;
const withMarketIdAliases = (mapping) => Object.entries(mapping).reduce((acc, [key, value]) => {
  acc[key] = value;

  const kebabKey = String(key).replace(/_/g, '-');
  const snakeKey = String(key).replace(/-/g, '_');
  acc[kebabKey] = value;
  acc[snakeKey] = value;

  return acc;
}, {});

const MARKET_ID_TO_LOTTERY_CODE = withMarketIdAliases({
  ...Object.fromEntries(MANYCAI_MARKETS.map((market) => [market.marketId, market.code])),
  'hanoi-special': 'hanoi_special',
  'stock-nikkei-morning': 'nikkei_morning',
  'stock-china-afternoon': 'china_afternoon',
  'stock-dowjones': 'dowjones_vip',
  [THAI_GOV_MARKET_ID]: 'thai_government',
  [BAAC_MARKET_ID]: 'baac',
  [GSB_MARKET_ID]: 'gsb',
  lao: 'tlzc',
  'lao-vip': 'lao_vip',
  [LAOS_PATHANA_MARKET_ID]: 'lao_pathana',
  [LAOS_REDCROSS_MARKET_ID]: 'lao_redcross',
  [LAOS_TV_MARKET_ID]: 'lao_tv',
  [LAOS_HD_MARKET_ID]: 'lao_hd',
  [LAOS_EXTRA_MARKET_ID]: 'lao_extra',
  [LAOS_STAR_MARKET_ID]: 'lao_star',
  [LAOS_STAR_VIP_MARKET_ID]: 'lao_star_vip',
  [LAOS_UNION_MARKET_ID]: 'lao_union',
  [LAOS_UNION_VIP_MARKET_ID]: 'lao_union_vip',
  [LAOS_ASEAN_MARKET_ID]: 'lao_asean',
  [HANOI_EXTRA_MARKET_ID]: 'hanoi_extra',
  [HANOI_STAR_MARKET_ID]: 'hanoi_star',
  [HANOI_DEVELOP_MARKET_ID]: 'hanoi_develop',
  [HANOI_HD_MARKET_ID]: 'hanoi_hd',
  [HANOI_TV_MARKET_ID]: 'hanoi_tv',
  [HANOI_REDCROSS_MARKET_ID]: 'hanoi_redcross',
  [HANOI_UNION_MARKET_ID]: 'hanoi_union',
  [HANOI_ASEAN_MARKET_ID]: 'hanoi_asean',
  [CHINA_MORNING_VIP_MARKET_ID]: 'china_morning_vip',
  [CHINA_AFTERNOON_VIP_MARKET_ID]: 'china_afternoon_vip',
  [HSI_MORNING_VIP_MARKET_ID]: 'hsi_morning_vip',
  [HSI_AFTERNOON_VIP_MARKET_ID]: 'hsi_afternoon_vip',
  [NIKKEI_MORNING_VIP_MARKET_ID]: 'nikkei_morning_vip',
  [NIKKEI_AFTERNOON_VIP_MARKET_ID]: 'nikkei_afternoon_vip',
  [ENGLAND_VIP_MARKET_ID]: 'england_vip',
  [GERMANY_VIP_MARKET_ID]: 'germany_vip',
  [RUSSIA_VIP_MARKET_ID]: 'russia_vip',
  [KOREA_VIP_MARKET_ID]: 'korea_vip',
  [TAIWAN_VIP_MARKET_ID]: 'taiwan_vip',
  [SINGAPORE_VIP_MARKET_ID]: 'singapore_vip',
  [DOWJONES_VIP_MARKET_ID]: 'dowjones_vip'
});

const resolveMarketLotteryCode = (marketId) =>
  MARKET_ID_TO_LOTTERY_CODE[marketId] || normalizeLotteryCode(marketId);

const LOTTERY_CODE_TO_LEAGUE_CODE = new Map([
  ...LOTTERY_TYPES.map((lottery) => [lottery.code, lottery.leagueCode]),
  ['hsi_morning_vip', 'vip'],
  ['hsi_afternoon_vip', 'vip']
]);
const DISPLAY_SECTION_BY_LEAGUE_CODE = {
  government: 'government',
  foreign: 'international',
  daily: 'daily',
  vip: 'stock-vip',
  stocks: 'stocks'
};
const DISPLAY_SECTION_BY_SOURCE_SECTION = {
  government: 'government',
  international: 'international',
  stocks: 'stocks'
};
const DISPLAY_SECTIONS = [
  {
    id: 'government',
    title: 'รัฐบาลไทย',
    description: 'ผลรัฐบาลไทย ธกส และออมสิน'
  },
  {
    id: 'international',
    title: 'หวยต่างประเทศ',
    description: 'ผลหวยต่างประเทศกลุ่มฮานอยและตลาดต่างประเทศ'
  },
  {
    id: 'daily',
    title: 'หวยรายวัน',
    description: 'ผลหวยรายวันที่ออกรอบประจำ'
  },
  {
    id: 'stock-vip',
    title: 'หุ้น VIP',
    description: 'ผลหวยหุ้น VIP จากแหล่งข้อมูลทางการ'
  },
  {
    id: 'stocks',
    title: 'หุ้น',
    description: 'ผลหวยหุ้นทั่วไป'
  }
];

const resolveDisplaySectionId = (market, sourceSectionId) => {
  const lotteryCode = resolveMarketLotteryCode(market?.id);
  const leagueCode = LOTTERY_CODE_TO_LEAGUE_CODE.get(lotteryCode);

  if (leagueCode === 'vip') {
    const marketId = String(market?.id || '');
    return sourceSectionId === 'stocks' || marketId.startsWith('stock-')
      ? 'stock-vip'
      : DISPLAY_SECTION_BY_SOURCE_SECTION[sourceSectionId] || 'international';
  }

  return DISPLAY_SECTION_BY_LEAGUE_CODE[leagueCode]
    || DISPLAY_SECTION_BY_SOURCE_SECTION[sourceSectionId]
    || 'international';
};

const groupSectionsForDisplay = (sections = []) => {
  const grouped = DISPLAY_SECTIONS.map((section) => ({
    ...section,
    markets: []
  }));
  const groupedById = new Map(grouped.map((section) => [section.id, section]));
  const seenMarketIds = new Set();

  (sections || []).forEach((section) => {
    (section.markets || []).forEach((market) => {
      const marketKey = market?.id || `${section.id}:${market?.name || ''}`;
      if (seenMarketIds.has(marketKey)) {
        return;
      }

      seenMarketIds.add(marketKey);
      const displaySectionId = resolveDisplaySectionId(market, section.id);
      const displaySection = groupedById.get(displaySectionId) || groupedById.get('international');
      displaySection.markets.push(market);
    });
  });

  return grouped.filter((section) => section.markets.length > 0);
};

const baseSections = [
  {
    id: 'government',
    title: 'รัฐบาล',
    description: 'หวยรัฐบาลและสลากออมทรัพย์',
    markets: [
      { id: THAI_GOV_MARKET_ID, name: THAI_GOV_MARKET_NAME, provider: THAI_GOV_PROVIDER_NAME, status: 'waiting', resultDate: '', headline: '', numbers: [], note: 'รอข้อมูลจาก GLO Official' },
      { id: BAAC_MARKET_ID, name: BAAC_MARKET_NAME, provider: BAAC_PROVIDER_NAME, status: 'waiting', resultDate: '', headline: '', numbers: [], note: 'รอข้อมูลจาก BAAC Official' },
      { id: GSB_MARKET_ID, name: GSB_MARKET_NAME, provider: GSB_PROVIDER_NAME, status: 'waiting', resultDate: '', headline: '', numbers: [], note: 'รอข้อมูลจากเว็บไซต์ GSB' }
    ]
  },
  {
    id: 'international',
    title: 'หวยต่างประเทศ',
    description: 'ข้อมูลจาก ManyCai',
    markets: [
      { id: 'hanoi-vip', name: 'ฮานอย VIP', provider: PROVIDER_NAME, status: 'waiting', resultDate: '', headline: '', numbers: [], note: 'รอข้อมูลจากผู้ให้บริการ' },
      { id: 'hanoi-special', name: 'ฮานอยพิเศษ', provider: PROVIDER_NAME, status: 'waiting', resultDate: '', headline: '', numbers: [], note: 'รอข้อมูลจากผู้ให้บริการ' },
      { id: 'hanoi-specific', name: 'ฮานอยเฉพาะกิจ', provider: PROVIDER_NAME, status: 'waiting', resultDate: '', headline: '', numbers: [], note: 'รอข้อมูลจากผู้ให้บริการ' },
      { id: 'lao', name: 'หวยลาว', provider: PROVIDER_NAME, status: 'waiting', resultDate: '', headline: '', numbers: [], note: 'รอข้อมูลจากผู้ให้บริการ' },
      { id: 'lao-vip', name: 'หวยลาว VIP', provider: PROVIDER_NAME, status: 'waiting', resultDate: '', headline: '', numbers: [], note: 'รอข้อมูลจากผู้ให้บริการ' },
      { id: 'hanoi-normal', name: 'ฮานอยธรรมดา', provider: PROVIDER_NAME, status: 'waiting', resultDate: '', headline: '', numbers: [], note: 'รอข้อมูลจากผู้ให้บริการ' },
      { id: 'malay', name: 'มาเลย์', provider: PROVIDER_NAME, status: 'waiting', resultDate: '', headline: '', numbers: [], note: 'รอข้อมูลจากผู้ให้บริการ' },
      { id: 'yeekee-vip', name: 'จับยี่กี VIP', provider: PROVIDER_NAME, status: 'waiting', resultDate: '', headline: '', numbers: [], note: 'รอข้อมูลจากผู้ให้บริการ' }
    ]
  },
  {
    id: 'stocks',
    title: 'หุ้น',
    description: 'ข้อมูลหุ้นจาก ManyCai',
    markets: [
      { id: 'stock-thai', name: 'หุ้นไทย', provider: PROVIDER_NAME, status: 'waiting', resultDate: '', headline: '', numbers: [], note: 'รอข้อมูลจากผู้ให้บริการ' },
      { id: 'stock-hangseng-morning', name: 'ฮั่งเส็งเช้า', provider: PROVIDER_NAME, status: 'waiting', resultDate: '', headline: '', numbers: [], note: 'รอข้อมูลจากผู้ให้บริการ' },
      { id: 'stock-hangseng-afternoon', name: 'ฮั่งเส็งบ่าย', provider: PROVIDER_NAME, status: 'waiting', resultDate: '', headline: '', numbers: [], note: 'รอข้อมูลจากผู้ให้บริการ' },
      { id: 'stock-taiwan', name: 'หุ้นไต้หวัน', provider: PROVIDER_NAME, status: 'waiting', resultDate: '', headline: '', numbers: [], note: 'รอข้อมูลจากผู้ให้บริการ' },
      { id: 'stock-nikkei-morning', name: 'นิเคอิเช้า', provider: PROVIDER_NAME, status: 'waiting', resultDate: '', headline: '', numbers: [], note: 'รอข้อมูลจากผู้ให้บริการ' },
      { id: 'stock-nikkei-afternoon', name: 'นิเคอิบ่าย', provider: PROVIDER_NAME, status: 'waiting', resultDate: '', headline: '', numbers: [], note: 'รอข้อมูลจากผู้ให้บริการ' },
      { id: 'stock-korea', name: 'หุ้นเกาหลี', provider: PROVIDER_NAME, status: 'waiting', resultDate: '', headline: '', numbers: [], note: 'รอข้อมูลจากผู้ให้บริการ' },
      { id: 'stock-china-morning', name: 'หุ้นจีนเช้า', provider: PROVIDER_NAME, status: 'waiting', resultDate: '', headline: '', numbers: [], note: 'รอข้อมูลจากผู้ให้บริการ' },
      { id: 'stock-china-afternoon', name: 'หุ้นจีนบ่าย', provider: PROVIDER_NAME, status: 'waiting', resultDate: '', headline: '', numbers: [], note: 'รอข้อมูลจากผู้ให้บริการ' },
      { id: 'stock-singapore', name: 'หุ้นสิงคโปร์', provider: PROVIDER_NAME, status: 'waiting', resultDate: '', headline: '', numbers: [], note: 'รอข้อมูลจากผู้ให้บริการ' },
      { id: 'stock-india', name: 'หุ้นอินเดีย', provider: PROVIDER_NAME, status: 'waiting', resultDate: '', headline: '', numbers: [], note: 'รอข้อมูลจากผู้ให้บริการ' },
      { id: 'stock-egypt', name: 'หุ้นอียิปต์', provider: PROVIDER_NAME, status: 'waiting', resultDate: '', headline: '', numbers: [], note: 'รอข้อมูลจากผู้ให้บริการ' },
      { id: 'stock-russia', name: 'หุ้นรัสเซีย', provider: PROVIDER_NAME, status: 'waiting', resultDate: '', headline: '', numbers: [], note: 'รอข้อมูลจากผู้ให้บริการ' },
      { id: 'stock-germany', name: 'หุ้นเยอรมัน', provider: PROVIDER_NAME, status: 'waiting', resultDate: '', headline: '', numbers: [], note: 'รอข้อมูลจากผู้ให้บริการ' },
      { id: 'stock-england', name: 'หุ้นอังกฤษ', provider: PROVIDER_NAME, status: 'waiting', resultDate: '', headline: '', numbers: [], note: 'รอข้อมูลจากผู้ให้บริการ' },
      { id: 'stock-dowjones', name: 'หุ้นดาวโจนส์', provider: PROVIDER_NAME, status: 'waiting', resultDate: '', headline: '', numbers: [], note: 'รอข้อมูลจากผู้ให้บริการ' }
    ]
  }
];

baseSections.find((section) => section.id === 'international')?.markets.splice(5, 0, {
  id: 'hanoi-extra',
  name: HANOI_EXTRA_MARKET_NAME,
  provider: HANOI_EXTRA_PROVIDER_NAME,
  status: 'waiting',
  resultDate: '',
  headline: '',
  numbers: [],
  note: '\u0e23\u0e2d\u0e02\u0e49\u0e2d\u0e21\u0e39\u0e25\u0e08\u0e32\u0e01 API Xoso Extra'
});

baseSections.find((section) => section.id === 'international')?.markets.splice(6, 0, {
  id: 'hanoi-star',
  name: HANOI_STAR_MARKET_NAME,
  provider: HANOI_STAR_PROVIDER_NAME,
  status: 'waiting',
  resultDate: '',
  headline: '',
  numbers: [],
    note: '\u0e23\u0e2d\u0e02\u0e49\u0e2d\u0e21\u0e39\u0e25\u0e08\u0e32\u0e01 Exphuay Minh Ngoc Star'
});

baseSections.find((section) => section.id === 'international')?.markets.splice(7, 0, {
  id: 'hanoi-develop',
  name: HANOI_DEVELOP_MARKET_NAME,
  provider: HANOI_DEVELOP_PROVIDER_NAME,
  status: 'waiting',
  resultDate: '',
  headline: '',
  numbers: [],
  note: '\u0e23\u0e2d\u0e02\u0e49\u0e2d\u0e21\u0e39\u0e25\u0e08\u0e32\u0e01 API Xoso Develop'
});

baseSections.find((section) => section.id === 'international')?.markets.splice(8, 0, {
  id: 'hanoi-hd',
  name: HANOI_HD_MARKET_NAME,
  provider: HANOI_HD_PROVIDER_NAME,
  status: 'waiting',
  resultDate: '',
  headline: '',
  numbers: [],
  note: '\u0e23\u0e2d\u0e02\u0e49\u0e2d\u0e21\u0e39\u0e25\u0e08\u0e32\u0e01 API Xoso HD'
});

baseSections.find((section) => section.id === 'international')?.markets.splice(9, 0, {
  id: 'hanoi-tv',
  name: HANOI_TV_MARKET_NAME,
  provider: HANOI_TV_PROVIDER_NAME,
  status: 'waiting',
  resultDate: '',
  headline: '',
  numbers: [],
  note: '\u0e23\u0e2d\u0e02\u0e49\u0e2d\u0e21\u0e39\u0e25\u0e08\u0e32\u0e01 API Minh Ngoc TV'
});

baseSections.find((section) => section.id === 'international')?.markets.splice(10, 0, {
  id: 'hanoi-redcross',
  name: HANOI_REDCROSS_MARKET_NAME,
  provider: HANOI_REDCROSS_PROVIDER_NAME,
  status: 'waiting',
  resultDate: '',
  headline: '',
  numbers: [],
  note: '\u0e23\u0e2d\u0e02\u0e49\u0e2d\u0e21\u0e39\u0e25\u0e08\u0e32\u0e01 API Xoso Redcross'
});

baseSections.find((section) => section.id === 'international')?.markets.splice(11, 0, {
  id: 'hanoi-union',
  name: HANOI_UNION_MARKET_NAME,
  provider: HANOI_UNION_PROVIDER_NAME,
  status: 'waiting',
  resultDate: '',
  headline: '',
  numbers: [],
  note: '\u0e23\u0e2d\u0e02\u0e49\u0e2d\u0e21\u0e39\u0e25\u0e08\u0e32\u0e01 API Xoso Union'
});

baseSections.find((section) => section.id === 'international')?.markets.splice(12, 0, {
  id: 'hanoi-asean',
  name: HANOI_ASEAN_MARKET_NAME,
  provider: HANOI_ASEAN_PROVIDER_NAME,
  status: 'waiting',
  resultDate: '',
  headline: '',
  numbers: [],
  note: '\u0e23\u0e2d\u0e02\u0e49\u0e2d\u0e21\u0e39\u0e25\u0e08\u0e32\u0e01 API Hanoi ASEAN'
});

baseSections.find((section) => section.id === 'international')?.markets.splice(6, 0, {
  id: 'lao-pathana',
  name: LAOS_PATHANA_MARKET_NAME,
  provider: LAOS_PATHANA_PROVIDER_NAME,
  status: 'waiting',
  resultDate: '',
  headline: '',
  numbers: [],
  note: 'รอข้อมูลจากเว็บไซต์ Lao Pathana'
});

{
  const internationalSection = baseSections.find((section) => section.id === 'international');
  const insertAt = Math.max(0, (internationalSection?.markets || []).findIndex((market) => market.id === 'lao-pathana') + 1);
  internationalSection?.markets.splice(insertAt, 0, {
    id: 'lao-redcross',
    name: LAOS_REDCROSS_MARKET_NAME,
    provider: LAOS_REDCROSS_PROVIDER_NAME,
    status: 'waiting',
    resultDate: '',
    headline: '',
    numbers: [],
    note: '\u0e23\u0e2d\u0e02\u0e49\u0e2d\u0e21\u0e39\u0e25\u0e08\u0e32\u0e01 API Lao Red Cross'
  });
}

{
  const internationalSection = baseSections.find((section) => section.id === 'international');
  const insertAt = Math.max(0, (internationalSection?.markets || []).findIndex((market) => market.id === 'lao-redcross') + 1);
  internationalSection?.markets.splice(insertAt, 0, {
    id: 'lao-tv',
    name: LAOS_TV_MARKET_NAME,
    provider: LAOS_TV_PROVIDER_NAME,
    status: 'waiting',
    resultDate: '',
    headline: '',
    numbers: [],
    note: '\u0e23\u0e2d\u0e02\u0e49\u0e2d\u0e21\u0e39\u0e25\u0e08\u0e32\u0e01 API Lao TV'
  });
}

{
  const internationalSection = baseSections.find((section) => section.id === 'international');
  const insertAt = Math.max(0, (internationalSection?.markets || []).findIndex((market) => market.id === 'lao-tv') + 1);
  internationalSection?.markets.splice(insertAt, 0, {
    id: 'lao-hd',
    name: LAOS_HD_MARKET_NAME,
    provider: LAOS_HD_PROVIDER_NAME,
    status: 'waiting',
    resultDate: '',
    headline: '',
    numbers: [],
    note: '\u0e23\u0e2d\u0e02\u0e49\u0e2d\u0e21\u0e39\u0e25\u0e08\u0e32\u0e01 API Lao HD'
  });
}

{
  const internationalSection = baseSections.find((section) => section.id === 'international');
  const insertAt = Math.max(0, (internationalSection?.markets || []).findIndex((market) => market.id === 'lao-hd') + 1);
  internationalSection?.markets.splice(insertAt, 0, {
    id: 'lao-extra',
    name: LAOS_EXTRA_MARKET_NAME,
    provider: LAOS_EXTRA_PROVIDER_NAME,
    status: 'waiting',
    resultDate: '',
    headline: '',
    numbers: [],
    note: '\u0e23\u0e2d\u0e02\u0e49\u0e2d\u0e21\u0e39\u0e25\u0e08\u0e32\u0e01 API Lao Extra'
  });
}

{
  const internationalSection = baseSections.find((section) => section.id === 'international');
  const insertAt = Math.max(0, (internationalSection?.markets || []).findIndex((market) => market.id === 'lao-extra') + 1);
  internationalSection?.markets.splice(insertAt, 0, {
    id: 'lao-star',
    name: LAOS_STAR_MARKET_NAME,
    provider: LAOS_STAR_PROVIDER_NAME,
    status: 'waiting',
    resultDate: '',
    headline: '',
    numbers: [],
    note: '\u0e23\u0e2d\u0e02\u0e49\u0e2d\u0e21\u0e39\u0e25\u0e08\u0e32\u0e01 API Lao Stars'
  });
}

{
  const internationalSection = baseSections.find((section) => section.id === 'international');
  const insertAt = Math.max(0, (internationalSection?.markets || []).findIndex((market) => market.id === 'lao-star') + 1);
  internationalSection?.markets.splice(insertAt, 0, {
    id: 'lao-star-vip',
    name: LAOS_STAR_VIP_MARKET_NAME,
    provider: LAOS_STAR_VIP_PROVIDER_NAME,
    status: 'waiting',
    resultDate: '',
    headline: '',
    numbers: [],
    note: '\u0e23\u0e2d\u0e02\u0e49\u0e2d\u0e21\u0e39\u0e25\u0e08\u0e32\u0e01 API Lao Stars VIP'
  });
}

{
  const internationalSection = baseSections.find((section) => section.id === 'international');
  const insertAt = Math.max(0, (internationalSection?.markets || []).findIndex((market) => market.id === 'lao-star-vip') + 1);
  internationalSection?.markets.splice(insertAt, 0, {
    id: 'lao-union',
    name: LAOS_UNION_MARKET_NAME,
    provider: LAOS_UNION_PROVIDER_NAME,
    status: 'waiting',
    resultDate: '',
    headline: '',
    numbers: [],
    note: '\u0e23\u0e2d\u0e02\u0e49\u0e2d\u0e21\u0e39\u0e25\u0e08\u0e32\u0e01 API Lao Union'
  });
}

{
  const internationalSection = baseSections.find((section) => section.id === 'international');
  const insertAt = Math.max(0, (internationalSection?.markets || []).findIndex((market) => market.id === 'lao-union') + 1);
  internationalSection?.markets.splice(insertAt, 0, {
    id: 'lao-union-vip',
    name: LAOS_UNION_VIP_MARKET_NAME,
    provider: LAOS_UNION_VIP_PROVIDER_NAME,
    status: 'waiting',
    resultDate: '',
    headline: '',
    numbers: [],
    note: '\u0e23\u0e2d\u0e02\u0e49\u0e2d\u0e21\u0e39\u0e25\u0e08\u0e32\u0e01 API Lao Union VIP'
  });
}

{
  const internationalSection = baseSections.find((section) => section.id === 'international');
  const insertAt = Math.max(0, (internationalSection?.markets || []).findIndex((market) => market.id === 'lao-union-vip') + 1);
  internationalSection?.markets.splice(insertAt, 0, {
    id: 'lao-asean',
    name: LAOS_ASEAN_MARKET_NAME,
    provider: LAOS_ASEAN_PROVIDER_NAME,
    status: 'waiting',
    resultDate: '',
    headline: '',
    numbers: [],
    note: '\u0e23\u0e2d\u0e02\u0e49\u0e2d\u0e21\u0e39\u0e25\u0e08\u0e32\u0e01 API Lao ASEAN'
  });
}

{
  const internationalSection = baseSections.find((section) => section.id === 'international');
  const laoMarket = internationalSection?.markets.find((market) => market.id === 'lao');
  if (laoMarket) {
    laoMarket.provider = LAOS_PROVIDER_NAME;
    laoMarket.note = 'รอข้อมูลจาก Huay Lao Official';
  }

  const laoVipMarket = internationalSection?.markets.find((market) => market.id === 'lao-vip');
  if (laoVipMarket) {
    laoVipMarket.provider = LAOS_VIP_PROVIDER_NAME;
    laoVipMarket.note = 'รอข้อมูลจาก Lao VIP Official';
  }
}

{
  const stocksSection = baseSections.find((section) => section.id === 'stocks');
  const insertAt = Math.max(0, (stocksSection?.markets || []).findIndex((market) => market.id === 'stock-hangseng-morning') + 1);
  stocksSection?.markets.splice(insertAt, 0, {
    id: 'stock-hangseng-morning-vip',
    name: HSI_MORNING_VIP_MARKET_NAME,
    provider: HSI_VIP_PROVIDER_NAME,
    status: 'waiting',
    resultDate: '',
    headline: '',
    numbers: [],
    note: HSI_VIP_NOTE
  });
}

{
  const stocksSection = baseSections.find((section) => section.id === 'stocks');
  const insertAt = Math.max(0, (stocksSection?.markets || []).findIndex((market) => market.id === 'stock-nikkei-morning') + 1);
  stocksSection?.markets.splice(insertAt, 0, {
    id: 'stock-nikkei-morning-vip',
    name: NIKKEI_MORNING_VIP_MARKET_NAME,
    provider: NIKKEI_VIP_PROVIDER_NAME,
    status: 'waiting',
    resultDate: '',
    headline: '',
    numbers: [],
    note: 'รอข้อมูลจาก API Nikkei VIP Stock Official'
  });
}

{
  const stocksSection = baseSections.find((section) => section.id === 'stocks');
  const insertAt = Math.max(0, (stocksSection?.markets || []).findIndex((market) => market.id === 'stock-china-morning') + 1);
  stocksSection?.markets.splice(insertAt, 0, {
    id: 'stock-china-morning-vip',
    name: CHINA_MORNING_VIP_MARKET_NAME,
    provider: SHENZHEN_INDEX_PROVIDER_NAME,
    status: 'waiting',
    resultDate: '',
    headline: '',
    numbers: [],
    note: 'รอข้อมูลจาก API Shenzhen Index Official'
  });
}

{
  const stocksSection = baseSections.find((section) => section.id === 'stocks');
  const insertAt = Math.max(0, (stocksSection?.markets || []).findIndex((market) => market.id === 'stock-hangseng-afternoon') + 1);
  stocksSection?.markets.splice(insertAt, 0, {
    id: 'stock-hangseng-afternoon-vip',
    name: HSI_AFTERNOON_VIP_MARKET_NAME,
    provider: HSI_VIP_PROVIDER_NAME,
    status: 'waiting',
    resultDate: '',
    headline: '',
    numbers: [],
    note: HSI_VIP_NOTE
  });
}

{
  const stocksSection = baseSections.find((section) => section.id === 'stocks');
  const insertAt = Math.max(0, (stocksSection?.markets || []).findIndex((market) => market.id === 'stock-nikkei-afternoon') + 1);
  stocksSection?.markets.splice(insertAt, 0, {
    id: 'stock-nikkei-afternoon-vip',
    name: NIKKEI_AFTERNOON_VIP_MARKET_NAME,
    provider: NIKKEI_VIP_PROVIDER_NAME,
    status: 'waiting',
    resultDate: '',
    headline: '',
    numbers: [],
    note: 'รอข้อมูลจาก API Nikkei VIP Stock Official'
  });
}

{
  const stocksSection = baseSections.find((section) => section.id === 'stocks');
  const insertAt = Math.max(0, (stocksSection?.markets || []).findIndex((market) => market.id === 'stock-china-afternoon') + 1);
  stocksSection?.markets.splice(insertAt, 0, {
    id: 'stock-china-afternoon-vip',
    name: CHINA_AFTERNOON_VIP_MARKET_NAME,
    provider: SHENZHEN_INDEX_PROVIDER_NAME,
    status: 'waiting',
    resultDate: '',
    headline: '',
    numbers: [],
    note: 'รอข้อมูลจาก API Shenzhen Index Official'
  });
}

{
  const stocksSection = baseSections.find((section) => section.id === 'stocks');
  const insertAt = Math.max(0, (stocksSection?.markets || []).findIndex((market) => market.id === 'stock-taiwan') + 1);
  stocksSection?.markets.splice(insertAt, 0, {
    id: 'stock-taiwan-vip',
    name: TAIWAN_VIP_MARKET_NAME,
    provider: TAIWAN_VIP_PROVIDER_NAME,
    status: 'waiting',
    resultDate: '',
    headline: '',
    numbers: [],
    note: TAIWAN_VIP_NOTE
  });
}

{
  const stocksSection = baseSections.find((section) => section.id === 'stocks');
  const insertAt = Math.max(0, (stocksSection?.markets || []).findIndex((market) => market.id === 'stock-korea') + 1);
  stocksSection?.markets.splice(insertAt, 0, {
    id: 'stock-korea-vip',
    name: KOREA_VIP_MARKET_NAME,
    provider: KOREA_VIP_PROVIDER_NAME,
    status: 'waiting',
    resultDate: '',
    headline: '',
    numbers: [],
    note: KOREA_VIP_NOTE
  });
}

{
  const stocksSection = baseSections.find((section) => section.id === 'stocks');
  const insertAt = Math.max(0, (stocksSection?.markets || []).findIndex((market) => market.id === 'stock-singapore') + 1);
  stocksSection?.markets.splice(insertAt, 0, {
    id: 'stock-singapore-vip',
    name: SINGAPORE_VIP_MARKET_NAME,
    provider: SINGAPORE_VIP_PROVIDER_NAME,
    status: 'waiting',
    resultDate: '',
    headline: '',
    numbers: [],
    note: SINGAPORE_VIP_NOTE
  });
}

{
  const stocksSection = baseSections.find((section) => section.id === 'stocks');
  const insertAt = Math.max(0, (stocksSection?.markets || []).findIndex((market) => market.id === 'stock-england') + 1);
  stocksSection?.markets.splice(insertAt, 0, {
    id: 'stock-england-vip',
    name: ENGLAND_VIP_MARKET_NAME,
    provider: LOTTO_SUPER_RICH_PROVIDER_NAME,
    status: 'waiting',
    resultDate: '',
    headline: '',
    numbers: [],
    note: LOTTO_SUPER_RICH_VIP_NOTE
  });
}

{
  const stocksSection = baseSections.find((section) => section.id === 'stocks');
  const insertAt = Math.max(0, (stocksSection?.markets || []).findIndex((market) => market.id === 'stock-germany') + 1);
  stocksSection?.markets.splice(insertAt, 0, {
    id: 'stock-germany-vip',
    name: GERMANY_VIP_MARKET_NAME,
    provider: LOTTO_SUPER_RICH_PROVIDER_NAME,
    status: 'waiting',
    resultDate: '',
    headline: '',
    numbers: [],
    note: LOTTO_SUPER_RICH_VIP_NOTE
  });
}

{
  const stocksSection = baseSections.find((section) => section.id === 'stocks');
  const insertAt = Math.max(0, (stocksSection?.markets || []).findIndex((market) => market.id === 'stock-russia') + 1);
  stocksSection?.markets.splice(insertAt, 0, {
    id: 'stock-russia-vip',
    name: RUSSIA_VIP_MARKET_NAME,
    provider: LOTTO_SUPER_RICH_PROVIDER_NAME,
    status: 'waiting',
    resultDate: '',
    headline: '',
    numbers: [],
    note: LOTTO_SUPER_RICH_VIP_NOTE
  });
}

const cloneSections = () => baseSections.map((section) => ({
  ...section,
  markets: section.markets.map((market) => ({
    ...market,
    numbers: [...market.numbers]
  }))
}));

const stringValue = (value) => {
  if (value === null || value === undefined) return '';
  if (typeof value === 'string') return value.trim();
  if (typeof value === 'number') return String(value);
  if (Array.isArray(value)) return value.filter(Boolean).map((item) => String(item).trim()).join(' / ');
  return '';
};

const isMasked = (value) => /x/i.test(stringValue(value));
const hasValue = (value) => {
  const normalized = stringValue(value);
  return normalized && !isMasked(normalized);
};

const setMarketData = (sections, sectionId, nextMarket) => {
  const section = sections.find((entry) => entry.id === sectionId);
  if (!section) return;

  const marketIndex = section.markets.findIndex((market) => market.id === nextMarket.id);

  if (marketIndex >= 0) {
    section.markets[marketIndex] = {
      ...section.markets[marketIndex],
      ...nextMarket,
      numbers: nextMarket.numbers || section.markets[marketIndex].numbers || []
    };
    return;
  }

  section.markets.push(nextMarket);
};

const compactDigits = (value) => stringValue(value).replace(/[^0-9xX]/g, '');
const tailDigits = (value, length) => {
  const digits = compactDigits(value);
  if (!digits) return '';
  return digits.slice(-length);
};
const twoDigitScalar = (value) => {
  const digits = compactDigits(value);
  return digits.length === 2 ? digits : '';
};
const middleDigits = (value, length) => {
  const digits = compactDigits(value);
  if (!digits) return '';
  if (digits.length <= length) return digits;
  const start = Math.floor((digits.length - length) / 2);
  return digits.slice(start, start + length);
};
const mergeUniqueValues = (...values) => [...new Set(values.flat().filter(Boolean))];

const formatIssueDate = (issue, openDate) => {
  const normalizedIssue = stringValue(issue).replace(/\D/g, '');
  if (normalizedIssue.length === 8) {
    return `${normalizedIssue.slice(0, 4)}-${normalizedIssue.slice(4, 6)}-${normalizedIssue.slice(6, 8)}`;
  }

  const normalizedOpenDate = stringValue(openDate);
  return normalizedOpenDate ? normalizedOpenDate.slice(0, 10) : '';
};

const fetchProvider = async (code) => {
  const response = await axios.get(`${PROVIDER_BASE_URL}/${code}.json`, {
    timeout: 12000
  });

  return response.data;
};

const fetchGsbLatestMarket = async () => {
  const snapshot = await fetchLatestGsbSnapshot();
  if (!snapshot) {
    return null;
  }

  return buildMarket({
    id: GSB_MARKET_ID,
    name: GSB_MARKET_NAME,
    provider: GSB_PROVIDER_NAME,
    resultDate: snapshot.roundCode,
    headline: snapshot.headline,
    numbers: [
      { label: '3 ตัวบน', value: snapshot.threeTop },
      { label: '2 ตัวบน', value: snapshot.twoTop },
      { label: '2 ตัวล่าง', value: snapshot.twoBottom }
    ],
    note: 'ตรวจจับจากเว็บไซต์ GSB และแปลงผลแบบเดียวกับ GOGOLot',
    sourceUrl: snapshot.sourceUrl
  });
};

const fetchLatestThaiGovernmentMarket = async () => {
  const snapshot = await fetchLatestThaiGovernmentSnapshot();
  if (!snapshot) {
    return null;
  }

  return buildMarket({
    id: THAI_GOV_MARKET_ID,
    name: THAI_GOV_MARKET_NAME,
    provider: THAI_GOV_PROVIDER_NAME,
    resultDate: snapshot.roundCode,
    headline: snapshot.firstPrize,
    numbers: [
      { label: '3 ตัวบน', value: snapshot.threeTop },
      { label: '2 ตัวบน', value: snapshot.twoTop },
      { label: '3 ตัวหน้า', value: mergeUniqueValues(snapshot.threeFrontHits || []).join(' / ') },
      { label: '3 ตัวล่าง', value: mergeUniqueValues(snapshot.threeBottomHits || []).join(' / ') },
      { label: '2 ตัวล่าง', value: snapshot.twoBottom }
    ],
    note: 'ตรวจจับจาก GLO Official และใช้ผลรางวัลตามประกาศทางการ',
    sourceUrl: snapshot.sourceUrl
  });
};

const fetchLatestBaacMarket = async () => {
  const snapshot = await fetchLatestBaacSnapshot();
  if (!snapshot) {
    return null;
  }

  return buildMarket({
    id: BAAC_MARKET_ID,
    name: BAAC_MARKET_NAME,
    provider: BAAC_PROVIDER_NAME,
    resultDate: snapshot.roundCode,
    headline: snapshot.firstPrize,
    numbers: [
      { label: '3 ตัวบน', value: snapshot.threeTop },
      { label: '2 ตัวบน', value: snapshot.twoTop },
      { label: '2 ตัวล่าง', value: snapshot.twoBottom }
    ],
    note: 'ตรวจจับจากผลสลากออมทรัพย์ ธ.ก.ส. ทางการ',
    sourceUrl: snapshot.sourceUrl
  });
};

const fetchLatestLaosMarket = async () => {
  const snapshot = await fetchLatestLaosSnapshot();
  if (!snapshot) {
    return null;
  }

  return buildMarket({
    id: 'lao',
    name: LAOS_MARKET_NAME,
    provider: LAOS_PROVIDER_NAME,
    resultDate: snapshot.roundCode,
    headline: snapshot.threeTop,
    numbers: [
      { label: LAOS_NUMBER_LABELS.threeTop, value: snapshot.threeTop },
      { label: LAOS_NUMBER_LABELS.twoTop, value: snapshot.twoTop },
      { label: LAOS_NUMBER_LABELS.twoBottom, value: snapshot.twoBottom }
    ],
    note: LAOS_NOTE,
    sourceUrl: snapshot.sourceUrl
  });
};

const fetchLatestLaosVipMarket = async () => {
  const snapshot = await fetchLatestLaosVipSnapshot();
  if (!snapshot) {
    return null;
  }

  return buildMarket({
    id: 'lao-vip',
    name: LAOS_VIP_MARKET_NAME,
    provider: LAOS_VIP_PROVIDER_NAME,
    resultDate: snapshot.roundCode,
    headline: snapshot.threeTop,
    numbers: [
      { label: LAOS_NUMBER_LABELS.threeTop, value: snapshot.threeTop },
      { label: LAOS_NUMBER_LABELS.twoTop, value: snapshot.twoTop },
      { label: LAOS_NUMBER_LABELS.twoBottom, value: snapshot.twoBottom }
    ],
    note: LAOS_VIP_NOTE,
    sourceUrl: snapshot.sourceUrl
  });
};

const fetchLatestLaosPathanaMarket = async () => {
  const snapshot = await fetchLatestLaosPathanaSnapshot();
  if (!snapshot) {
    return null;
  }

  return buildMarket({
    id: 'lao-pathana',
    name: LAOS_PATHANA_MARKET_NAME,
    provider: LAOS_PATHANA_PROVIDER_NAME,
    resultDate: snapshot.roundCode,
    headline: snapshot.threeTop,
    numbers: [
      { label: '3 à¸•à¸±à¸§à¸šà¸™', value: snapshot.threeTop },
      { label: '2 à¸•à¸±à¸§à¸šà¸™', value: snapshot.twoTop },
      { label: '2 à¸•à¸±à¸§à¸¥à¹ˆà¸²à¸‡', value: snapshot.twoBottom }
    ],
    note: 'à¸•à¸£à¸§à¸ˆà¸ˆà¸±à¸šà¸ˆà¸²à¸à¹€à¸§à¹‡à¸šà¹„à¸‹à¸•à¹Œ Lao Pathana à¹à¸¥à¸°à¹à¸›à¸¥à¸‡à¸œà¸¥à¹à¸šà¸šà¹€à¸”à¸µà¸¢à¸§à¸à¸±à¸š GOGOLot',
    sourceUrl: snapshot.sourceUrl
  });
};

const fetchLatestLaosPathanaMarketNormalized = async () => {
  const snapshot = await fetchLatestLaosPathanaSnapshot();
  if (!snapshot) {
    return null;
  }

  return buildMarket({
    id: 'lao-pathana',
    name: LAOS_PATHANA_MARKET_NAME,
    provider: LAOS_PATHANA_PROVIDER_NAME,
    resultDate: snapshot.roundCode,
    headline: snapshot.threeTop,
    numbers: [
      { label: LAOS_PATHANA_NUMBER_LABELS.threeTop, value: snapshot.threeTop },
      { label: LAOS_PATHANA_NUMBER_LABELS.twoTop, value: snapshot.twoTop },
      { label: LAOS_PATHANA_NUMBER_LABELS.twoBottom, value: snapshot.twoBottom }
    ],
    note: LAOS_PATHANA_NOTE,
    sourceUrl: snapshot.sourceUrl
  });
};

const fetchLatestLaosRedcrossMarket = async () => {
  const snapshot = await fetchLatestLaosRedcrossSnapshot();
  if (!snapshot) {
    return null;
  }

  return buildMarket({
    id: 'lao-redcross',
    name: LAOS_REDCROSS_MARKET_NAME,
    provider: LAOS_REDCROSS_PROVIDER_NAME,
    resultDate: snapshot.roundCode,
    headline: snapshot.threeTop,
    numbers: [
      { label: LAOS_REDCROSS_NUMBER_LABELS.threeTop, value: snapshot.threeTop },
      { label: LAOS_REDCROSS_NUMBER_LABELS.twoTop, value: snapshot.twoTop },
      { label: LAOS_REDCROSS_NUMBER_LABELS.twoBottom, value: snapshot.twoBottom }
    ],
    note: LAOS_REDCROSS_NOTE,
    sourceUrl: snapshot.sourceUrl
  });
};

const fetchLatestLaosTvMarket = async () => {
  const snapshot = await fetchLatestLaosTvSnapshot();
  if (!snapshot) {
    return null;
  }

  return buildMarket({
    id: 'lao-tv',
    name: LAOS_TV_MARKET_NAME,
    provider: LAOS_TV_PROVIDER_NAME,
    resultDate: snapshot.roundCode,
    headline: snapshot.threeTop,
    numbers: [
      { label: LAOS_TV_NUMBER_LABELS.threeTop, value: snapshot.threeTop },
      { label: LAOS_TV_NUMBER_LABELS.twoTop, value: snapshot.twoTop },
      { label: LAOS_TV_NUMBER_LABELS.twoBottom, value: snapshot.twoBottom }
    ],
    note: LAOS_TV_NOTE,
    sourceUrl: snapshot.sourceUrl
  });
};

const fetchLatestLaosHdMarket = async () => {
  const snapshot = await fetchLatestLaosHdSnapshot();
  if (!snapshot) {
    return null;
  }

  return buildMarket({
    id: 'lao-hd',
    name: LAOS_HD_MARKET_NAME,
    provider: LAOS_HD_PROVIDER_NAME,
    resultDate: snapshot.roundCode,
    headline: snapshot.threeTop,
    numbers: [
      { label: LAOS_HD_NUMBER_LABELS.threeTop, value: snapshot.threeTop },
      { label: LAOS_HD_NUMBER_LABELS.twoTop, value: snapshot.twoTop },
      { label: LAOS_HD_NUMBER_LABELS.twoBottom, value: snapshot.twoBottom }
    ],
    note: LAOS_HD_NOTE,
    sourceUrl: snapshot.sourceUrl
  });
};

const fetchLatestLaosExtraMarket = async () => {
  const snapshot = await fetchLatestLaosExtraSnapshot();
  if (!snapshot) {
    return null;
  }

  return buildMarket({
    id: 'lao-extra',
    name: LAOS_EXTRA_MARKET_NAME,
    provider: LAOS_EXTRA_PROVIDER_NAME,
    resultDate: snapshot.roundCode,
    headline: snapshot.threeTop,
    numbers: [
      { label: LAOS_EXTRA_NUMBER_LABELS.threeTop, value: snapshot.threeTop },
      { label: LAOS_EXTRA_NUMBER_LABELS.twoTop, value: snapshot.twoTop },
      { label: LAOS_EXTRA_NUMBER_LABELS.twoBottom, value: snapshot.twoBottom }
    ],
    note: LAOS_EXTRA_NOTE,
    sourceUrl: snapshot.sourceUrl
  });
};

const fetchLatestLaosStarsMarket = async () => {
  const snapshot = await fetchLatestLaosStarsSnapshot();
  if (!snapshot) {
    return null;
  }

  return buildMarket({
    id: 'lao-star',
    name: LAOS_STAR_MARKET_NAME,
    provider: LAOS_STAR_PROVIDER_NAME,
    resultDate: snapshot.roundCode,
    headline: snapshot.threeTop,
    numbers: [
      { label: LAOS_STAR_NUMBER_LABELS.threeTop, value: snapshot.threeTop },
      { label: LAOS_STAR_NUMBER_LABELS.twoTop, value: snapshot.twoTop },
      { label: LAOS_STAR_NUMBER_LABELS.twoBottom, value: snapshot.twoBottom }
    ],
    note: LAOS_STAR_NOTE,
    sourceUrl: snapshot.sourceUrl
  });
};

const fetchLatestLaosStarsVipMarket = async () => {
  const snapshot = await fetchLatestLaosStarsVipSnapshot();
  if (!snapshot) {
    return null;
  }

  return buildMarket({
    id: 'lao-star-vip',
    name: LAOS_STAR_VIP_MARKET_NAME,
    provider: LAOS_STAR_VIP_PROVIDER_NAME,
    resultDate: snapshot.roundCode,
    headline: snapshot.threeTop,
    numbers: [
      { label: LAOS_STAR_VIP_NUMBER_LABELS.threeTop, value: snapshot.threeTop },
      { label: LAOS_STAR_VIP_NUMBER_LABELS.twoTop, value: snapshot.twoTop },
      { label: LAOS_STAR_VIP_NUMBER_LABELS.twoBottom, value: snapshot.twoBottom }
    ],
    note: LAOS_STAR_VIP_NOTE,
    sourceUrl: snapshot.sourceUrl
  });
};

const fetchLatestLaosUnionMarket = async () => {
  const snapshot = await fetchLatestLaosUnionSnapshot();
  if (!snapshot) {
    return null;
  }

  return buildMarket({
    id: 'lao-union',
    name: LAOS_UNION_MARKET_NAME,
    provider: LAOS_UNION_PROVIDER_NAME,
    resultDate: snapshot.roundCode,
    headline: snapshot.threeTop,
    numbers: [
      { label: LAOS_UNION_NUMBER_LABELS.threeTop, value: snapshot.threeTop },
      { label: LAOS_UNION_NUMBER_LABELS.twoTop, value: snapshot.twoTop },
      { label: LAOS_UNION_NUMBER_LABELS.twoBottom, value: snapshot.twoBottom }
    ],
    note: LAOS_UNION_NOTE,
    sourceUrl: snapshot.sourceUrl
  });
};

const fetchLatestLaosUnionVipMarket = async () => {
  const snapshot = await fetchLatestLaosUnionVipSnapshot();
  if (!snapshot) {
    return null;
  }

  return buildMarket({
    id: 'lao-union-vip',
    name: LAOS_UNION_VIP_MARKET_NAME,
    provider: LAOS_UNION_VIP_PROVIDER_NAME,
    resultDate: snapshot.roundCode,
    headline: snapshot.threeTop,
    numbers: [
      { label: LAOS_UNION_VIP_NUMBER_LABELS.threeTop, value: snapshot.threeTop },
      { label: LAOS_UNION_VIP_NUMBER_LABELS.twoTop, value: snapshot.twoTop },
      { label: LAOS_UNION_VIP_NUMBER_LABELS.twoBottom, value: snapshot.twoBottom }
    ],
    note: LAOS_UNION_VIP_NOTE,
    sourceUrl: snapshot.sourceUrl
  });
};

const fetchLatestLaosAseanMarket = async () => {
  const snapshot = await fetchLatestLaosAseanSnapshot();
  if (!snapshot) {
    return null;
  }

  return buildMarket({
    id: 'lao-asean',
    name: LAOS_ASEAN_MARKET_NAME,
    provider: LAOS_ASEAN_PROVIDER_NAME,
    resultDate: snapshot.roundCode,
    headline: snapshot.threeTop,
    numbers: [
      { label: LAOS_ASEAN_NUMBER_LABELS.threeTop, value: snapshot.threeTop },
      { label: LAOS_ASEAN_NUMBER_LABELS.twoTop, value: snapshot.twoTop },
      { label: LAOS_ASEAN_NUMBER_LABELS.twoBottom, value: snapshot.twoBottom }
    ],
    note: LAOS_ASEAN_NOTE,
    sourceUrl: snapshot.sourceUrl
  });
};

const fetchLatestHanoiExtraMarket = async () => {
  const snapshot = await fetchLatestHanoiExtraSnapshot();
  if (!snapshot) {
    return null;
  }

  return buildMarket({
    id: 'hanoi-extra',
    name: HANOI_EXTRA_MARKET_NAME,
    provider: HANOI_EXTRA_PROVIDER_NAME,
    resultDate: snapshot.roundCode,
    headline: snapshot.threeTop,
    numbers: [
      { label: HANOI_EXTRA_NUMBER_LABELS.threeTop, value: snapshot.threeTop },
      { label: HANOI_EXTRA_NUMBER_LABELS.twoTop, value: snapshot.twoTop },
      { label: HANOI_EXTRA_NUMBER_LABELS.twoBottom, value: snapshot.twoBottom }
    ],
    note: HANOI_EXTRA_NOTE,
    sourceUrl: snapshot.sourceUrl
  });
};

const fetchLatestHanoiStarMarket = async () => {
  const snapshot = await fetchLatestHanoiStarSnapshot();
  if (!snapshot) {
    return null;
  }

  return buildMarket({
    id: 'hanoi-star',
    name: HANOI_STAR_MARKET_NAME,
    provider: HANOI_STAR_PROVIDER_NAME,
    resultDate: snapshot.roundCode,
    headline: snapshot.threeTop,
    numbers: [
      { label: HANOI_STAR_NUMBER_LABELS.threeTop, value: snapshot.threeTop },
      { label: HANOI_STAR_NUMBER_LABELS.twoTop, value: snapshot.twoTop },
      { label: HANOI_STAR_NUMBER_LABELS.twoBottom, value: snapshot.twoBottom }
    ],
    note: HANOI_STAR_NOTE,
    sourceUrl: snapshot.sourceUrl
  });
};

const fetchLatestHanoiDevelopMarket = async () => {
  const snapshot = await fetchLatestHanoiDevelopSnapshot();
  if (!snapshot) {
    return null;
  }

  return buildMarket({
    id: 'hanoi-develop',
    name: HANOI_DEVELOP_MARKET_NAME,
    provider: HANOI_DEVELOP_PROVIDER_NAME,
    resultDate: snapshot.roundCode,
    headline: snapshot.threeTop,
    numbers: [
      { label: HANOI_DEVELOP_NUMBER_LABELS.threeTop, value: snapshot.threeTop },
      { label: HANOI_DEVELOP_NUMBER_LABELS.twoTop, value: snapshot.twoTop },
      { label: HANOI_DEVELOP_NUMBER_LABELS.twoBottom, value: snapshot.twoBottom }
    ],
    note: HANOI_DEVELOP_NOTE,
    sourceUrl: snapshot.sourceUrl
  });
};

const fetchLatestHanoiHdMarket = async () => {
  const snapshot = await fetchLatestHanoiHdSnapshot();
  if (!snapshot) {
    return null;
  }

  return buildMarket({
    id: 'hanoi-hd',
    name: HANOI_HD_MARKET_NAME,
    provider: HANOI_HD_PROVIDER_NAME,
    resultDate: snapshot.roundCode,
    headline: snapshot.threeTop,
    numbers: [
      { label: HANOI_HD_NUMBER_LABELS.threeTop, value: snapshot.threeTop },
      { label: HANOI_HD_NUMBER_LABELS.twoTop, value: snapshot.twoTop },
      { label: HANOI_HD_NUMBER_LABELS.twoBottom, value: snapshot.twoBottom }
    ],
    note: HANOI_HD_NOTE,
    sourceUrl: snapshot.sourceUrl
  });
};

const fetchLatestHanoiTvMarket = async () => {
  const snapshot = await fetchLatestHanoiTvSnapshot();
  if (!snapshot) {
    return null;
  }

  return buildMarket({
    id: 'hanoi-tv',
    name: HANOI_TV_MARKET_NAME,
    provider: HANOI_TV_PROVIDER_NAME,
    resultDate: snapshot.roundCode,
    headline: snapshot.threeTop,
    numbers: [
      { label: HANOI_TV_NUMBER_LABELS.threeTop, value: snapshot.threeTop },
      { label: HANOI_TV_NUMBER_LABELS.twoTop, value: snapshot.twoTop },
      { label: HANOI_TV_NUMBER_LABELS.twoBottom, value: snapshot.twoBottom }
    ],
    note: HANOI_TV_NOTE,
    sourceUrl: snapshot.sourceUrl
  });
};

const fetchLatestHanoiRedcrossMarket = async () => {
  const snapshot = await fetchLatestHanoiRedcrossSnapshot();
  if (!snapshot) {
    return null;
  }

  return buildMarket({
    id: 'hanoi-redcross',
    name: HANOI_REDCROSS_MARKET_NAME,
    provider: HANOI_REDCROSS_PROVIDER_NAME,
    resultDate: snapshot.roundCode,
    headline: snapshot.threeTop,
    numbers: [
      { label: HANOI_REDCROSS_NUMBER_LABELS.threeTop, value: snapshot.threeTop },
      { label: HANOI_REDCROSS_NUMBER_LABELS.twoTop, value: snapshot.twoTop },
      { label: HANOI_REDCROSS_NUMBER_LABELS.twoBottom, value: snapshot.twoBottom }
    ],
    note: HANOI_REDCROSS_NOTE,
    sourceUrl: snapshot.sourceUrl
  });
};

const fetchLatestHanoiUnionMarket = async () => {
  const snapshot = await fetchLatestHanoiUnionSnapshot();
  if (!snapshot) {
    return null;
  }

  return buildMarket({
    id: 'hanoi-union',
    name: HANOI_UNION_MARKET_NAME,
    provider: HANOI_UNION_PROVIDER_NAME,
    resultDate: snapshot.roundCode,
    headline: snapshot.threeTop,
    numbers: [
      { label: HANOI_UNION_NUMBER_LABELS.threeTop, value: snapshot.threeTop },
      { label: HANOI_UNION_NUMBER_LABELS.twoTop, value: snapshot.twoTop },
      { label: HANOI_UNION_NUMBER_LABELS.twoBottom, value: snapshot.twoBottom }
    ],
    note: HANOI_UNION_NOTE,
    sourceUrl: snapshot.sourceUrl
  });
};

const fetchLatestHanoiAseanMarket = async () => {
  const snapshot = await fetchLatestHanoiAseanSnapshot();
  if (!snapshot) {
    return null;
  }

  return buildMarket({
    id: 'hanoi-asean',
    name: HANOI_ASEAN_MARKET_NAME,
    provider: HANOI_ASEAN_PROVIDER_NAME,
    resultDate: snapshot.roundCode,
    headline: snapshot.threeTop,
    numbers: [
      { label: HANOI_ASEAN_NUMBER_LABELS.threeTop, value: snapshot.threeTop },
      { label: HANOI_ASEAN_NUMBER_LABELS.twoTop, value: snapshot.twoTop },
      { label: HANOI_ASEAN_NUMBER_LABELS.twoBottom, value: snapshot.twoBottom }
    ],
    note: HANOI_ASEAN_NOTE,
    sourceUrl: snapshot.sourceUrl
  });
};

const fetchLatestChinaMorningVipMarket = async () => {
  const snapshot = await fetchLatestShenzhenMorningVipSnapshot();
  if (!snapshot) {
    return null;
  }

  return buildMarket({
    id: 'stock-china-morning-vip',
    name: CHINA_MORNING_VIP_MARKET_NAME,
    provider: SHENZHEN_INDEX_PROVIDER_NAME,
    resultDate: snapshot.roundCode,
    headline: snapshot.threeTop,
    numbers: [
      { label: '3 ตัวบน', value: snapshot.threeTop },
      { label: '2 ตัวบน', value: snapshot.twoTop },
      { label: '2 ตัวล่าง', value: snapshot.twoBottom }
    ],
    note: SHENZHEN_INDEX_VIP_NOTE,
    sourceUrl: snapshot.sourceUrl
  });
};

const fetchLatestChinaAfternoonVipMarket = async () => {
  const snapshot = await fetchLatestShenzhenAfternoonVipSnapshot();
  if (!snapshot) {
    return null;
  }

  return buildMarket({
    id: 'stock-china-afternoon-vip',
    name: CHINA_AFTERNOON_VIP_MARKET_NAME,
    provider: SHENZHEN_INDEX_PROVIDER_NAME,
    resultDate: snapshot.roundCode,
    headline: snapshot.threeTop,
    numbers: [
      { label: '3 ตัวบน', value: snapshot.threeTop },
      { label: '2 ตัวบน', value: snapshot.twoTop },
      { label: '2 ตัวล่าง', value: snapshot.twoBottom }
    ],
    note: SHENZHEN_INDEX_VIP_NOTE,
    sourceUrl: snapshot.sourceUrl
  });
};

const fetchLatestHsiMorningVipMarket = async () => {
  const snapshot = await fetchLatestHsiMorningVipSnapshot();
  if (!snapshot) {
    return null;
  }

  return buildMarket({
    id: 'stock-hangseng-morning-vip',
    name: HSI_MORNING_VIP_MARKET_NAME,
    provider: HSI_VIP_PROVIDER_NAME,
    resultDate: snapshot.roundCode,
    headline: snapshot.threeTop,
    numbers: [
      { label: '3 à¸•à¸±à¸§à¸šà¸™', value: snapshot.threeTop },
      { label: '2 à¸•à¸±à¸§à¸šà¸™', value: snapshot.twoTop },
      { label: '2 à¸•à¸±à¸§à¸¥à¹ˆà¸²à¸‡', value: snapshot.twoBottom }
    ],
    note: HSI_VIP_NOTE,
    sourceUrl: snapshot.sourceUrl
  });
};

const fetchLatestHsiAfternoonVipMarket = async () => {
  const snapshot = await fetchLatestHsiAfternoonVipSnapshot();
  if (!snapshot) {
    return null;
  }

  return buildMarket({
    id: 'stock-hangseng-afternoon-vip',
    name: HSI_AFTERNOON_VIP_MARKET_NAME,
    provider: HSI_VIP_PROVIDER_NAME,
    resultDate: snapshot.roundCode,
    headline: snapshot.threeTop,
    numbers: [
      { label: '3 à¸•à¸±à¸§à¸šà¸™', value: snapshot.threeTop },
      { label: '2 à¸•à¸±à¸§à¸šà¸™', value: snapshot.twoTop },
      { label: '2 à¸•à¸±à¸§à¸¥à¹ˆà¸²à¸‡', value: snapshot.twoBottom }
    ],
    note: HSI_VIP_NOTE,
    sourceUrl: snapshot.sourceUrl
  });
};

const fetchLatestNikkeiMorningVipMarket = async () => {
  const snapshot = await fetchLatestNikkeiMorningVipSnapshot();
  if (!snapshot) {
    return null;
  }

  return buildMarket({
    id: 'stock-nikkei-morning-vip',
    name: NIKKEI_MORNING_VIP_MARKET_NAME,
    provider: NIKKEI_VIP_PROVIDER_NAME,
    resultDate: snapshot.roundCode,
    headline: snapshot.threeTop,
    numbers: [
      { label: '3 ตัวบน', value: snapshot.threeTop },
      { label: '2 ตัวบน', value: snapshot.twoTop },
      { label: '2 ตัวล่าง', value: snapshot.twoBottom }
    ],
    note: NIKKEI_VIP_NOTE,
    sourceUrl: snapshot.sourceUrl
  });
};

const fetchLatestNikkeiAfternoonVipMarket = async () => {
  const snapshot = await fetchLatestNikkeiAfternoonVipSnapshot();
  if (!snapshot) {
    return null;
  }

  return buildMarket({
    id: 'stock-nikkei-afternoon-vip',
    name: NIKKEI_AFTERNOON_VIP_MARKET_NAME,
    provider: NIKKEI_VIP_PROVIDER_NAME,
    resultDate: snapshot.roundCode,
    headline: snapshot.threeTop,
    numbers: [
      { label: '3 ตัวบน', value: snapshot.threeTop },
      { label: '2 ตัวบน', value: snapshot.twoTop },
      { label: '2 ตัวล่าง', value: snapshot.twoBottom }
    ],
    note: NIKKEI_VIP_NOTE,
    sourceUrl: snapshot.sourceUrl
  });
};

const fetchLatestEnglandVipMarket = async () => {
  const snapshot = await fetchLatestEnglandVipSnapshot();
  if (!snapshot) {
    return null;
  }

  return buildMarket({
    id: 'stock-england-vip',
    name: ENGLAND_VIP_MARKET_NAME,
    provider: LOTTO_SUPER_RICH_PROVIDER_NAME,
    resultDate: snapshot.roundCode,
    headline: snapshot.threeTop,
    numbers: [
      { label: '3 à¸•à¸±à¸§à¸šà¸™', value: snapshot.threeTop },
      { label: '2 à¸•à¸±à¸§à¸šà¸™', value: snapshot.twoTop },
      { label: '2 à¸•à¸±à¸§à¸¥à¹ˆà¸²à¸‡', value: snapshot.twoBottom }
    ],
    note: LOTTO_SUPER_RICH_VIP_NOTE,
    sourceUrl: snapshot.sourceUrl
  });
};

const fetchLatestGermanyVipMarket = async () => {
  const snapshot = await fetchLatestGermanyVipSnapshot();
  if (!snapshot) {
    return null;
  }

  return buildMarket({
    id: 'stock-germany-vip',
    name: GERMANY_VIP_MARKET_NAME,
    provider: LOTTO_SUPER_RICH_PROVIDER_NAME,
    resultDate: snapshot.roundCode,
    headline: snapshot.threeTop,
    numbers: [
      { label: '3 à¸•à¸±à¸§à¸šà¸™', value: snapshot.threeTop },
      { label: '2 à¸•à¸±à¸§à¸šà¸™', value: snapshot.twoTop },
      { label: '2 à¸•à¸±à¸§à¸¥à¹ˆà¸²à¸‡', value: snapshot.twoBottom }
    ],
    note: LOTTO_SUPER_RICH_VIP_NOTE,
    sourceUrl: snapshot.sourceUrl
  });
};

const fetchLatestRussiaVipMarket = async () => {
  const snapshot = await fetchLatestRussiaVipSnapshot();
  if (!snapshot) {
    return null;
  }

  return buildMarket({
    id: 'stock-russia-vip',
    name: RUSSIA_VIP_MARKET_NAME,
    provider: LOTTO_SUPER_RICH_PROVIDER_NAME,
    resultDate: snapshot.roundCode,
    headline: snapshot.threeTop,
    numbers: [
      { label: '3 à¸•à¸±à¸§à¸šà¸™', value: snapshot.threeTop },
      { label: '2 à¸•à¸±à¸§à¸šà¸™', value: snapshot.twoTop },
      { label: '2 à¸•à¸±à¸§à¸¥à¹ˆà¸²à¸‡', value: snapshot.twoBottom }
    ],
    note: LOTTO_SUPER_RICH_VIP_NOTE,
    sourceUrl: snapshot.sourceUrl
  });
};

const fetchLatestSingaporeVipMarket = async () => {
  const snapshot = await fetchLatestSingaporeVipSnapshot();
  if (!snapshot) {
    return null;
  }

  return buildMarket({
    id: 'stock-singapore-vip',
    name: SINGAPORE_VIP_MARKET_NAME,
    provider: SINGAPORE_VIP_PROVIDER_NAME,
    resultDate: snapshot.roundCode,
    headline: snapshot.threeTop,
    numbers: [
      { label: '3 ตัวบน', value: snapshot.threeTop },
      { label: '2 ตัวบน', value: snapshot.twoTop },
      { label: '2 ตัวล่าง', value: snapshot.twoBottom }
    ],
    note: SINGAPORE_VIP_NOTE,
    sourceUrl: snapshot.sourceUrl
  });
};

const fetchLatestTaiwanVipMarket = async () => {
  const snapshot = await fetchLatestTaiwanVipSnapshot();
  if (!snapshot) {
    return null;
  }

  return buildMarket({
    id: 'stock-taiwan-vip',
    name: TAIWAN_VIP_MARKET_NAME,
    provider: TAIWAN_VIP_PROVIDER_NAME,
    resultDate: snapshot.roundCode,
    headline: snapshot.threeTop,
    numbers: [
      { label: '3 ตัวบน', value: snapshot.threeTop },
      { label: '2 ตัวบน', value: snapshot.twoTop },
      { label: '2 ตัวล่าง', value: snapshot.twoBottom }
    ],
    note: TAIWAN_VIP_NOTE,
    sourceUrl: snapshot.sourceUrl
  });
};

const fetchLatestKoreaVipMarket = async () => {
  const snapshot = await fetchLatestKoreaVipSnapshot();
  if (!snapshot) {
    return null;
  }

  return buildMarket({
    id: 'stock-korea-vip',
    name: KOREA_VIP_MARKET_NAME,
    provider: KOREA_VIP_PROVIDER_NAME,
    resultDate: snapshot.roundCode,
    headline: snapshot.threeTop,
    numbers: [
      { label: '3 à¸•à¸±à¸§à¸šà¸™', value: snapshot.threeTop },
      { label: '2 à¸•à¸±à¸§à¸šà¸™', value: snapshot.twoTop },
      { label: '2 à¸•à¸±à¸§à¸¥à¹ˆà¸²à¸‡', value: snapshot.twoBottom }
    ],
    note: KOREA_VIP_NOTE,
    sourceUrl: snapshot.sourceUrl
  });
};

const fetchLatestDowjonesVipMarket = async () => {
  const snapshot = await fetchLatestDowjonesVipSnapshot();
  if (!snapshot) {
    return null;
  }

  return buildMarket({
    id: 'stock-dowjones',
    name: DOWJONES_VIP_MARKET_NAME,
    provider: DOWJONES_VIP_PROVIDER_NAME,
    resultDate: snapshot.roundCode,
    headline: snapshot.threeTop,
    numbers: [
      { label: '3 ตัวบน', value: snapshot.threeTop },
      { label: '2 ตัวบน', value: snapshot.twoTop },
      { label: '2 ตัวล่าง', value: snapshot.twoBottom }
    ],
    note: DOWJONES_VIP_NOTE,
    sourceUrl: snapshot.sourceUrl
  });
};

const extractManyCaiRows = (payload) => {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  return [];
};

const getLatestManyCaiRow = (payload) => extractManyCaiRows(payload)[0] || null;

const marketStatus = (headline, numbers) => {
  const values = [headline, ...(numbers || []).map((item) => item.value)].filter(Boolean);
  if (values.some((value) => hasValue(value))) return 'live';
  if (values.some((value) => isMasked(value))) return 'pending';
  return 'waiting';
};

const buildNumbers = (pairs) => pairs
  .filter((pair) => pair && stringValue(pair.value))
  .map((pair) => ({ label: pair.label, value: stringValue(pair.value) }));

const buildMarket = ({ id, name, provider, resultDate, headline, numbers, note, sourceUrl }) => ({
  id,
  name,
  provider,
  resultDate: stringValue(resultDate),
  headline: stringValue(headline),
  numbers: buildNumbers(numbers),
  note: stringValue(note),
  sourceUrl: stringValue(sourceUrl),
  status: marketStatus(headline, numbers)
});

const buildStoredHeadline = (marketId, result = {}) => {
  if (marketId === THAI_GOV_MARKET_ID || marketId === BAAC_MARKET_ID) {
    return stringValue(result.firstPrize || result.headline || result.threeTop || result.twoBottom);
  }

  if (marketId === 'lao' || marketId === 'lao-vip') {
    return stringValue(result.headline || result.threeTop || result.twoTop || result.twoBottom);
  }

  const manyCaiMarket = MANYCAI_MARKET_BY_ID.get(marketId);
  if (manyCaiMarket?.type === 'standard') {
    return stringValue(
      result.firstPrize ||
      result.headline ||
      result.threeTop ||
      result.twoTop ||
      result.twoBottom
    );
  }

  return stringValue(result.headline || result.threeTop || result.firstPrize || result.twoBottom);
};

const buildStoredNumbersForMarket = (marketId, result = {}) => {
  if (marketId === THAI_GOV_MARKET_ID) {
    return buildNumbers([
      { label: '3 ตัวบน', value: result.threeTop },
      { label: '2 ตัวบน', value: result.twoTop },
      { label: '3 ตัวหน้า', value: mergeUniqueValues(result.threeFrontHits || [], result.threeFront || '').join(' / ') },
      { label: '3 ตัวล่าง', value: mergeUniqueValues(result.threeBottomHits || [], result.threeBottom || '').join(' / ') },
      { label: '2 ตัวล่าง', value: result.twoBottom }
    ]);
  }

  if (marketId === 'lao' || marketId === 'lao-vip') {
    return buildNumbers([
      { label: '3 ตัวบน', value: result.threeTop },
      { label: '2 ตัวบน', value: result.twoTop },
      { label: '2 ตัวล่าง', value: result.twoBottom }
    ]);
  }

  const manyCaiMarket = MANYCAI_MARKET_BY_ID.get(marketId);
  if (manyCaiMarket?.type === 'standard') {
    return buildNumbers([
      { label: '4 ตัวบน', value: tailDigits(result.firstPrize || result.headline, 4) || result.firstPrize },
      { label: '3 ตัวบน', value: result.threeTop },
      { label: '2 ตัวบน', value: result.twoTop },
      { label: '2 ตัวล่าง', value: result.twoBottom }
    ]);
  }

  return buildNumbers([
    { label: '3 ตัวบน', value: result.threeTop },
    { label: '2 ตัวบน', value: result.twoTop },
    { label: '2 ตัวล่าง', value: result.twoBottom }
  ]);
};

const hydrateSectionsFromStoredSnapshot = (sections, snapshotByCode) => {
  sections.forEach((section) => {
    section.markets = (section.markets || []).map((market) => {
      const lotteryCode = resolveMarketLotteryCode(market.id);
      const snapshot = lotteryCode ? snapshotByCode.get(lotteryCode) : null;

      if (!snapshot?.result) {
        return market;
      }

      const headline = buildStoredHeadline(market.id, snapshot.result);
      const numbers = buildStoredNumbersForMarket(market.id, snapshot.result);

      return {
        ...market,
        resultDate: stringValue(snapshot.roundCode),
        headline,
        numbers,
        sourceUrl: stringValue(snapshot.result.sourceUrl),
        status: marketStatus(headline, numbers)
      };
    });
  });

  return sections;
};

const getScheduledDrawAt = (lotteryType, roundCode) => {
  const match = String(roundCode || '').match(ROUND_CODE_PATTERN);
  if (!match || !lotteryType?.schedule) {
    return null;
  }

  return createBangkokDate(
    Number(match[1]),
    Number(match[2]),
    Number(match[3]),
    Number(lotteryType.schedule.drawHour || 0),
    Number(lotteryType.schedule.drawMinute || 0),
    0
  );
};

const resolveStoredValueByLabel = (label, result) => {
  const normalizedLabel = stringValue(label);

  if (normalizedLabel.includes('3 ตัวหน้า')) {
    return mergeUniqueValues(result.threeFrontHits || [], result.threeFront || '').join(' / ');
  }

  if (normalizedLabel.includes('3 ตัวล่าง')) {
    return mergeUniqueValues(result.threeBottomHits || [], result.threeBottom || '').join(' / ');
  }

  if (normalizedLabel.includes('3 ตัวบน')) {
    return result.threeTop || '';
  }

  if (normalizedLabel.includes('2 ตัวบน')) {
    return result.twoTop || '';
  }

  if (normalizedLabel.includes('2 ตัวล่าง')) {
    return result.twoBottom || '';
  }

  if (normalizedLabel.includes('รางวัลหลัก')) {
    return result.firstPrize || '';
  }

  if (normalizedLabel.includes('เลขเด่น')) {
    return result.headline || result.firstPrize || '';
  }

  return '';
};

const getStoredSnapshotDrawAt = ({ lotteryType, roundCode, resultPublishedAt, drawAt }) => {
  if (drawAt) {
    return new Date(drawAt);
  }

  if (resultPublishedAt) {
    return new Date(resultPublishedAt);
  }

  return getScheduledDrawAt(lotteryType, roundCode);
};

const upsertLatestStoredSnapshot = (snapshotByCode, lotteryCode, candidate) => {
  if (!lotteryCode || !candidate?.drawAt) {
    return;
  }

  const candidateTime = new Date(candidate.drawAt).getTime();
  if (Number.isNaN(candidateTime)) {
    return;
  }

  const current = snapshotByCode.get(lotteryCode);
  const currentTime = current ? new Date(current.drawAt).getTime() : -Infinity;

  if (
    !current ||
    candidateTime > currentTime ||
    (candidateTime === currentTime && Number(candidate.priority || 0) > Number(current.priority || 0))
  ) {
    snapshotByCode.set(lotteryCode, candidate);
  }
};

const buildStoredSnapshotMap = async (lotteryCodes, now = new Date()) => {
  if (!lotteryCodes.length) {
    return { lotteryTypeByCode: new Map(), snapshotByCode: new Map() };
  }

  const lotteryTypes = await LotteryType.find({ code: { $in: lotteryCodes } }).lean();
  const lotteryTypeByCode = new Map(lotteryTypes.map((item) => [item.code, item]));
  const lotteryTypeIds = lotteryTypes.map((item) => item._id);
  const lotteryCodeById = new Map(lotteryTypes.map((item) => [String(item._id), item.code]));
  const snapshotByCode = new Map();

  const resultRecords = await ResultRecord.find({
    lotteryTypeId: { $in: lotteryTypeIds },
    isPublished: true
  })
    .sort({ updatedAt: -1 })
    .limit(Math.max(lotteryCodes.length * 20, 100))
    .populate('drawRoundId', 'code drawAt');

  resultRecords.forEach((record) => {
    const lotteryCode = lotteryCodeById.get(String(record.lotteryTypeId));
    const lotteryType = lotteryTypeByCode.get(lotteryCode);
    const roundCode = record.drawRoundId?.code || '';
    const drawAt = getStoredSnapshotDrawAt({
      lotteryType,
      roundCode,
      drawAt: record.drawRoundId?.drawAt
    });

    if (!lotteryCode || !drawAt || drawAt.getTime() > now.getTime()) {
      return;
    }

    upsertLatestStoredSnapshot(snapshotByCode, lotteryCode, {
      roundCode,
      drawAt,
      priority: 2,
      result: {
        headline: stringValue(record.headline),
        firstPrize: stringValue(record.firstPrize),
        threeTop: stringValue(record.threeTop),
        twoTop: stringValue(record.twoTop),
        twoBottom: stringValue(record.twoBottom),
        threeFront: stringValue(record.threeFront),
        threeBottom: stringValue(record.threeBottom),
        threeFrontHits: [...(record.threeFrontHits || [])],
        threeBottomHits: [...(record.threeBottomHits || [])],
        sourceUrl: stringValue(record.sourceUrl)
      }
    });
  });

  const feedResults = await MarketFeedResult.find({
    lotteryCode: { $in: lotteryCodes }
  })
    .sort({ resultPublishedAt: -1, updatedAt: -1 })
    .limit(Math.max(lotteryCodes.length * 20, 100))
    .lean();

  feedResults.forEach((record) => {
    const lotteryType = lotteryTypeByCode.get(record.lotteryCode);
    const drawAt = getStoredSnapshotDrawAt({
      lotteryType,
      roundCode: record.roundCode,
      resultPublishedAt: record.resultPublishedAt
    });

    if (!record.lotteryCode || !drawAt || drawAt.getTime() > now.getTime()) {
      return;
    }

    upsertLatestStoredSnapshot(snapshotByCode, record.lotteryCode, {
      roundCode: record.roundCode,
      drawAt,
      priority: 1,
      result: {
        headline: stringValue(record.headline),
        firstPrize: stringValue(record.firstPrize),
        threeTop: stringValue(record.threeTop),
        twoTop: stringValue(record.twoTop),
        twoBottom: stringValue(record.twoBottom),
        threeFront: stringValue(record.threeFront),
        threeBottom: stringValue(record.threeBottom),
        threeFrontHits: [...(record.threeFrontHits || [])],
        threeBottomHits: [...(record.threeBottomHits || [])],
        sourceUrl: stringValue(record.sourceUrl)
      }
    });
  });

  return { lotteryTypeByCode, snapshotByCode };
};

const buildVisibleStoredResultsMap = async (lotteryCodes, now = new Date()) => {
  if (!lotteryCodes.length) {
    return { lotteryTypeByCode: new Map(), latestResultByCode: new Map() };
  }

  const lotteryTypes = await LotteryType.find({ code: { $in: lotteryCodes } }).lean();
  const lotteryTypeByCode = new Map(lotteryTypes.map((item) => [item.code, item]));
  const lotteryCodeById = new Map(lotteryTypes.map((item) => [String(item._id), item.code]));

  const results = await ResultRecord.find({
    lotteryTypeId: { $in: lotteryTypes.map((item) => item._id) },
    isPublished: true
  })
    .sort({ updatedAt: -1 })
    .limit(Math.max(lotteryCodes.length * 20, 100))
    .populate('drawRoundId', 'code drawAt');

  const latestResultByCode = new Map();

  results.forEach((record) => {
    const lotteryCode = lotteryCodeById.get(String(record.lotteryTypeId));
    const lotteryType = lotteryTypeByCode.get(lotteryCode);
    const roundCode = record.drawRoundId?.code || '';
    const drawAt = record.drawRoundId?.drawAt || getScheduledDrawAt(lotteryType, roundCode);
    if (!lotteryCode || !drawAt || new Date(drawAt).getTime() > now.getTime()) {
      return;
    }

    const current = latestResultByCode.get(lotteryCode);
    if (!current || new Date(drawAt).getTime() > new Date(current.drawAt).getTime()) {
      latestResultByCode.set(lotteryCode, {
        drawAt,
        roundCode,
        result: record
      });
    }
  });

  return { lotteryTypeByCode, latestResultByCode };
};

const applyDrawTimeVisibilityGuards = async (sections) => {
  const now = new Date();
  const lotteryCodes = [...new Set(
    sections
      .flatMap((section) => section.markets || [])
      .map((market) => MARKET_ID_TO_LOTTERY_CODE[market.id])
      .filter(Boolean)
  )];

  const { lotteryTypeByCode, latestResultByCode } = await buildVisibleStoredResultsMap(lotteryCodes, now);

  sections.forEach((section) => {
    section.markets = (section.markets || []).map((market) => {
      const lotteryCode = MARKET_ID_TO_LOTTERY_CODE[market.id];
      const lotteryType = lotteryTypeByCode.get(lotteryCode);
      const drawAt = getScheduledDrawAt(lotteryType, market.resultDate);

      if (!lotteryCode || !drawAt || drawAt.getTime() <= now.getTime()) {
        return market;
      }

      const fallback = latestResultByCode.get(lotteryCode);
      if (!fallback?.result) {
        return {
          ...market,
          resultDate: '',
          headline: '',
          numbers: [],
          sourceUrl: '',
          status: 'waiting'
        };
      }

      const fallbackResult = fallback.result;
      const nextNumbers = (market.numbers || [])
        .map((item) => ({
          ...item,
          value: resolveStoredValueByLabel(item.label, fallbackResult)
        }))
        .filter((item) => stringValue(item.value));

      const nextHeadline = fallbackResult.headline || fallbackResult.firstPrize || fallbackResult.twoBottom || '';

      return {
        ...market,
        resultDate: fallback.roundCode || market.resultDate,
        headline: nextHeadline,
        numbers: nextNumbers,
        sourceUrl: fallbackResult.sourceUrl || market.sourceUrl,
        status: marketStatus(nextHeadline, nextNumbers)
      };
    });
  });
};

const applyGovernmentFromLocal = async (sections) => {
  const latest = await LotteryResult.findOne().sort({ roundDate: -1 });
  if (!latest) return false;

  setMarketData(sections, 'government', buildMarket({
    id: 'thai-government',
    name: 'รัฐบาลไทย',
    provider: 'internal',
    resultDate: latest.roundDate,
    headline: latest.firstPrize,
    numbers: [
      { label: '3 ตัวบน', value: tailDigits(latest.firstPrize, 3) },
      { label: '2 ตัวบน', value: tailDigits(latest.firstPrize, 2) },
      { label: '3 ตัวหน้า', value: mergeUniqueValues(latest.threeTopList || []).join(' / ') },
      { label: '3 ตัวล่าง', value: mergeUniqueValues(latest.threeBotList || []).join(' / ') },
      { label: '2 ตัวล่าง', value: latest.twoBottom || '' }
    ],
    note: latest.isCalculated ? 'ผลในระบบคำนวณแล้ว' : 'ผลในระบบพร้อมใช้งาน'
  }));

  return true;
};

const applyThaiGovernmentMarket = async (sections) => {
  const market = await fetchLatestThaiGovernmentMarket();
  if (!market) {
    return false;
  }

  setMarketData(sections, 'government', market);
  return true;
};

const applyBaacMarket = async (sections) => {
  const market = await fetchLatestBaacMarket();
  if (!market) {
    return false;
  }

  setMarketData(sections, 'government', market);
  return true;
};

const applyLaosMarket = async (sections) => {
  const market = await fetchLatestLaosMarket();
  if (!market) {
    return false;
  }

  setMarketData(sections, 'international', market);
  return true;
};

const applyLaosVipMarket = async (sections) => {
  const market = await fetchLatestLaosVipMarket();
  if (!market) {
    return false;
  }

  setMarketData(sections, 'international', market);
  return true;
};

const applyManyCaiStandardMarket = (sections, config, payload) => {
  const row = getLatestManyCaiRow(payload);
  if (!row) {
    return false;
  }

  const firstPrize = compactDigits(row?.code?.code);
  const fourDigits = compactDigits(row?.code?.code_last4);
  const threeDigits = compactDigits(row?.code?.code_last3) || tailDigits(firstPrize, 3);
  const twoTopDigits = compactDigits(row?.code?.code_last2) || tailDigits(firstPrize, 2);
  const twoBottomDigits =
    tailDigits(row?.code?.code1, 2) ||
    twoDigitScalar(row?.code?.code2) ||
    compactDigits(row?.code?.code_pre2) ||
    compactDigits(row?.code?.code_mid2);

  if (!firstPrize && !threeDigits && !twoTopDigits && !twoBottomDigits) {
    return false;
  }

  setMarketData(sections, config.sectionId, buildMarket({
    id: config.marketId,
    name: config.name,
    provider: PROVIDER_NAME,
    resultDate: formatIssueDate(row.officialissue || row.issue, row.opendate),
    headline: firstPrize || threeDigits || twoTopDigits || twoBottomDigits,
    numbers: [
      { label: '4 ตัวบน', value: fourDigits },
      { label: '3 ตัวบน', value: threeDigits },
      { label: '2 ตัวบน', value: twoTopDigits },
      { label: '2 ตัวล่าง', value: twoBottomDigits }
    ],
    note: row.opendate ? `เปิดผล ${row.opendate}` : 'อัปเดตจาก ManyCai'
  }));

  return true;
};

const applyManyCaiStockMarket = (sections, config, payload) => {
  const row = getLatestManyCaiRow(payload);
  if (!row) {
    return false;
  }

  const threeDigits = compactDigits(row?.code?.code);
  const twoTopDigits = tailDigits(threeDigits, 2);
  const twoBottomDigits = compactDigits(row?.code?.code1);

  if (!threeDigits && !twoTopDigits && !twoBottomDigits) {
    return false;
  }

  setMarketData(sections, config.sectionId, buildMarket({
    id: config.marketId,
    name: config.name,
    provider: PROVIDER_NAME,
    resultDate: formatIssueDate(row.officialissue || row.issue, row.opendate),
    headline: threeDigits || twoTopDigits || twoBottomDigits,
    numbers: [
      { label: '3 ตัวบน', value: threeDigits },
      { label: '2 ตัวบน', value: twoTopDigits },
      { label: '2 ตัวล่าง', value: twoBottomDigits }
    ],
    note: row.opendate ? `เปิดผล ${row.opendate}` : 'อัปเดตจาก ManyCai'
  }));

  return true;
};

const applyManyCaiBaacMarket = (sections, config, payload) => {
  const row = getLatestManyCaiRow(payload);
  if (!row) {
    return false;
  }

  const firstPrize = compactDigits(row?.code?.code);
  const threeDigits = tailDigits(firstPrize, 3);
  const twoTopDigits = tailDigits(firstPrize, 2);
  const twoBottomDigits = middleDigits(firstPrize, 2);

  if (!firstPrize && !threeDigits && !twoTopDigits && !twoBottomDigits) {
    return false;
  }

  setMarketData(sections, config.sectionId, buildMarket({
    id: config.marketId,
    name: config.name,
    provider: PROVIDER_NAME,
    resultDate: formatIssueDate(row.officialissue || row.issue, row.opendate),
    headline: firstPrize || threeDigits || twoTopDigits || twoBottomDigits,
    numbers: [
      { label: '3 ตัวบน', value: threeDigits },
      { label: '2 ตัวบน', value: twoTopDigits },
      { label: '2 ตัวล่าง', value: twoBottomDigits }
    ],
    note: row.opendate ? `เปิดผล ${row.opendate}` : 'อัปเดตจาก ManyCai'
  }));

  return true;
};

const applyGsbMarket = async (sections) => {
  const market = await fetchGsbLatestMarket();
  if (!market) {
    return false;
  }

  setMarketData(sections, 'government', market);
  return true;
};

const applyLaosPathanaMarket = async (sections) => {
  const market = await fetchLatestLaosPathanaMarketNormalized();
  if (!market) {
    return false;
  }

  setMarketData(sections, 'international', market);
  return true;
};

const applyLaosRedcrossMarket = async (sections) => {
  const market = await fetchLatestLaosRedcrossMarket();
  if (!market) {
    return false;
  }

  setMarketData(sections, 'international', market);
  return true;
};

const applyLaosTvMarket = async (sections) => {
  const market = await fetchLatestLaosTvMarket();
  if (!market) {
    return false;
  }

  setMarketData(sections, 'international', market);
  return true;
};

const applyLaosHdMarket = async (sections) => {
  const market = await fetchLatestLaosHdMarket();
  if (!market) {
    return false;
  }

  setMarketData(sections, 'international', market);
  return true;
};

const applyLaosExtraMarket = async (sections) => {
  const market = await fetchLatestLaosExtraMarket();
  if (!market) {
    return false;
  }

  setMarketData(sections, 'international', market);
  return true;
};

const applyLaosStarsMarket = async (sections) => {
  const market = await fetchLatestLaosStarsMarket();
  if (!market) {
    return false;
  }

  setMarketData(sections, 'international', market);
  return true;
};

const applyLaosStarsVipMarket = async (sections) => {
  const market = await fetchLatestLaosStarsVipMarket();
  if (!market) {
    return false;
  }

  setMarketData(sections, 'international', market);
  return true;
};

const applyLaosUnionMarket = async (sections) => {
  const market = await fetchLatestLaosUnionMarket();
  if (!market) {
    return false;
  }

  setMarketData(sections, 'international', market);
  return true;
};

const applyLaosUnionVipMarket = async (sections) => {
  const market = await fetchLatestLaosUnionVipMarket();
  if (!market) {
    return false;
  }

  setMarketData(sections, 'international', market);
  return true;
};

const applyLaosAseanMarket = async (sections) => {
  const market = await fetchLatestLaosAseanMarket();
  if (!market) {
    return false;
  }

  setMarketData(sections, 'international', market);
  return true;
};

const applyHanoiExtraMarket = async (sections) => {
  const market = await fetchLatestHanoiExtraMarket();
  if (!market) {
    return false;
  }

  setMarketData(sections, 'international', market);
  return true;
};

const applyHanoiStarMarket = async (sections) => {
  const market = await fetchLatestHanoiStarMarket();
  if (!market) {
    return false;
  }

  setMarketData(sections, 'international', market);
  return true;
};

const applyHanoiDevelopMarket = async (sections) => {
  const market = await fetchLatestHanoiDevelopMarket();
  if (!market) {
    return false;
  }

  setMarketData(sections, 'international', market);
  return true;
};

const applyHanoiHdMarket = async (sections) => {
  const market = await fetchLatestHanoiHdMarket();
  if (!market) {
    return false;
  }

  setMarketData(sections, 'international', market);
  return true;
};

const applyHanoiTvMarket = async (sections) => {
  const market = await fetchLatestHanoiTvMarket();
  if (!market) {
    return false;
  }

  setMarketData(sections, 'international', market);
  return true;
};

const applyHanoiRedcrossMarket = async (sections) => {
  const market = await fetchLatestHanoiRedcrossMarket();
  if (!market) {
    return false;
  }

  setMarketData(sections, 'international', market);
  return true;
};

const applyHanoiUnionMarket = async (sections) => {
  const market = await fetchLatestHanoiUnionMarket();
  if (!market) {
    return false;
  }

  setMarketData(sections, 'international', market);
  return true;
};

const applyHanoiAseanMarket = async (sections) => {
  const market = await fetchLatestHanoiAseanMarket();
  if (!market) {
    return false;
  }

  setMarketData(sections, 'international', market);
  return true;
};

const applyChinaMorningVipMarket = async (sections) => {
  const market = await fetchLatestChinaMorningVipMarket();
  if (!market) {
    return false;
  }

  setMarketData(sections, 'stocks', market);
  return true;
};

const applyChinaAfternoonVipMarket = async (sections) => {
  const market = await fetchLatestChinaAfternoonVipMarket();
  if (!market) {
    return false;
  }

  setMarketData(sections, 'stocks', market);
  return true;
};

const applyNikkeiMorningVipMarket = async (sections) => {
  const market = await fetchLatestNikkeiMorningVipMarket();
  if (!market) {
    return false;
  }

  setMarketData(sections, 'stocks', market);
  return true;
};

const applyHsiMorningVipMarket = async (sections) => {
  const market = await fetchLatestHsiMorningVipMarket();
  if (!market) {
    return false;
  }

  setMarketData(sections, 'stocks', market);
  return true;
};

const applyHsiAfternoonVipMarket = async (sections) => {
  const market = await fetchLatestHsiAfternoonVipMarket();
  if (!market) {
    return false;
  }

  setMarketData(sections, 'stocks', market);
  return true;
};

const applyNikkeiAfternoonVipMarket = async (sections) => {
  const market = await fetchLatestNikkeiAfternoonVipMarket();
  if (!market) {
    return false;
  }

  setMarketData(sections, 'stocks', market);
  return true;
};

const applyEnglandVipMarket = async (sections) => {
  const market = await fetchLatestEnglandVipMarket();
  if (!market) {
    return false;
  }

  setMarketData(sections, 'stocks', market);
  return true;
};

const applyGermanyVipMarket = async (sections) => {
  const market = await fetchLatestGermanyVipMarket();
  if (!market) {
    return false;
  }

  setMarketData(sections, 'stocks', market);
  return true;
};

const applyRussiaVipMarket = async (sections) => {
  const market = await fetchLatestRussiaVipMarket();
  if (!market) {
    return false;
  }

  setMarketData(sections, 'stocks', market);
  return true;
};

const applySingaporeVipMarket = async (sections) => {
  const market = await fetchLatestSingaporeVipMarket();
  if (!market) {
    return false;
  }

  setMarketData(sections, 'stocks', market);
  return true;
};

const applyTaiwanVipMarket = async (sections) => {
  const market = await fetchLatestTaiwanVipMarket();
  if (!market) {
    return false;
  }

  setMarketData(sections, 'stocks', market);
  return true;
};

const applyKoreaVipMarket = async (sections) => {
  const market = await fetchLatestKoreaVipMarket();
  if (!market) {
    return false;
  }

  setMarketData(sections, 'stocks', market);
  return true;
};

const applyDowjonesVipMarket = async (sections) => {
  const market = await fetchLatestDowjonesVipMarket();
  if (!market) {
    return false;
  }

  setMarketData(sections, 'stocks', market);
  return true;
};

const buildSummary = (sections) => {
  const markets = sections.flatMap((section) => section.markets);
  const liveCount = markets.filter((market) => market.status === 'live').length;
  const pendingCount = markets.filter((market) => market.status === 'pending').length;
  const unsupportedCount = markets.filter((market) => market.status === 'unsupported').length;

  return {
    totalMarkets: markets.length,
    liveCount,
    pendingCount,
    unsupportedCount
  };
};

const createOverviewPayload = ({ sections, warnings, fetchedAt = new Date().toISOString() }) => {
  const displaySections = groupSectionsForDisplay(sections);

  return {
    provider: {
      name: PROVIDER_NAME,
      configured: true,
      baseUrl: 'db://market-overview-snapshot',
      fetchedAt,
      cacheTtlMs: CACHE_TTL_MS,
      mode: 'db-snapshot'
    },
    summary: buildSummary(displaySections),
    warnings,
    sections: displaySections
  };
};

const createOverviewSnapshotDocument = (overview) => ({
  key: MARKET_OVERVIEW_SNAPSHOT_KEY,
  payload: {
    provider: overview?.provider || null,
    summary: overview?.summary || null,
    warnings: Array.isArray(overview?.warnings) ? overview.warnings : [],
    sections: Array.isArray(overview?.sections) ? overview.sections : []
  },
  builtAt: new Date(),
  version: 1
});

const restoreOverviewFromSnapshotDocument = (document) => {
  const payload = document?.payload;
  if (!payload || !Array.isArray(payload.sections)) {
    return null;
  }

  const displaySections = groupSectionsForDisplay(payload.sections);

  return {
    provider: payload.provider || null,
    summary: payload.summary || buildSummary(displaySections),
    warnings: Array.isArray(payload.warnings) ? payload.warnings : [],
    sections: displaySections
  };
};

const buildMarketOverviewFromDb = async () => {
  const sections = cloneSections();
  const lotteryCodes = [...new Set(
    sections
      .flatMap((section) => section.markets || [])
      .map((market) => resolveMarketLotteryCode(market.id))
      .filter(Boolean)
  )];
  const { snapshotByCode } = await buildStoredSnapshotMap(lotteryCodes, new Date());
  hydrateSectionsFromStoredSnapshot(sections, snapshotByCode);

  const waitingMarkets = sections
    .flatMap((section) => section.markets || [])
    .filter((market) => market.status === 'waiting')
    .map((market) => market.name);

  const warnings = [];
  if (waitingMarkets.length) {
    const preview = waitingMarkets.slice(0, 4).join(', ');
    const remaining = waitingMarkets.length - Math.min(waitingMarkets.length, 4);
    warnings.push(
      remaining > 0
        ? `ยังไม่มี snapshot ในระบบสำหรับ ${preview} และอีก ${remaining} ตลาด`
        : `ยังไม่มี snapshot ในระบบสำหรับ ${preview}`
    );
  }

  return createOverviewPayload({
    sections,
    warnings
  });
};

const persistMarketOverviewSnapshot = async (overview) => {
  const snapshotDocument = createOverviewSnapshotDocument(overview);
  await MarketOverviewSnapshot.findOneAndUpdate(
    { key: MARKET_OVERVIEW_SNAPSHOT_KEY },
    snapshotDocument,
    {
      new: true,
      upsert: true,
      setDefaultsOnInsert: true
    }
  );
};

const loadMarketOverviewSnapshot = async () => {
  const document = await MarketOverviewSnapshot.findOne({ key: MARKET_OVERVIEW_SNAPSHOT_KEY }).lean();
  return restoreOverviewFromSnapshotDocument(document);
};

const rebuildMarketOverviewSnapshot = async () => {
  const overview = await buildMarketOverviewFromDb();
  await persistMarketOverviewSnapshot(overview);
  cache.data = overview;
  cache.fetchedAt = Date.now();
  return overview;
};

const runBatchedMarketTasks = async (tasks, batchSize = DEFAULT_MARKET_RESULTS_BATCH_SIZE) => {
  const effectiveBatchSize = Math.max(1, Number(batchSize) || DEFAULT_MARKET_RESULTS_BATCH_SIZE);
  const results = [];

  for (let index = 0; index < tasks.length; index += effectiveBatchSize) {
    const batch = tasks.slice(index, index + effectiveBatchSize);
    const batchResults = await Promise.allSettled(batch.map((task) => task.run()));
    batchResults.forEach((result, batchIndex) => {
      results.push({
        key: batch[batchIndex]?.key || '',
        ...result
      });
    });
  }

  return results;
};

const OFFICIAL_MARKET_TASKS = [
  { key: 'baac', run: applyBaacMarket, warning: 'Unable to fetch BAAC official results.' },
  { key: 'gsb', run: applyGsbMarket, warning: 'Unable to fetch GSB official results.' },
  { key: 'lao', run: applyLaosMarket, warning: 'Unable to fetch Lao official results.' },
  { key: 'lao_vip', run: applyLaosVipMarket, warning: 'Unable to fetch Lao VIP official results.' },
  { key: 'lao_pathana', run: applyLaosPathanaMarket, warning: 'Unable to fetch Lao Pathana official results.' },
  { key: 'lao_redcross', run: applyLaosRedcrossMarket, warning: 'Unable to fetch Lao Redcross official results.' },
  { key: 'lao_tv', run: applyLaosTvMarket, warning: 'Unable to fetch Lao TV official results.' },
  { key: 'lao_hd', run: applyLaosHdMarket, warning: 'Unable to fetch Lao HD official results.' },
  { key: 'lao_extra', run: applyLaosExtraMarket, warning: 'Unable to fetch Lao Extra official results.' },
  { key: 'lao_star', run: applyLaosStarsMarket, warning: 'Unable to fetch Lao Star official results.' },
  { key: 'lao_star_vip', run: applyLaosStarsVipMarket, warning: 'Unable to fetch Lao Star VIP official results.' },
  { key: 'lao_union', run: applyLaosUnionMarket, warning: 'Unable to fetch Lao Union official results.' },
  { key: 'lao_union_vip', run: applyLaosUnionVipMarket, warning: 'Unable to fetch Lao Union VIP official results.' },
  { key: 'lao_asean', run: applyLaosAseanMarket, warning: 'Unable to fetch Lao ASEAN official results.' },
  { key: 'hanoi_extra', run: applyHanoiExtraMarket, warning: 'Unable to fetch Hanoi Extra official results.' },
  { key: 'hanoi_star', run: applyHanoiStarMarket, warning: 'Unable to fetch Hanoi Star official results.' },
  { key: 'hanoi_develop', run: applyHanoiDevelopMarket, warning: 'Unable to fetch Hanoi Develop official results.' },
  { key: 'hanoi_hd', run: applyHanoiHdMarket, warning: 'Unable to fetch Hanoi HD official results.' },
  { key: 'hanoi_tv', run: applyHanoiTvMarket, warning: 'Unable to fetch Hanoi TV official results.' },
  { key: 'hanoi_redcross', run: applyHanoiRedcrossMarket, warning: 'Unable to fetch Hanoi Redcross official results.' },
  { key: 'hanoi_union', run: applyHanoiUnionMarket, warning: 'Unable to fetch Hanoi Union official results.' },
  { key: 'hanoi_asean', run: applyHanoiAseanMarket, warning: 'Unable to fetch Hanoi ASEAN official results.' },
  { key: 'china_morning_vip', run: applyChinaMorningVipMarket, warning: 'Unable to fetch China Morning VIP official results.' },
  { key: 'china_afternoon_vip', run: applyChinaAfternoonVipMarket, warning: 'Unable to fetch China Afternoon VIP official results.' },
  { key: 'hsi_morning_vip', run: applyHsiMorningVipMarket, warning: 'Unable to fetch HSI Morning VIP official results.' },
  { key: 'hsi_afternoon_vip', run: applyHsiAfternoonVipMarket, warning: 'Unable to fetch HSI Afternoon VIP official results.' },
  { key: 'nikkei_morning_vip', run: applyNikkeiMorningVipMarket, warning: 'Unable to fetch Nikkei Morning VIP official results.' },
  { key: 'nikkei_afternoon_vip', run: applyNikkeiAfternoonVipMarket, warning: 'Unable to fetch Nikkei Afternoon VIP official results.' },
  { key: 'england_vip', run: applyEnglandVipMarket, warning: 'Unable to fetch England VIP official results.' },
  { key: 'germany_vip', run: applyGermanyVipMarket, warning: 'Unable to fetch Germany VIP official results.' },
  { key: 'russia_vip', run: applyRussiaVipMarket, warning: 'Unable to fetch Russia VIP official results.' },
  { key: 'korea_vip', run: applyKoreaVipMarket, warning: 'Unable to fetch Korea VIP official results.' },
  { key: 'taiwan_vip', run: applyTaiwanVipMarket, warning: 'Unable to fetch Taiwan VIP official results.' },
  { key: 'singapore_vip', run: applySingaporeVipMarket, warning: 'Unable to fetch Singapore VIP official results.' },
  { key: 'dowjones_vip', run: applyDowjonesVipMarket, warning: 'Unable to fetch Dow Jones VIP official results.' }
];

const getMarketOverview = async () => {
  if (cache.data && Date.now() - cache.fetchedAt < CACHE_TTL_MS) {
    return cache.data;
  }

  const persistedOverview = await loadMarketOverviewSnapshot();
  if (persistedOverview) {
    cache.data = persistedOverview;
    cache.fetchedAt = Date.now();
    return persistedOverview;
  }

  return rebuildMarketOverviewSnapshot();
};

const getMarketById = async (marketId) => {
  const overview = await getMarketOverview();

  for (const section of overview.sections || []) {
    const market = (section.markets || []).find((entry) => entry.id === marketId);
    if (market) {
      return {
        ...market,
        sectionId: section.id,
        sectionTitle: section.title,
        providerConfigured: market.provider !== PROVIDER_NAME || overview.provider?.configured
      };
    }
  }

  return null;
};

module.exports = {
  getMarketOverview,
  getMarketById,
  rebuildMarketOverviewSnapshot,
  __test: {
    DEFAULT_MARKET_RESULTS_CACHE_MS,
    DEFAULT_MARKET_RESULTS_BATCH_SIZE,
    runBatchedMarketTasks,
    cloneSectionsForTest: cloneSections,
    groupSectionsForDisplay,
    hydrateSectionsFromStoredSnapshot,
    createOverviewSnapshotDocument,
    restoreOverviewFromSnapshotDocument
  }
};
