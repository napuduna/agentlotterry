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

const sortSlipItemsForDisplay = (items = []) =>
  [...items].sort((left, right) => {
    const leftSequence = Number.isFinite(Number(left?.sequence)) ? Number(left.sequence) : Number.MAX_SAFE_INTEGER;
    const rightSequence = Number.isFinite(Number(right?.sequence)) ? Number(right.sequence) : Number.MAX_SAFE_INTEGER;

    if (leftSequence !== rightSequence) {
      return leftSequence - rightSequence;
    }

    const leftCreatedAt = new Date(left?.createdAt || 0).getTime();
    const rightCreatedAt = new Date(right?.createdAt || 0).getTime();
    if (leftCreatedAt !== rightCreatedAt) {
      return leftCreatedAt - rightCreatedAt;
    }

    return String(left?._id || '').localeCompare(String(right?._id || ''));
  });

const aggregateWinningEntries = (items = []) => {
  const grouped = new Map();

  (items || []).forEach((item) => {
    const number = String(item?.number || '').trim();
    const wonAmount = Number(item?.wonAmount || 0);
    const result = String(item?.result || '').trim().toLowerCase();

    if (!number || result !== 'won' || wonAmount <= 0) return;

    const current = grouped.get(number) || {
      number,
      wonAmount: 0,
      hitCount: 0
    };

    current.wonAmount += wonAmount;
    current.hitCount += 1;
    grouped.set(number, current);
  });

  return [...grouped.values()].sort((left, right) => left.number.localeCompare(right.number));
};

const prioritizeWinningNumbers = (numbers = [], winningEntries = []) => {
  const winningSet = new Set((winningEntries || []).map((entry) => String(entry?.number || '').trim()).filter(Boolean));
  return [...numbers].sort((left, right) => {
    const leftWon = winningSet.has(String(left || '').trim()) ? 1 : 0;
    const rightWon = winningSet.has(String(right || '').trim()) ? 1 : 0;

    if (leftWon !== rightWon) {
      return rightWon - leftWon;
    }

    return 0;
  });
};

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
    totalWonAmount: ordered.reduce((sum, item) => sum + Number(item.wonAmount || 0), 0),
    winningEntries: aggregateWinningEntries(ordered),
    items: ordered
  };
};

export const buildSlipDisplayGroups = (items = []) => {
  const grouped = new Map();
  const orderedItems = sortSlipItemsForDisplay(items);

  buildOccurrenceBlocks(orderedItems).forEach((occurrence) => {
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
      totalWonAmount: 0,
      winningEntries: [],
      items: []
    };

    current.numbers.push(summary.number);
    current.totalAmount += summary.totalAmount;
    current.potentialPayout += summary.potentialPayout;
    current.totalWonAmount += summary.totalWonAmount;
    current.winningEntries.push(...summary.winningEntries);
    current.items.push(...summary.items);
    grouped.set(summary.signature, current);
  });

  return [...grouped.values()].map((group, index) => {
    const winningEntries = aggregateWinningEntries(
      group.winningEntries.map((entry) => ({
        number: entry.number,
        wonAmount: entry.wonAmount,
        result: 'won'
      }))
    );
    const orderedNumbers = prioritizeWinningNumbers(group.numbers, winningEntries);
    const sortOrder = Math.min(
      ...group.items
        .map((item) => betTypeMeta[item.betType]?.order)
        .filter((value) => Number.isFinite(value))
    );

    return {
      ...group,
      key: `${group.key}-${index}`,
      numbersText: orderedNumbers.join(' '),
      itemCount: group.items.length,
      winningEntries,
      hasWinningEntries: winningEntries.length > 0,
      sortOrder: Number.isFinite(sortOrder) ? sortOrder : 999
    };
  }).sort((left, right) => {
    if (left.hasWinningEntries !== right.hasWinningEntries) {
      return left.hasWinningEntries ? -1 : 1;
    }

    if (left.sortOrder !== right.sortOrder) {
      return left.sortOrder - right.sortOrder;
    }

    return left.key.localeCompare(right.key);
  });
};
