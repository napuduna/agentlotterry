const assert = require('assert');
const fs = require('fs');
const path = require('path');

const readSource = (relativePath) => fs.readFileSync(path.resolve(__dirname, '..', relativePath), 'utf8');

const userModel = readSource('models/User.js');
const adminRoutes = readSource('routes/adminRoutes.js');
const memberService = readSource('services/memberManagementService.js');
const catalogService = readSource('services/catalogService.js');
const {
  __test: {
    AGENT_CUSTOM_RATE_PROFILE_ID,
    buildAgentRateDefaults,
    buildLotteryConfigDocument,
    mapLotteryConfigRow
  }
} = require('../services/memberManagementService');

assert.match(
  userModel,
  /useCustomRateDefaults/,
  'agent users should store whether custom default payout rates are enabled'
);
assert.match(
  userModel,
  /defaultRates/,
  'agent users should store custom default payout rates by bet type'
);
assert.match(
  adminRoutes,
  /normalizeRateDefaults/,
  'admin agent payload should validate custom payout rates'
);
assert.match(
  adminRoutes,
  /useCustomRateDefaults/,
  'admin agent payload should accept custom payout-rate toggle'
);
assert.match(
  memberService,
  /buildAgentRateDefaults/,
  'member service should derive agent payout-rate defaults'
);
assert.match(
  memberService,
  /applyAgentRateDefaultsToConfig/,
  'member service should apply agent payout-rate defaults when a member has no custom override'
);
assert.match(
  catalogService,
  /getViewerAgentRateDefaults/,
  'betting catalog should expose agent payout-rate defaults to the UI'
);

const globalProfile = {
  _id: { toString: () => 'global-profile' },
  code: 'global',
  name: 'Global',
  description: '',
  isActive: true,
  isDefault: true,
  rates: {
    '2top': 92,
    '2bottom': 92,
    '3top': 900
  },
  commissions: {}
};

const lottery = {
  _id: { toString: () => 'lottery-a' },
  code: 'lottery_a',
  name: 'Lottery A',
  shortName: 'LA',
  supportedBetTypes: ['2top', '2bottom', '3top'],
  rateProfileIds: [globalProfile],
  defaultRateProfileId: globalProfile
};

const member = {
  _id: { toString: () => 'member-a' },
  agentId: { toString: () => 'agent-a' },
  stockPercent: 0,
  ownerPercent: 0,
  keepPercent: 0,
  commissionRate: 0
};

const agentDefaults = buildAgentRateDefaults({
  defaultRateProfileId: globalProfile._id,
  useCustomRateDefaults: true,
  defaultRates: {
    '2top': 81,
    '2bottom': 82,
    '3top': 830
  }
});

const inheritedConfig = buildLotteryConfigDocument({
  member,
  lottery,
  agentDefaults
});

assert.equal(
  inheritedConfig.useCustomRates,
  true,
  'new member lottery configs should inherit custom agent rates'
);
assert.equal(inheritedConfig.customRates['2top'], 81);
assert.equal(inheritedConfig.customRates['2bottom'], 82);
assert.equal(inheritedConfig.customRates['3top'], 830);

const mappedRow = mapLotteryConfigRow({
  lottery,
  config: inheritedConfig,
  agentDefaults
});

assert.equal(
  mappedRow.rateProfileId,
  AGENT_CUSTOM_RATE_PROFILE_ID,
  'agent member UI should select the synthetic custom-rate option'
);
assert.equal(
  mappedRow.availableRateProfiles[0].name,
  'เรทเฉพาะ',
  'agent member UI should show custom-rate option before global rate profiles'
);

console.log('testAgentRateDefaults: ok');
