require('dotenv').config({ path: require('path').join(__dirname, '..', '..', '.env') });

const assert = require('assert');
const axios = require('axios');
const mongoose = require('mongoose');
const { spawn } = require('child_process');
const path = require('path');

const AuditLog = require('../models/AuditLog');
const BetItem = require('../models/BetItem');
const BetSlip = require('../models/BetSlip');
const CreditLedgerEntry = require('../models/CreditLedgerEntry');
const DrawRound = require('../models/DrawRound');
const LotteryResult = require('../models/LotteryResult');
const LotteryType = require('../models/LotteryType');
const ResultRecord = require('../models/ResultRecord');
const User = require('../models/User');
const UserLotteryConfig = require('../models/UserLotteryConfig');
const { buildDirectMongoUri } = require('../utils/mongoUri');

const backendDir = path.join(__dirname, '..', '..');
const port = process.env.E2E_PORT || '5052';
const baseURL = `http://127.0.0.1:${port}/api`;
const uniqueSuffix = Date.now().toString().slice(-6);
const shouldStartServer = process.env.E2E_SKIP_SERVER !== '1';

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const toId = (value) => value?._id?.toString?.() || value?.toString?.() || '';

const makeClient = (token = '') =>
  axios.create({
    baseURL,
    validateStatus: () => true,
    headers: token ? { Authorization: `Bearer ${token}` } : {}
  });

const expectStatus = (response, expected, label) => {
  if (response.status !== expected) {
    throw new Error(`${label} failed with status ${response.status}: ${JSON.stringify(response.data)}`);
  }
};

const waitForServer = async () => {
  const client = makeClient();

  for (let attempt = 0; attempt < 60; attempt++) {
    try {
      const response = await client.get('/health');
      if (response.status === 200) {
        return;
      }
    } catch {}

    await sleep(1000);
  }

  throw new Error('Server did not become healthy in time');
};

const loginWithRetry = async (username, password, label) => {
  const client = makeClient();

  for (let attempt = 0; attempt < 20; attempt++) {
    const response = await client.post('/auth/login', { username, password });
    if (response.status === 200) {
      return response.data;
    }

    await sleep(1000);
  }

  throw new Error(`${label} login failed`);
};

const flattenLotteries = (overview) =>
  (overview.leagues || []).flatMap((league) => league.lotteries || []);

const buildMemberLotterySettings = ({ bootstrap, enabledLotteryId }) =>
  (bootstrap.lotteries || []).map((lottery) => ({
    lotteryTypeId: lottery.lotteryTypeId,
    isEnabled: lottery.lotteryTypeId === enabledLotteryId,
    rateProfileId: lottery.availableRateProfiles?.[0]?.id || lottery.rateProfileId || '',
    enabledBetTypes: lottery.lotteryTypeId === enabledLotteryId
      ? lottery.supportedBetTypes.filter((betType) => ['3top', '2top'].includes(betType))
      : lottery.supportedBetTypes.slice(0, 1),
    minimumBet: 1,
    maximumBet: 50,
    maximumPerNumber: 50,
    stockPercent: 10,
    ownerPercent: 5,
    keepPercent: 5,
    commissionRate: 2,
    useCustomRates: lottery.lotteryTypeId === enabledLotteryId,
    customRates: {
      '3top': 987,
      '3tod': 654,
      '2top': 87,
      '2bottom': 92,
      'run_top': 4,
      'run_bottom': 3
    },
    keepMode: 'cap',
    keepCapAmount: 200,
    blockedNumbers: ['123'],
    notes: 'E2E regression member config'
  }));

