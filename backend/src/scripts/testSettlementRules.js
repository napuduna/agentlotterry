require('dotenv').config({ path: require('path').join(__dirname, '..', '..', '.env') });

const assert = require('assert');
const { checkItemResult, normalizeResultPayload } = require('../services/resultService');

const makeItem = (betType, number) => ({
  betType,
  number,
  amount: 10,
  payRate: 1
});

const main = () => {
  const topBottomResult = normalizeResultPayload({
    threeTopHits: ['187'],
    twoTopHits: ['87'],
    twoBottomHits: ['15']
  });

  assert.strictEqual(checkItemResult(makeItem('2top', '87'), topBottomResult), true, '2top should win on exact top hit');
  assert.strictEqual(checkItemResult(makeItem('2bottom', '87'), topBottomResult), false, '2bottom should not win from top hit');
  assert.strictEqual(checkItemResult(makeItem('2top', '15'), topBottomResult), false, '2top should not win from bottom hit');
  assert.strictEqual(checkItemResult(makeItem('2bottom', '15'), topBottomResult), true, '2bottom should win on exact bottom hit');
  assert.strictEqual(checkItemResult(makeItem('2tod', '78'), topBottomResult), true, '2tod should win when top digits match regardless of order');
  assert.strictEqual(checkItemResult(makeItem('2tod', '87'), topBottomResult), true, '2tod should also win on same ordered top digits');
  assert.strictEqual(checkItemResult(makeItem('2tod', '51'), topBottomResult), false, '2tod should not win from bottom result digits');
  assert.strictEqual(checkItemResult(makeItem('2top', '88'), topBottomResult), false, '2top 88 should not win when top result is 87');
  assert.strictEqual(checkItemResult(makeItem('2bottom', '88'), topBottomResult), false, '2bottom 88 should not win when bottom result is 15');
  assert.strictEqual(checkItemResult(makeItem('2tod', '88'), topBottomResult), false, '2tod 88 should not win when top result is 87');
  assert.strictEqual(checkItemResult(makeItem('2top', '78'), topBottomResult), false, '2top 78 should not win when only tod digits match');
  assert.strictEqual(checkItemResult(makeItem('2bottom', '78'), topBottomResult), false, '2bottom 78 should not win when only tod digits match');
  assert.strictEqual(checkItemResult(makeItem('2tod', '87'), topBottomResult), true, '2tod 87 should win only as tod when top is 87');

  const duplicateDigitsResult = normalizeResultPayload({
    twoTopHits: ['88'],
    twoBottomHits: ['87']
  });

  assert.strictEqual(checkItemResult(makeItem('2top', '88'), duplicateDigitsResult), true, '2top exact duplicate digits should win');
  assert.strictEqual(checkItemResult(makeItem('2bottom', '88'), duplicateDigitsResult), false, '2bottom should not win if only top is 88');
  assert.strictEqual(checkItemResult(makeItem('2tod', '88'), duplicateDigitsResult), true, '2tod should win on exact duplicate digits top result');
  assert.strictEqual(checkItemResult(makeItem('2top', '87'), duplicateDigitsResult), false, '2top should not win from bottom exact hit');
  assert.strictEqual(checkItemResult(makeItem('2bottom', '87'), duplicateDigitsResult), true, '2bottom exact bottom hit should win');

  const separateTopBottomResult = normalizeResultPayload({
    twoTopHits: ['87'],
    twoBottomHits: ['15']
  });

  assert.strictEqual(checkItemResult(makeItem('2top', '87'), separateTopBottomResult), true, 'buying 87 top should win only on exact top 87');
  assert.strictEqual(checkItemResult(makeItem('2bottom', '87'), separateTopBottomResult), false, 'buying 87 bottom should not win when bottom is 15');
  assert.strictEqual(checkItemResult(makeItem('2tod', '78'), separateTopBottomResult), true, 'buying 78 tod should win when top is 87');
  assert.strictEqual(checkItemResult(makeItem('2top', '88'), separateTopBottomResult), false, 'buying 88 top-bottom should not win when result is 87/15');
  assert.strictEqual(checkItemResult(makeItem('2bottom', '88'), separateTopBottomResult), false, 'buying 88 bottom should not win when result is 15');
  assert.strictEqual(checkItemResult(makeItem('2tod', '88'), separateTopBottomResult), false, 'buying 88 tod should not win when top is 87');

  const tod3Result = normalizeResultPayload({
    threeTopHits: ['123']
  });

  assert.strictEqual(checkItemResult(makeItem('3tod', '132'), tod3Result), true, '3tod should win for any permutation of top result');
  assert.strictEqual(checkItemResult(makeItem('3tod', '321'), tod3Result), true, '3tod should win for reverse permutation of top result');
  assert.strictEqual(checkItemResult(makeItem('3tod', '124'), tod3Result), false, '3tod should not win when digits differ');
  assert.strictEqual(checkItemResult(makeItem('3bottom', '123'), tod3Result), false, '3bottom should not win from top-only result');

  console.log('Settlement rule checks passed');
};

main();
