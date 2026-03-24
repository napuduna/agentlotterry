const axios = require('axios');
const LotteryResult = require('../models/LotteryResult');

const PROVIDER_NAME = 'manycai';
const PROVIDER_BASE_URL = (process.env.MANYCAI_BASE_URL || 'http://vip.manycai.com').replace(/\/$/, '');
const PROVIDER_KEY = process.env.MANYCAI_API_KEY || '';
const CACHE_TTL_MS = Number(process.env.MARKET_RESULTS_CACHE_MS || 60000);

const cache = {
  data: null,
  fetchedAt: 0
};

const MANYCAI_MARKETS = [
  { code: 'ynhn', marketId: 'hanoi-normal', name: 'ฮานอย', sectionId: 'international', type: 'standard' },
  { code: 'ltzc', marketId: 'lao', name: 'หวยลาว', sectionId: 'international', type: 'standard' },
  { code: 'ynma', marketId: 'malay', name: 'มาเลย์', sectionId: 'international', type: 'standard' },
  { code: 'gsth', marketId: 'stock-thai-evening', name: 'หุ้นไทย', sectionId: 'stocks', type: 'stock' }
];

const baseSections = [
  {
    id: 'government',
    title: 'รัฐบาล',
    description: 'หวยรัฐบาลและผลที่ใช้บ่อยในระบบ',
    markets: [
      { id: 'thai-government', name: 'รัฐบาลไทย', provider: 'internal', status: 'waiting', resultDate: '', headline: '', numbers: [], note: 'รอข้อมูลล่าสุด' },
      { id: 'baac', name: 'ธกส', provider: PROVIDER_NAME, status: 'unsupported', resultDate: '', headline: '', numbers: [], note: 'ยังไม่มีแหล่งข้อมูลที่เชื่อมต่อในระบบตอนนี้' },
      { id: 'gsb', name: 'ออมสิน', provider: PROVIDER_NAME, status: 'unsupported', resultDate: '', headline: '', numbers: [], note: 'ยังไม่มีแหล่งข้อมูลที่เชื่อมต่อในระบบตอนนี้' }
    ]
  },
  {
    id: 'international',
    title: 'หวยต่างประเทศ',
    description: 'ข้อมูลจาก ManyCai สำหรับตลาดที่เปิดใช้แล้ว',
    markets: [
      { id: 'hanoi-special', name: 'ฮานอยพิเศษ', provider: PROVIDER_NAME, status: 'unsupported', resultDate: '', headline: '', numbers: [], note: 'ยังไม่ได้เปิดใช้ ManyCai สำหรับตลาดนี้' },
      { id: 'hanoi-normal', name: 'ฮานอย', provider: PROVIDER_NAME, status: 'waiting', resultDate: '', headline: '', numbers: [], note: 'รอข้อมูลจากผู้ให้บริการ' },
      { id: 'hanoi-vip', name: 'ฮานอย VIP', provider: PROVIDER_NAME, status: 'unsupported', resultDate: '', headline: '', numbers: [], note: 'ยังไม่ได้เปิดใช้ ManyCai สำหรับตลาดนี้' },
      { id: 'lao', name: 'หวยลาว', provider: PROVIDER_NAME, status: 'waiting', resultDate: '', headline: '', numbers: [], note: 'รอข้อมูลจากผู้ให้บริการ' },
      { id: 'malay', name: 'มาเลย์', provider: PROVIDER_NAME, status: 'waiting', resultDate: '', headline: '', numbers: [], note: 'รอข้อมูลจากผู้ให้บริการ' }
    ]
  },
  {
    id: 'minor',
    title: 'หวยรายย่อย',
    description: 'รายการที่ต้อง map provider หรือ source เพิ่มเติมในลำดับถัดไป',
    markets: [
      { id: 'minor-hanoi-toyoda', name: 'ฮานอยทอยดา', provider: PROVIDER_NAME, status: 'unsupported', resultDate: '', headline: '', numbers: [], note: 'ยังไม่มี endpoint ที่เชื่อมต่อแล้วในระบบ' },
      { id: 'minor-hanoi-specific', name: 'ฮานอยเฉพาะกิจ', provider: PROVIDER_NAME, status: 'unsupported', resultDate: '', headline: '', numbers: [], note: 'ยังไม่มี endpoint ที่เชื่อมต่อแล้วในระบบ' },
      { id: 'minor-hanoi-unity', name: 'ฮานอยสามัคคี', provider: PROVIDER_NAME, status: 'unsupported', resultDate: '', headline: '', numbers: [], note: 'ยังไม่มี endpoint ที่เชื่อมต่อแล้วในระบบ' },
      { id: 'minor-hanoi-development', name: 'ฮานอยพัฒนา', provider: PROVIDER_NAME, status: 'unsupported', resultDate: '', headline: '', numbers: [], note: 'ยังไม่มี endpoint ที่เชื่อมต่อแล้วในระบบ' },
      { id: 'minor-lao-unity', name: 'ลาวสามัคคี', provider: PROVIDER_NAME, status: 'unsupported', resultDate: '', headline: '', numbers: [], note: 'ยังไม่มี endpoint ที่เชื่อมต่อแล้วในระบบ' },
      { id: 'minor-lao-viet', name: 'ลาวเวียด', provider: PROVIDER_NAME, status: 'unsupported', resultDate: '', headline: '', numbers: [], note: 'ยังไม่มี endpoint ที่เชื่อมต่อแล้วในระบบ' },
      { id: 'minor-lao-vip', name: 'ลาว VIP', provider: PROVIDER_NAME, status: 'unsupported', resultDate: '', headline: '', numbers: [], note: 'ยังไม่มี endpoint ที่เชื่อมต่อแล้วในระบบ' },
      { id: 'minor-lao-unity-vip', name: 'ลาวสามัคคี VIP', provider: PROVIDER_NAME, status: 'unsupported', resultDate: '', headline: '', numbers: [], note: 'ยังไม่มี endpoint ที่เชื่อมต่อแล้วในระบบ' },
      { id: 'minor-lao-4d', name: 'ลาว 4D', provider: PROVIDER_NAME, status: 'unsupported', resultDate: '', headline: '', numbers: [], note: 'ยังไม่มี endpoint ที่เชื่อมต่อแล้วในระบบ' },
      { id: 'minor-lao-star-vip', name: 'ลาวสตาร์ VIP', provider: PROVIDER_NAME, status: 'unsupported', resultDate: '', headline: '', numbers: [], note: 'ยังไม่มี endpoint ที่เชื่อมต่อแล้วในระบบ' },
      { id: 'minor-hanoi-extra', name: 'ฮานอย Extra', provider: PROVIDER_NAME, status: 'unsupported', resultDate: '', headline: '', numbers: [], note: 'ยังไม่มี endpoint ที่เชื่อมต่อแล้วในระบบ' },
      { id: 'minor-hanoi-rich', name: 'ฮานอยรวยนิก', provider: PROVIDER_NAME, status: 'unsupported', resultDate: '', headline: '', numbers: [], note: 'ยังไม่มี endpoint ที่เชื่อมต่อแล้วในระบบ' },
      { id: 'minor-lao-redcross', name: 'ลาวกาชาด', provider: PROVIDER_NAME, status: 'unsupported', resultDate: '', headline: '', numbers: [], note: 'ยังไม่มี endpoint ที่เชื่อมต่อแล้วในระบบ' },
      { id: 'minor-dowjones-star', name: 'ดาวโจนส์ STAR', provider: PROVIDER_NAME, status: 'unsupported', resultDate: '', headline: '', numbers: [], note: 'ยังไม่มี endpoint ที่เชื่อมต่อแล้วในระบบ' },
      { id: 'minor-gold-close', name: 'ทองคำปิด', provider: PROVIDER_NAME, status: 'unsupported', resultDate: '', headline: '', numbers: [], note: 'ยังไม่มี endpoint ที่เชื่อมต่อแล้วในระบบ' }
    ]
  },
  {
    id: 'stocks-vip',
    title: 'หุ้น VIP',
    description: 'ยังไม่ได้เปิดใช้ ManyCai สำหรับตลาดหุ้น VIP',
    markets: [
      { id: 'vip-singapore', name: 'สิงคโปร์ VIP', provider: PROVIDER_NAME, status: 'unsupported', resultDate: '', headline: '', numbers: [], note: 'ยังไม่ได้เปิดใช้ ManyCai สำหรับตลาดนี้' },
      { id: 'vip-england', name: 'อังกฤษ VIP', provider: PROVIDER_NAME, status: 'unsupported', resultDate: '', headline: '', numbers: [], note: 'ยังไม่ได้เปิดใช้ ManyCai สำหรับตลาดนี้' },
      { id: 'vip-germany', name: 'เยอรมัน VIP', provider: PROVIDER_NAME, status: 'unsupported', resultDate: '', headline: '', numbers: [], note: 'ยังไม่ได้เปิดใช้ ManyCai สำหรับตลาดนี้' },
      { id: 'vip-russia', name: 'รัสเซีย VIP', provider: PROVIDER_NAME, status: 'unsupported', resultDate: '', headline: '', numbers: [], note: 'ยังไม่ได้เปิดใช้ ManyCai สำหรับตลาดนี้' },
      { id: 'vip-dowjones', name: 'ดาวโจนส์ VIP', provider: PROVIDER_NAME, status: 'unsupported', resultDate: '', headline: '', numbers: [], note: 'ยังไม่ได้เปิดใช้ ManyCai สำหรับตลาดนี้' },
      { id: 'vip-nikkei', name: 'นิเคอิ VIP', provider: PROVIDER_NAME, status: 'unsupported', resultDate: '', headline: '', numbers: [], note: 'ยังไม่ได้เปิดใช้ ManyCai สำหรับตลาดนี้' },
      { id: 'vip-china-morning', name: 'จีนเช้า VIP', provider: PROVIDER_NAME, status: 'unsupported', resultDate: '', headline: '', numbers: [], note: 'ยังไม่ได้เปิดใช้ ManyCai สำหรับตลาดนี้' },
      { id: 'vip-hangseng', name: 'ฮั่งเส็ง VIP', provider: PROVIDER_NAME, status: 'unsupported', resultDate: '', headline: '', numbers: [], note: 'ยังไม่ได้เปิดใช้ ManyCai สำหรับตลาดนี้' },
      { id: 'vip-taiwan', name: 'ไต้หวัน VIP', provider: PROVIDER_NAME, status: 'unsupported', resultDate: '', headline: '', numbers: [], note: 'ยังไม่ได้เปิดใช้ ManyCai สำหรับตลาดนี้' },
      { id: 'vip-korea', name: 'เกาหลี VIP', provider: PROVIDER_NAME, status: 'unsupported', resultDate: '', headline: '', numbers: [], note: 'ยังไม่ได้เปิดใช้ ManyCai สำหรับตลาดนี้' },
      { id: 'vip-nikkei-afternoon', name: 'นิเคอิบ่าย VIP', provider: PROVIDER_NAME, status: 'unsupported', resultDate: '', headline: '', numbers: [], note: 'ยังไม่ได้เปิดใช้ ManyCai สำหรับตลาดนี้' },
      { id: 'vip-china-afternoon', name: 'จีนบ่าย VIP', provider: PROVIDER_NAME, status: 'unsupported', resultDate: '', headline: '', numbers: [], note: 'ยังไม่ได้เปิดใช้ ManyCai สำหรับตลาดนี้' },
      { id: 'vip-hangseng-afternoon', name: 'ฮั่งเส็งบ่าย VIP', provider: PROVIDER_NAME, status: 'unsupported', resultDate: '', headline: '', numbers: [], note: 'ยังไม่ได้เปิดใช้ ManyCai สำหรับตลาดนี้' }
    ]
  },
  {
    id: 'stocks',
    title: 'หุ้น',
    description: 'ข้อมูลหุ้นจาก ManyCai สำหรับตลาดที่เปิดใช้แล้ว',
    markets: [
      { id: 'stock-singapore', name: 'สิงคโปร์', provider: PROVIDER_NAME, status: 'unsupported', resultDate: '', headline: '', numbers: [], note: 'ยังไม่ได้เปิดใช้ ManyCai สำหรับตลาดนี้' },
      { id: 'stock-thai-evening', name: 'หุ้นไทย', provider: PROVIDER_NAME, status: 'waiting', resultDate: '', headline: '', numbers: [], note: 'รอข้อมูลจากผู้ให้บริการ' },
      { id: 'stock-india', name: 'อินเดีย', provider: PROVIDER_NAME, status: 'unsupported', resultDate: '', headline: '', numbers: [], note: 'ยังไม่ได้เปิดใช้ ManyCai สำหรับตลาดนี้' },
      { id: 'stock-egypt', name: 'อียิปต์', provider: PROVIDER_NAME, status: 'unsupported', resultDate: '', headline: '', numbers: [], note: 'ยังไม่ได้เปิดใช้ ManyCai สำหรับตลาดนี้' },
      { id: 'stock-england', name: 'อังกฤษ', provider: PROVIDER_NAME, status: 'unsupported', resultDate: '', headline: '', numbers: [], note: 'ยังไม่ได้เปิดใช้ ManyCai สำหรับตลาดนี้' },
      { id: 'stock-germany', name: 'เยอรมัน', provider: PROVIDER_NAME, status: 'unsupported', resultDate: '', headline: '', numbers: [], note: 'ยังไม่ได้เปิดใช้ ManyCai สำหรับตลาดนี้' },
      { id: 'stock-russia', name: 'รัสเซีย', provider: PROVIDER_NAME, status: 'unsupported', resultDate: '', headline: '', numbers: [], note: 'ยังไม่ได้เปิดใช้ ManyCai สำหรับตลาดนี้' },
      { id: 'stock-dowjones', name: 'ดาวโจนส์', provider: PROVIDER_NAME, status: 'unsupported', resultDate: '', headline: '', numbers: [], note: 'ยังไม่ได้เปิดใช้ ManyCai สำหรับตลาดนี้' },
      { id: 'stock-nikkei-morning', name: 'นิเคอิเช้า', provider: PROVIDER_NAME, status: 'unsupported', resultDate: '', headline: '', numbers: [], note: 'ยังไม่ได้เปิดใช้ ManyCai สำหรับตลาดนี้' },
      { id: 'stock-china-morning', name: 'จีนเช้า', provider: PROVIDER_NAME, status: 'unsupported', resultDate: '', headline: '', numbers: [], note: 'ยังไม่ได้เปิดใช้ ManyCai สำหรับตลาดนี้' },
      { id: 'stock-hangseng-morning', name: 'ฮั่งเส็งเช้า', provider: PROVIDER_NAME, status: 'unsupported', resultDate: '', headline: '', numbers: [], note: 'ยังไม่ได้เปิดใช้ ManyCai สำหรับตลาดนี้' },
      { id: 'stock-taiwan', name: 'ไต้หวัน', provider: PROVIDER_NAME, status: 'unsupported', resultDate: '', headline: '', numbers: [], note: 'ยังไม่ได้เปิดใช้ ManyCai สำหรับตลาดนี้' },
      { id: 'stock-korea', name: 'เกาหลี', provider: PROVIDER_NAME, status: 'unsupported', resultDate: '', headline: '', numbers: [], note: 'ยังไม่ได้เปิดใช้ ManyCai สำหรับตลาดนี้' },
      { id: 'stock-nikkei-afternoon', name: 'นิเคอิบ่าย', provider: PROVIDER_NAME, status: 'unsupported', resultDate: '', headline: '', numbers: [], note: 'ยังไม่ได้เปิดใช้ ManyCai สำหรับตลาดนี้' },
      { id: 'stock-china-afternoon', name: 'จีนบ่าย', provider: PROVIDER_NAME, status: 'unsupported', resultDate: '', headline: '', numbers: [], note: 'ยังไม่ได้เปิดใช้ ManyCai สำหรับตลาดนี้' },
      { id: 'stock-hangseng-afternoon', name: 'ฮั่งเส็งบ่าย', provider: PROVIDER_NAME, status: 'unsupported', resultDate: '', headline: '', numbers: [], note: 'ยังไม่ได้เปิดใช้ ManyCai สำหรับตลาดนี้' }
    ]
  }
];

