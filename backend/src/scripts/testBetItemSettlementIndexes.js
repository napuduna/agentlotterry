const assert = require('assert');
const BetItem = require('../models/BetItem');

const indexKeys = BetItem.schema.indexes().map(([keys]) => keys);
const hasSettlementIndex = indexKeys.some((keys) => (
  keys.drawRoundId === 1 && keys.status === 1 && keys.isLocked === 1
));

assert(hasSettlementIndex, 'BetItem settlement index { drawRoundId, status, isLocked } is required');

console.log('BetItem settlement index checks passed');
