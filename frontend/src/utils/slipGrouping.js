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

const compareNumberText = (left, right) => {
  const leftDigits = normalizeDigits(left);
  const rightDigits = normalizeDigits(right);

  if (leftDigits && rightDigits && leftDigits.length === rightDigits.length) {
    return Number(leftDigits) - Number(rightDigits);
  }

  return String(left || '').localeCompare(String(right || ''), 'th');
};

const summarizeNumberItems = (number, items) => {
  const ordered = [...items]
    .filter((item) => betTypeMeta[item.betType])
    .sort((left, right) => betTypeMeta[left.betType].order - betTypeMeta[right.betType].order);

  if (!ordered.length) {
    return null;
  }

  const signature = ordered.map((item) => `${item.betType}:${Number(item.amount || 0)}`).join('|');

  return {
    key: `${normalizeDigits(number) || number}-${signature}`,
    signature,
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
  const perNumber = new Map();

  items.forEach((item) => {
    const numberKey = String(item.number || '').trim();
    if (!numberKey) return;
    const current = perNumber.get(numberKey) || [];
    current.push(item);
    perNumber.set(numberKey, current);
  });

  const grouped = new Map();

  [...perNumber.entries()]
    .sort(([left], [right]) => compareNumberText(left, right))
    .forEach(([number, numberItems]) => {
      const summary = summarizeNumberItems(number, numberItems);
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
    numbers: [...group.numbers].sort(compareNumberText),
    numbersText: [...group.numbers].sort(compareNumberText).join(' '),
    itemCount: group.items.length
  }));
};