const cloneSections = () => baseSections.map((section) => ({
  ...section,
  markets: section.markets.map((market) => ({
    ...market,
    numbers: [...market.numbers]
  }))
}));

const valueFromPath = (source, path) => path.split('.').reduce((current, key) => {
  if (current === null || current === undefined) return undefined;
  return current[key];
}, source);

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

const pickValue = (source, paths) => {
  for (const path of paths) {
    const value = valueFromPath(source, path);
    if (hasValue(value)) {
      return stringValue(value);
    }
  }
  return '';
};

const normalizeName = (name) => stringValue(name).toLowerCase().replace(/\s+/g, '');

const setMarketData = (sections, sectionId, nextMarket) => {
  const section = sections.find((entry) => entry.id === sectionId);
  if (!section) return;

  const marketIndex = section.markets.findIndex((market) => normalizeName(market.name) === normalizeName(nextMarket.name));

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

const formatIssueDate = (issue, openDate) => {
  const normalizedIssue = stringValue(issue).replace(/\D/g, '');
  if (normalizedIssue.length === 8) {
    return `${normalizedIssue.slice(0, 4)}-${normalizedIssue.slice(4, 6)}-${normalizedIssue.slice(6, 8)}`;
  }

  const normalizedOpenDate = stringValue(openDate);
  return normalizedOpenDate ? normalizedOpenDate.slice(0, 10) : '';
};

const fetchProvider = async (code) => {
  const response = await axios.get(`${PROVIDER_BASE_URL}/${PROVIDER_KEY}/${code}.json`, {
    timeout: 12000
  });

  return response.data;
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

const buildMarket = ({ id, name, provider, resultDate, headline, numbers, note }) => ({
  id,
  name,
  provider,
  resultDate: stringValue(resultDate),
  headline: stringValue(headline),
  numbers: buildNumbers(numbers),
  note: stringValue(note),
  status: marketStatus(headline, numbers)
});

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
      { label: '3 ตัวบน', value: latest.firstPrize ? latest.firstPrize.slice(-3) : '' },
      { label: '2 ตัวล่าง', value: latest.twoBottom || '' }
    ],
    note: latest.isCalculated ? 'ผลในระบบคำนวณแล้ว' : 'ผลในระบบพร้อมใช้งาน'
  }));

  return true;
};