const formatBangkokDate = (date) =>
  new Intl.DateTimeFormat('sv-SE', {
    timeZone: 'Asia/Bangkok',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).format(date);

const makeRegressionRoundCode = async (lotteryTypeId) => {
  for (let offset = 1; offset <= 20; offset++) {
    const date = new Date(Date.now() + offset * 24 * 60 * 60 * 1000);
    const code = formatBangkokDate(date);
    const exists = await DrawRound.exists({ lotteryTypeId, code });
    if (!exists) {
      return code;
    }
  }

  throw new Error('Unable to find a unique regression round code');
};

const ensureRegressionRound = async () => {
  const lotteryType = await LotteryType.findOne({ code: 'thai_government' }).select('_id code name');
  if (!lotteryType) {
    throw new Error('thai_government lottery type was not found');
  }

  const roundCode = await makeRegressionRoundCode(lotteryType._id);
  const now = new Date();
  const round = await DrawRound.create({
    lotteryTypeId: lotteryType._id,
    code: roundCode,
    title: `Regression ${roundCode}`,
    openAt: new Date(now.getTime() - 60 * 60 * 1000),
    closeAt: new Date(now.getTime() + 30 * 60 * 1000),
    drawAt: new Date(now.getTime() + 60 * 60 * 1000),
    status: 'open',
    isActive: true
  });

  return {
    lotteryTypeId: lotteryType._id.toString(),
    lotteryCode: lotteryType.code,
    roundId: round._id.toString(),
    roundCode
  };
};

const killProcess = async (child) => {
  if (!child || child.killed || child.exitCode !== null) return;

  try {
    child.kill();
  } catch {}

  await sleep(1500);
};

const cleanupRegressionArtifacts = async (created = {}) => {
  const groupIds = (created.walletGroupIds || []).filter(Boolean);
  const targets = [
    created.agentId,
    created.memberId,
    created.slipId,
    created.roundCode,
    ...groupIds
  ].filter(Boolean);

  if (groupIds.length) {
    await CreditLedgerEntry.deleteMany({ groupId: { $in: groupIds } });
  }

  if (created.roundId) {
    await BetItem.deleteMany({ drawRoundId: created.roundId });
    await BetSlip.deleteMany({ drawRoundId: created.roundId });
    await ResultRecord.deleteMany({ drawRoundId: created.roundId });
    await DrawRound.deleteOne({ _id: created.roundId });
  }

  if (created.roundCode) {
    await LotteryResult.deleteMany({ roundDate: created.roundCode });
  }

  if (created.memberId) {
    await UserLotteryConfig.deleteMany({ userId: created.memberId });
    await User.deleteOne({ _id: created.memberId });
  }

  if (created.agentId) {
    await User.deleteOne({ _id: created.agentId });
  }

  if (targets.length) {
    await AuditLog.deleteMany({ target: { $in: targets.map(String) } });
  }
};

const main = async () => {
  const summary = {
    startedAt: new Date().toISOString(),
    port,
    checks: [],
    created: {},
    warnings: []
  };

  let server;
  let adminToken = '';
  let agentToken = '';
  let memberToken = '';
  const created = {
    walletGroupIds: []
  };

  try {
    if (!process.env.MONGODB_URI) {
      throw new Error('MONGODB_URI is missing');
    }

    const mongoUri = await buildDirectMongoUri(process.env.MONGODB_URI);
    await mongoose.connect(mongoUri);
    created.round = await ensureRegressionRound();
    created.roundId = created.round.roundId;
    created.roundCode = created.round.roundCode;
    summary.created.round = created.round;

    if (shouldStartServer) {
      server = spawn(process.execPath, ['server.js'], {
        cwd: backendDir,
        env: {
          ...process.env,
          PORT: port
        },
        stdio: ['ignore', 'pipe', 'pipe']
      });
    }

    await waitForServer();
    summary.checks.push('health');

    const adminLogin = await loginWithRetry('admin', 'admin123', 'Admin');
    adminToken = adminLogin.token;
    summary.checks.push('admin-login');

    const adminClient = makeClient(adminToken);
    const agentUsername = `e2e_reg_agent_${uniqueSuffix}`;
    const agentPassword = `Bb${uniqueSuffix}!`;
    const memberUsername = `e2e_reg_member_${uniqueSuffix}`;
    const memberPassword = `Bb${uniqueSuffix}!`;

    const createAgentResponse = await adminClient.post('/admin/agents', {
      username: agentUsername,
      password: agentPassword,
      name: `E2E Regression Agent ${uniqueSuffix}`,
      phone: '0991111111'
    });
    expectStatus(createAgentResponse, 201, 'Create agent');
    created.agentId = createAgentResponse.data._id || createAgentResponse.data.id;
    summary.created.agent = { id: created.agentId, username: agentUsername };
    summary.checks.push('admin-create-agent');

    const adjustAgentCreditResponse = await adminClient.post('/wallet/adjust', {
      targetUserId: created.agentId,
      amount: 300,
      note: 'E2E regression agent funding',
      reasonCode: 'agent_topup'
    });
    expectStatus(adjustAgentCreditResponse, 201, 'Adjust agent credit');
    created.walletGroupIds.push(adjustAgentCreditResponse.data.groupId);
    summary.checks.push('admin-adjust-agent-credit');

    const agentLogin = await loginWithRetry(agentUsername, agentPassword, 'Agent');
    agentToken = agentLogin.token;
    summary.checks.push('agent-login');

    const agentClient = makeClient(agentToken);
    const [bootstrapResponse, agentCatalogResponse, agentHeartbeatResponse] = await Promise.all([
      agentClient.get('/agent/config/bootstrap'),
      agentClient.get('/catalog/overview'),
      agentClient.post('/presence/heartbeat')
    ]);
    expectStatus(bootstrapResponse, 200, 'Agent bootstrap');
    expectStatus(agentCatalogResponse, 200, 'Agent catalog overview');
    expectStatus(agentHeartbeatResponse, 200, 'Agent heartbeat');
    summary.checks.push('agent-bootstrap');
    summary.checks.push('agent-catalog-overview');
    summary.checks.push('agent-heartbeat');

    const thaiGovernmentLottery = flattenLotteries(agentCatalogResponse.data).find(
      (lottery) => lottery.code === created.round.lotteryCode
    );
    assert(thaiGovernmentLottery, 'Thai government lottery was not exposed in catalog overview');

    const createMemberResponse = await agentClient.post('/agent/members', {
      account: {
        username: memberUsername,
        password: memberPassword,
        name: `E2E Regression Member ${uniqueSuffix}`,
        phone: '0881111111',
        memberCode: `RGR${uniqueSuffix}`
      },
      profile: {
        creditBalance: 0,
        stockPercent: 10,
        ownerPercent: 5,
        keepPercent: 5,
        commissionRate: 2,
        defaultRateProfileId: bootstrapResponse.data.rateProfiles?.[0]?.id || '',
        status: 'active',
        notes: 'E2E regression member'
      },
      lotterySettings: buildMemberLotterySettings({
        bootstrap: bootstrapResponse.data,
        enabledLotteryId: thaiGovernmentLottery.id || thaiGovernmentLottery.lotteryTypeId
      })
    });
    expectStatus(createMemberResponse, 201, 'Create member');
    created.memberId = createMemberResponse.data.member?.id || createMemberResponse.data.member?._id || createMemberResponse.data.id;
    summary.created.member = { id: created.memberId, username: memberUsername };
    summary.checks.push('agent-create-member');

    const transferToMemberResponse = await agentClient.post('/wallet/transfer', {
      memberId: created.memberId,
      amount: 100,
      direction: 'to_member',
      note: 'E2E regression member funding'
    });
    expectStatus(transferToMemberResponse, 201, 'Transfer credit to member');
    created.walletGroupIds.push(transferToMemberResponse.data.groupId);
    summary.checks.push('agent-transfer-to-member');

    const memberLogin = await loginWithRetry(memberUsername, memberPassword, 'Member');
    memberToken = memberLogin.token;
    summary.checks.push('member-login');

    const memberClient = makeClient(memberToken);
    const [memberHeartbeatResponse, memberCatalogResponse] = await Promise.all([
      memberClient.post('/presence/heartbeat'),
      memberClient.get('/catalog/overview')
    ]);
    expectStatus(memberHeartbeatResponse, 200, 'Member heartbeat');
    expectStatus(memberCatalogResponse, 200, 'Member catalog overview');
    summary.checks.push('member-heartbeat');
    summary.checks.push('member-catalog-overview');

    const visibleLotteries = flattenLotteries(memberCatalogResponse.data);
    assert(visibleLotteries.length === 1, `Expected exactly 1 enabled lottery, found ${visibleLotteries.length}`);
    assert(visibleLotteries[0].code === created.round.lotteryCode, 'Member lottery visibility is incorrect');
    summary.checks.push('member-catalog-filtering');

    const roundsResponse = await memberClient.get('/catalog/rounds', {
      params: { lotteryId: visibleLotteries[0].id }
    });
    expectStatus(roundsResponse, 200, 'Member rounds');
    const regressionRound = (roundsResponse.data || []).find((round) => round.code === created.roundCode);
    assert(regressionRound, 'Regression round was not visible to the member');
    summary.checks.push('member-rounds');

    const memberWalletSelfResponse = await memberClient.get('/wallet/summary');
    expectStatus(memberWalletSelfResponse, 200, 'Member wallet summary');
    assert(Number(memberWalletSelfResponse.data.account?.creditBalance || 0) === 100, 'Member wallet balance should equal 100 after funding');
    summary.checks.push('member-wallet-summary');

    const forbiddenWalletResponse = await memberClient.get('/wallet/summary', {
      params: { targetUserId: created.agentId }
    });
    assert(forbiddenWalletResponse.status === 403, 'Member should not be able to view agent wallet summary');
    summary.checks.push('wallet-access-control');

    const agentViewMemberWalletResponse = await agentClient.get('/wallet/summary', {
      params: { targetUserId: created.memberId }
    });
    expectStatus(agentViewMemberWalletResponse, 200, 'Agent wallet summary for member');
    summary.checks.push('agent-wallet-member-view');

    const insufficientTransferResponse = await agentClient.post('/wallet/transfer', {
      memberId: created.memberId,
      amount: 99999,
      direction: 'to_member',
      note: 'Should fail'
    });
    assert(insufficientTransferResponse.status === 400, 'Oversized transfer should fail');
    summary.checks.push('wallet-insufficient-balance');

    const reverseParseResponse = await memberClient.post('/member/slips/parse', {
      lotteryId: visibleLotteries[0].id,
      roundId: regressionRound.id,
      rateProfileId: visibleLotteries[0].defaultRateProfileId,
      betType: '2top',
      defaultAmount: 5,
      rawInput: '12 5',
      reverse: true,
      includeDoubleSet: false,
      memo: 'reverse parse test'
    });
    expectStatus(reverseParseResponse, 200, 'Reverse parse');
    assert(reverseParseResponse.data.items.length === 2, 'Reverse parse should generate exactly 2 items');
    assert(reverseParseResponse.data.items.every((item) => item.payRate === 87), 'Reverse parse should use custom 2top rate');
    summary.checks.push('member-parse-reverse');

    const doubleSetParseResponse = await memberClient.post('/member/slips/parse', {
      lotteryId: visibleLotteries[0].id,
      roundId: regressionRound.id,
      rateProfileId: visibleLotteries[0].defaultRateProfileId,
      betType: '2top',
      defaultAmount: 2,
      rawInput: '',
      reverse: false,
      includeDoubleSet: true,
      memo: 'double set test'
    });
    expectStatus(doubleSetParseResponse, 200, 'Double set parse');
    assert(doubleSetParseResponse.data.items.length === 10, 'Double-set helper should generate 10 repeated-digit numbers');
    summary.checks.push('member-parse-double-set');

    const submitSlipResponse = await memberClient.post('/member/slips', {
      lotteryId: visibleLotteries[0].id,
      roundId: regressionRound.id,
      rateProfileId: visibleLotteries[0].defaultRateProfileId,
      betType: '3top',
      defaultAmount: 10,
      rawInput: '456 10',
      reverse: false,
      includeDoubleSet: false,
      memo: 'winning regression slip',
      action: 'submit'
    });
    expectStatus(submitSlipResponse, 201, 'Submit slip');
    created.slipId = submitSlipResponse.data.id;
    summary.created.slip = { id: created.slipId, slipNumber: submitSlipResponse.data.slipNumber };
    summary.checks.push('member-submit-slip');

    const pendingReportResponse = await agentClient.get('/agent/reports', {
      params: {
        roundDate: created.roundCode,
        marketId: created.round.lotteryCode
      }
    });
    expectStatus(pendingReportResponse, 200, 'Agent reports before settlement');
    assert((pendingReportResponse.data.pendingRows || []).some((item) => item.slipId === created.slipId), 'Pending report should include submitted slip');
    summary.checks.push('agent-report-pending-before-result');

    const saveResultResponse = await adminClient.post('/lottery/manual', {
      roundDate: created.roundCode,
      firstPrize: '123456',
      twoBottom: '56',
      runTop: ['4', '5', '6'],
      runBottom: ['5', '6']
    });
    expectStatus(saveResultResponse, 200, 'Manual result save');
    assert(Number(saveResultResponse.data.settlement?.wonCount || 0) >= 1, 'Settlement should mark at least one winning item');
    summary.checks.push('admin-manual-result');

    const [slipDetailAfterResult, roundResultResponse, recentResultsResponse] = await Promise.all([
      memberClient.get(`/member/slips/${created.slipId}`),
      memberClient.get(`/results/round/${regressionRound.id}`),
      memberClient.get('/results/recent', { params: { lotteryId: visibleLotteries[0].id, limit: 10 } })
    ]);
    expectStatus(slipDetailAfterResult, 200, 'Slip detail after result');
    expectStatus(roundResultResponse, 200, 'Round result');
    expectStatus(recentResultsResponse, 200, 'Recent results');

    const winningItem = (slipDetailAfterResult.data.items || []).find((item) => item.number === '456');
    assert(winningItem, 'Winning slip item not found in slip detail');
    assert(winningItem.result === 'won', 'Winning item should be marked won');
    assert(winningItem.isLocked === true, 'Winning item should be locked after settlement');
    assert(Number(winningItem.wonAmount || 0) === 9870, 'Winning amount should equal 10 * 987');
    assert(roundResultResponse.data.threeTop === '456', 'Round result should expose 3top=456');
    assert((recentResultsResponse.data || []).some((item) => item.roundCode === created.roundCode), 'Recent results should include regression round');
    summary.checks.push('member-slip-result');
    summary.checks.push('results-round');
    summary.checks.push('results-recent');

    const summaryResponse = await memberClient.get('/member/reports/summary', {
      params: { roundCode: created.roundCode, marketId: created.round.lotteryCode }
    });
    expectStatus(summaryResponse, 200, 'Member summary after result');
    assert(Number(summaryResponse.data.overall?.totalWon || 0) >= 9870, 'Member summary should include winning amount');
    summary.checks.push('member-summary-after-result');

    const cancelAfterSettlementResponse = await memberClient.post(`/member/slips/${created.slipId}/cancel`);
    assert(cancelAfterSettlementResponse.status === 400, 'Settled slip should not be cancellable');
    summary.checks.push('member-cancel-blocked-after-result');

    const transferBackResponse = await agentClient.post('/wallet/transfer', {
      memberId: created.memberId,
      amount: 20,
      direction: 'from_member',
      note: 'Collect partial credit back'
    });
    expectStatus(transferBackResponse, 201, 'Transfer credit from member');
    created.walletGroupIds.push(transferBackResponse.data.groupId);
    summary.checks.push('agent-transfer-from-member');

    const [agentWalletAfterTransfers, memberWalletAfterTransfers, memberWalletCreditHistory] = await Promise.all([
      agentClient.get('/wallet/summary'),
      memberClient.get('/wallet/summary'),
      memberClient.get('/wallet/history', {
        params: {
          direction: 'credit',
          entryType: 'transfer',
          limit: 20
        }
      })
    ]);
    expectStatus(agentWalletAfterTransfers, 200, 'Agent wallet after transfers');
    expectStatus(memberWalletAfterTransfers, 200, 'Member wallet after transfers');
    expectStatus(memberWalletCreditHistory, 200, 'Member filtered wallet history');
    assert(Number(agentWalletAfterTransfers.data.account?.creditBalance || 0) === 220, 'Agent wallet should be 220 after to_member and from_member transfers');
    assert(Number(memberWalletAfterTransfers.data.account?.creditBalance || 0) === 80, 'Member wallet should be 80 after transfers');
    assert((memberWalletCreditHistory.data || []).some((entry) => entry.groupId === transferToMemberResponse.data.groupId), 'Filtered wallet history should include inbound transfer');
    summary.checks.push('wallet-history-filter');

    const winnerReportResponse = await agentClient.get('/agent/reports', {
      params: {
        roundDate: created.roundCode,
        marketId: created.round.lotteryCode
      }
    });
    expectStatus(winnerReportResponse, 200, 'Agent reports after settlement');
    assert(!(winnerReportResponse.data.pendingRows || []).some((item) => item.slipId === created.slipId), 'Pending report should exclude settled slip');
    assert((winnerReportResponse.data.winnerRows || []).some((item) => item.slipId === created.slipId), 'Winner report should include settled winning slip');
    summary.checks.push('agent-winner-report');

    const resettleResponse = await adminClient.post('/lottery/manual', {
      roundDate: created.roundCode,
      firstPrize: '123456',
      twoBottom: '56',
      runTop: ['4', '5', '6'],
      runBottom: ['5', '6']
    });
    expectStatus(resettleResponse, 200, 'Manual result resettle');
    assert(Number(resettleResponse.data.settlement?.wonCount || 0) >= 1, 'Resettlement should still report a winner');
    summary.checks.push('result-resettlement');

    const submitAfterResultResponse = await memberClient.post('/member/slips', {
      lotteryId: visibleLotteries[0].id,
      roundId: regressionRound.id,
      rateProfileId: visibleLotteries[0].defaultRateProfileId,
      betType: '3top',
      defaultAmount: 10,
      rawInput: '789 10',
      reverse: false,
      includeDoubleSet: false,
      memo: 'should fail after result',
      action: 'submit'
    });
    assert(submitAfterResultResponse.status === 400, 'Submitting after round result should fail');
    summary.checks.push('member-submit-blocked-after-result');

    console.log(JSON.stringify({
      ok: true,
      ...summary,
      finishedAt: new Date().toISOString()
    }, null, 2));
  } catch (error) {
    console.error(JSON.stringify({
      ok: false,
      ...summary,
      error: error.message,
      finishedAt: new Date().toISOString()
    }, null, 2));
    process.exitCode = 1;
  } finally {
    try {
      await cleanupRegressionArtifacts(created);
    } catch (cleanupError) {
      console.error(`Cleanup error: ${cleanupError.message}`);
      process.exitCode = process.exitCode || 1;
    }

    if (mongoose.connection.readyState) {
      await mongoose.disconnect();
    }

    await killProcess(server);
  }
};

main();
