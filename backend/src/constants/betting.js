const BET_TYPES = ['3top', '3front', '3bottom', '3tod', '2top', '2bottom', '2tod', 'run_top', 'run_bottom', 'lao_set4'];

const DEFAULT_GLOBAL_RATES = {
  '3top': 1000,
  '3front': 450,
  '3bottom': 450,
  '3tod': 150,
  '2top': 100,
  '2bottom': 100,
  '2tod': 100,
  'run_top': 3.5,
  'run_bottom': 4.5,
  'lao_set4': 1
};

const LAO_SET_UNIT_PRICE = 120;

const LAO_SET_PRIZE_RATES = {
  fourStraight: 150000,
  threeStraight: 41000,
  fourTod: 5500,
  threeTod: 4100,
  twoFront: 1700,
  twoBack: 1700
};

module.exports = {
  BET_TYPES,
  DEFAULT_GLOBAL_RATES,
  LAO_SET_PRIZE_RATES,
  LAO_SET_UNIT_PRICE
};
