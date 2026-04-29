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
const buildDraftWinNumbersSource = extractFunction('buildDraftWinNumbers');

const buildDraftWinNumbers = new Function(`
  ${dedupeOrderedNumbersSource}
  ${buildDraftWinNumbersSource}
  return buildDraftWinNumbers;
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

console.log('testOperatorBettingWinHelpers passed');
