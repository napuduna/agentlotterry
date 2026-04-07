const betTypeMeta = {
  '3top': { familyLabel: '3ตัว', shortLabel: 'บน', order: 1 },
  '3front': { familyLabel: '3ตัว', shortLabel: 'หน้า', order: 2 },
  '3bottom': { familyLabel: '3ตัว', shortLabel: 'ล่าง', order: 3 },
  '3tod': { familyLabel: '3ตัว', shortLabel: 'โต๊ด', order: 4 },
  '2top': { familyLabel: '2ตัว', shortLabel: 'บน', order: 5 },
  '2bottom': { familyLabel: '2ตัว', shortLabel: 'ล่าง', order: 6 },
  '2tod': { familyLabel: '2ตัว', shortLabel: 'โต๊ด', order: 7 },
  'run_top': { familyLabel: 'วิ่ง', shortLabel: 'บน', order: 8 },
  'run_bottom': { familyLabel: 'วิ่ง', shortLabel: 'ล่าง', order: 9 },
  'lao_set4': { familyLabel: 'หวยชุดลาว', shortLabel: '4ตัว', order: 10 }
};

const normalizeDigits = (value) => String(value || '').replace(/\D/g, '');

const orderOccurrenceItems = (items = []) =>
  [...items]
    .filter((item) => betTypeMeta[item.betType])
    .sort((left, right) => betTypeMeta[left.betType].order - betTypeMeta[right.betType].order);

const buildOccurrenceBlocks = (items = []) => {
  const blocks = [];
  let current = null;

  (items || []).forEach((item) => {
    const number = String(item?.number || '').trim();
    if (!number || !betTypeMeta[item?.betType]) return;

    if (!current || current.number !== number || current.seenBetTypes.has(item.betType)) {
      if (current?.items?.length) {
        blocks.push({ number: current.number, items: current.items });
      }

      current = {
        number,
        items: [],
        seenBetTypes: new Set()
      };
    }

    current.items.push(item);
    current.seenBetTypes.add(item.betType);
  });

  if (current?.items?.length) {
    blocks.push({ number: current.number, items: current.items });
  }

  return blocks;
};

const summarizeOccurrence = ({ number, items }) => {
  const ordered = orderOccurrenceItems(items);
  if (!ordered.length) {
    return null;
  }

  return {
    key: `${normalizeDigits(number) || number}-${ordered.map((item) => `${item.betType}:${Number(item.amount || 0)}`).join('|')}`,
    signature: ordered.map((item) => `${item.betType}:${Number(item.amount || 0)}`).join('|'),
    familyLabel: betTypeMeta[ordered[0].betType].familyLabel,
    comboLabel: ordered.map((item) => betTypeMeta[item.betType].shortLabel).join(' x '),
    amountLabel: ordered.map((item) => Number(item.amount || 0)).join(' x '),
    number: String(number || ''),
    totalAmount: ordered.reduce((sum, item) => sum + Number(item.amount || 0), 0),
    potentialPayout: ordered.reduce((sum, item) => sum + (Number(item.amount || 0) * Number(item.payRate || 0)), 0),
    items: ordered
  };
};

export const buildSlipDisplayGroups = (items = []) => {
  const grouped = new Map();

  buildOccurrenceBlocks(items).forEach((occurrence) => {
    const summary = summarizeOccurrence(occurrence);
    if (!summary) return;

    const current = grouped.get(summary.signature) || {
      key: summary.signature,
      familyLabel: summary.familyLabel,
      comboLabel: summary.comboLabel,
      amountLabel: summary.amountLabel,
      numbers: [],
      totalAmount: 0,
      potentialPayout: 0,
      items: []
    };

    current.numbers.push(summary.number);
    current.totalAmount += summary.totalAmount;
    current.potentialPayout += summary.potentialPayout;
    current.items.push(...summary.items);
    grouped.set(summary.signature, current);
  });

  return [...grouped.values()].map((group, index) => ({
    ...group,
    key: `${group.key}-${index}`,
    numbersText: group.numbers.join(' '),
    itemCount: group.items.length
  }));
};
