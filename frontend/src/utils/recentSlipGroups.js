import { formatRoundLabel } from './formatters';

const resolveSlipResult = (currentResult = 'pending', nextResult = 'pending') => {
  if (currentResult === 'pending' || nextResult === 'pending') return 'pending';
  if (currentResult === 'won' || nextResult === 'won') return 'won';
  return 'lost';
};

export const groupRecentBetsBySlip = (
  items = [],
  {
    defaultMarketName = '-',
    resolveMarketName
  } = {}
) => {
  const grouped = new Map();

  items.forEach((bet) => {
    const key = bet.slipId || bet.slipNumber || bet._id;
    const existing = grouped.get(key);

    if (existing) {
      existing.items.push(bet);
      existing.totalAmount += Number(bet.amount || 0);
      existing.totalPotentialPayout += Number(bet.potentialPayout || 0);
      existing.memo = existing.memo || bet.memo || '';
      existing.result = resolveSlipResult(existing.result, bet.result || 'pending');
      return;
    }

    grouped.set(key, {
      key,
      slipId: bet.slipId || '',
      slipNumber: bet.slipNumber || '',
      customer: bet.customerId,
      marketName: resolveMarketName?.(bet) || defaultMarketName,
      roundLabel: formatRoundLabel(bet.roundTitle || bet.roundDate || '-'),
      result: bet.result || 'pending',
      totalAmount: Number(bet.amount || 0),
      totalPotentialPayout: Number(bet.potentialPayout || 0),
      memo: bet.memo || '',
      items: [bet]
    });
  });

  return [...grouped.values()];
};
