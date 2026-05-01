const assert = require('assert');

const { normalizeRoundTimingPayload, selectCatalogActiveRound } = require('../services/catalogService');

assert.strictEqual(
  typeof normalizeRoundTimingPayload,
  'function',
  'Expected normalizeRoundTimingPayload to be exported'
);
assert.strictEqual(
  typeof selectCatalogActiveRound,
  'function',
  'Expected selectCatalogActiveRound to be exported'
);

const drawAt = new Date('2026-04-20T14:00:00.000Z');
const normalized = normalizeRoundTimingPayload({
  openAt: '2026-04-19T10:00:00.000Z',
  closeAt: '2026-04-20T13:30:00.000Z'
}, { drawAt });

assert.strictEqual(normalized.openAt.toISOString(), '2026-04-19T10:00:00.000Z');
assert.strictEqual(normalized.closeAt.toISOString(), '2026-04-20T13:30:00.000Z');

const rescheduledDraw = normalizeRoundTimingPayload({
  openAt: '2026-04-19T10:00:00.000Z',
  closeAt: '2026-04-21T13:30:00.000Z',
  drawAt: '2026-04-21T14:00:00.000Z'
}, { drawAt });

assert.strictEqual(rescheduledDraw.openAt.toISOString(), '2026-04-19T10:00:00.000Z');
assert.strictEqual(rescheduledDraw.closeAt.toISOString(), '2026-04-21T13:30:00.000Z');
assert.strictEqual(rescheduledDraw.drawAt.toISOString(), '2026-04-21T14:00:00.000Z');

assert.throws(
  () => normalizeRoundTimingPayload({
    openAt: '2026-04-20T13:30:00.000Z',
    closeAt: '2026-04-20T13:30:00.000Z'
  }, { drawAt }),
  /openAt must be before closeAt/
);

assert.throws(
  () => normalizeRoundTimingPayload({
    openAt: '2026-04-20T13:30:00.000Z',
    closeAt: '2026-04-20T14:30:00.000Z'
  }, { drawAt }),
  /closeAt must be before or equal to drawAt/
);

assert.throws(
  () => normalizeRoundTimingPayload({
    openAt: '2026-04-19T10:00:00.000Z',
    closeAt: '2026-04-21T14:30:00.000Z',
    drawAt: '2026-04-21T14:00:00.000Z'
  }, { drawAt }),
  /closeAt must be before or equal to drawAt/
);

assert.throws(
  () => normalizeRoundTimingPayload({
    openAt: 'not-a-date',
    closeAt: '2026-04-20T13:30:00.000Z'
  }, { drawAt }),
  /openAt must be a valid date/
);

const postponedThaiGovernmentRound = {
  code: '2026-05-01',
  openAt: new Date('2026-04-24T09:00:00.000Z'),
  closeAt: new Date('2026-05-01T08:30:00.000Z'),
  drawAt: new Date('2026-05-01T09:00:00.000Z'),
  resultPublishedAt: null,
  bettingOverride: 'auto'
};
const nextThaiGovernmentRound = {
  code: '2026-05-16',
  openAt: new Date('2026-05-09T09:00:00.000Z'),
  closeAt: new Date('2026-05-16T08:30:00.000Z'),
  drawAt: new Date('2026-05-16T09:00:00.000Z'),
  resultPublishedAt: null,
  bettingOverride: 'auto'
};

assert.strictEqual(
  selectCatalogActiveRound(
    [postponedThaiGovernmentRound, nextThaiGovernmentRound],
    new Date('2026-05-01T10:00:00.000Z')
  )?.code,
  '2026-05-01',
  'Expected recently overdue unpublished round to remain selected before the next round'
);

assert.strictEqual(
  selectCatalogActiveRound(
    [
      { ...postponedThaiGovernmentRound, resultPublishedAt: new Date('2026-05-01T10:30:00.000Z') },
      nextThaiGovernmentRound
    ],
    new Date('2026-05-01T10:00:00.000Z')
  )?.code,
  '2026-05-16',
  'Expected published old round to allow the next round selection'
);

console.log('Round timing validation tests passed');
