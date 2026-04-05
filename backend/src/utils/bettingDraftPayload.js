const buildDraftScopePayload = (source = {}) => ({
  customerId: source.customerId,
  lotteryId: source.lotteryId,
  roundId: source.roundId,
  rateProfileId: source.rateProfileId || ''
});

module.exports = {
  buildDraftScopePayload
};
