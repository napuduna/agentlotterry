import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const componentSource = readFileSync(new URL('../src/pages/shared/OperatorBetting.jsx', import.meta.url), 'utf8');

const extractFunction = (name) => {
  const start = componentSource.indexOf(`const ${name} =`);
  assert.notEqual(start, -1, `${name} should exist`);
  const end = componentSource.indexOf('\n};', start);
  assert.notEqual(end, -1, `${name} should have a plain function terminator`);
  return componentSource.slice(start, end + 3);
};

const dedupeOrderedNumbersSource = extractFunction('dedupeOrderedNumbers');
const buildDraftPermutationsSource = extractFunction('buildDraftPermutations');
const buildDraftWinNumbersSource = extractFunction('buildDraftWinNumbers');
const expandFastDraftNumbersSource = extractFunction('expandFastDraftNumbers');
const buildFastWorkingNumbersSource = extractFunction('buildFastWorkingNumbers');

const { buildDraftWinNumbers, buildFastWorkingNumbers } = new Function(`
  const normalizeDigits = (value) => String(value || '').replace(/\\D/g, '');
  const fastFamilyOptions = [
    { value: '2', label: '2 ตัว', digits: 2, columns: [{ key: 'top', betType: '2top' }, { key: 'bottom', betType: '2bottom' }] },
    { value: '3', label: '3 ตัว', digits: 3, columns: [{ key: 'top', betType: '3top' }, { key: 'front', betType: '3front' }, { key: 'bottom', betType: '3bottom' }, { key: 'tod', betType: '3tod' }] }
  ];
  const getFastFamilyConfig = (fastFamily) => fastFamilyOptions.find((option) => option.value === fastFamily) || fastFamilyOptions[0];
  const buildDraftDoubleSet = () => [];
  const buildDraftRoodNumbers = () => [];
  const extractFastNumbersByDigits = () => [];
  ${dedupeOrderedNumbersSource}
  const extractFastSeedDigits = (rawInput) => dedupeOrderedNumbers(String(rawInput || '').replace(/\\D/g, '').split(''));
  ${buildDraftPermutationsSource}
  ${buildDraftWinNumbersSource}
  ${expandFastDraftNumbersSource}
  ${buildFastWorkingNumbersSource}
  return { buildDraftWinNumbers, buildFastWorkingNumbers };
`)();

assert.deepEqual(
  buildDraftWinNumbers(['1', '2', '3', '4'], 2),
  ['12', '13', '14', '23', '24', '34'],
  'win2 should build ordered front-position combinations without automatic reverse'
);

assert.deepEqual(
  buildDraftWinNumbers(['1', '2', '3', '4'], 3),
  ['123', '124', '134', '234'],
  'win3 should build ordered front-position combinations without automatic reverse'
);

assert.deepEqual(
  buildFastWorkingNumbers({
    fastFamily: '2',
    fastTab: 'win2',
    rawInput: '1234',
    reverse: true,
    includeDoubleSet: false
  }),
  ['12', '21', '13', '31', '14', '41', '23', '32', '24', '42', '34', '43'],
  'win2 should add reversed pairs only after reverse is enabled'
);

assert.deepEqual(
  buildFastWorkingNumbers({
    fastFamily: '3',
    fastTab: 'win3',
    numbers: ['123', '124'],
    reverse: true,
    includeDoubleSet: false
  }),
  ['123', '132', '213', '231', '312', '321', '124', '142', '214', '241', '412', '421'],
  'win3 helper numbers should expand to permutations only after reverse is enabled'
);

console.log('testOperatorBettingWinHelpers passed');