const applyManyCaiStandardMarket = (sections, config, payload) => {
  const row = getLatestManyCaiRow(payload);
  if (!row) {
    return false;
  }

  const fullDigits = compactDigits(row?.code?.code_1);
  const threeDigits = compactDigits(row?.code?.code_last3);
  const twoDigits = compactDigits(row?.code?.code_last2);
  const frontTwoDigits = compactDigits(row?.code?.code_pre2);

  if (!fullDigits && !threeDigits && !twoDigits) {
    return false;
  }

  setMarketData(sections, config.sectionId, buildMarket({
    id: config.marketId,
    name: config.name,
    provider: PROVIDER_NAME,
    resultDate: formatIssueDate(row.officialissue || row.issue, row.opendate),
    headline: fullDigits || threeDigits,
    numbers: [
      { label: '4 ตัว', value: fullDigits },
      { label: '3 ตัวท้าย', value: threeDigits },
      { label: '2 ตัวท้าย', value: twoDigits },
      { label: '2 ตัวหน้า', value: frontTwoDigits }
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
  const twoDigits = compactDigits(row?.code?.code1);

  if (!threeDigits && !twoDigits) {
    return false;
  }

  setMarketData(sections, config.sectionId, buildMarket({
    id: config.marketId,
    name: config.name,
    provider: PROVIDER_NAME,
    resultDate: formatIssueDate(row.officialissue || row.issue, row.opendate),
    headline: threeDigits || twoDigits,
    numbers: [
      { label: '3 ตัว', value: threeDigits },
      { label: '2 ตัว', value: twoDigits }
    ],
    note: row.opendate ? `เปิดผล ${row.opendate}` : 'อัปเดตจาก ManyCai'
  }));

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

const getMarketOverview = async () => {
  if (cache.data && Date.now() - cache.fetchedAt < CACHE_TTL_MS) {
    return cache.data;
  }

  const sections = cloneSections();
  const warnings = [];
  const hasGovernmentData = await applyGovernmentFromLocal(sections);

  if (!hasGovernmentData) {
    warnings.push('ยังไม่มีผลหวยรัฐบาลไทยในระบบฐานข้อมูล');
  }

  if (!PROVIDER_KEY) {
    warnings.push('ยังไม่ได้ตั้งค่า MANYCAI_API_KEY บน backend ตลาดที่ใช้ ManyCai จะแสดงเป็นรอเชื่อมต่อ');

    const fallback = {
      provider: {
        name: PROVIDER_NAME,
        configured: false,
        baseUrl: PROVIDER_BASE_URL,
        fetchedAt: new Date().toISOString(),
        cacheTtlMs: CACHE_TTL_MS
      },
      summary: buildSummary(sections),
      warnings,
      sections
    };

    cache.data = fallback;
    cache.fetchedAt = Date.now();
    return fallback;
  }

  const requests = await Promise.allSettled(MANYCAI_MARKETS.map((market) => fetchProvider(market.code)));

  requests.forEach((result, index) => {
    const market = MANYCAI_MARKETS[index];
    if (!market) {
      return;
    }

    if (result.status !== 'fulfilled') {
      warnings.push(`ไม่สามารถดึงข้อมูล ${market.name} จาก ManyCai ได้`);
      return;
    }

    const hydrated = market.type === 'stock'
      ? applyManyCaiStockMarket(sections, market, result.value)
      : applyManyCaiStandardMarket(sections, market, result.value);

    if (!hydrated) {
      warnings.push(`ไม่สามารถแปลงข้อมูล ${market.name} จาก ManyCai ได้`);
    }
  });

  const overview = {
    provider: {
      name: PROVIDER_NAME,
      configured: true,
      baseUrl: PROVIDER_BASE_URL,
      fetchedAt: new Date().toISOString(),
      cacheTtlMs: CACHE_TTL_MS
    },
    summary: buildSummary(sections),
    warnings,
    sections
  };

  cache.data = overview;
  cache.fetchedAt = Date.now();

  return overview;
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

module.exports = { getMarketOverview, getMarketById };
