import { toNumber } from '../../utils/formatters';

const getRateProfileById = (lottery, rateProfileId) =>
  (lottery.availableRateProfiles || []).find((profile) => profile.id === rateProfileId);

const getDefaultRateProfileId = (bootstrap) => {
  const defaults = bootstrap?.defaults || {};
  return defaults.defaultRateProfileId ||
    bootstrap?.rateProfiles?.find((profile) => profile.isDefault)?.id ||
    bootstrap?.rateProfiles?.[0]?.id ||
    '';
};

const buildRateProfileState = (lottery, rateProfileId) => {
  const selectedProfile = getRateProfileById(lottery, rateProfileId);
  const selectedRates = selectedProfile?.rates;
  const nextRates = selectedRates && Object.keys(selectedRates).length
    ? selectedRates
    : lottery.customRates || {};
  const useCustomRates = Boolean(selectedProfile?.isAgentCustom);

  return {
    rateProfileId,
    useCustomRates,
    customRates: { ...nextRates }
  };
};

const cloneLotterySettings = (lotteries = [], defaults = {}) =>
  lotteries.map((lottery) => ({
    lotteryTypeId: lottery.lotteryTypeId,
    lotteryCode: lottery.lotteryCode,
    lotteryName: lottery.lotteryName,
    lotteryShortName: lottery.lotteryShortName,
    leagueName: lottery.leagueName,
    leagueCode: lottery.leagueCode,
    supportedBetTypes: [...(lottery.supportedBetTypes || [])],
    enabledBetTypes: [...(lottery.enabledBetTypes || lottery.supportedBetTypes || [])],
    isEnabled: lottery.isEnabled ?? true,
    rateProfileId: lottery.rateProfileId || lottery.availableRateProfiles?.[0]?.id || '',
    minimumBet: lottery.minimumBet ?? defaults.minimumBet ?? 1,
    maximumBet: lottery.maximumBet ?? defaults.maximumBet ?? 10000,
    maximumPerNumber: lottery.maximumPerNumber ?? defaults.maximumPerNumber ?? 10000,
    stockPercent: lottery.stockPercent ?? defaults.stockPercent ?? 0,
    ownerPercent: lottery.ownerPercent ?? defaults.ownerPercent ?? 0,
    keepPercent: lottery.keepPercent ?? defaults.keepPercent ?? 0,
    commissionRate: lottery.commissionRate ?? defaults.commissionRate ?? 0,
    useCustomRates: lottery.useCustomRates ?? defaults.useCustomRates ?? false,
    customRates: { ...(lottery.customRates || lottery.availableRateProfiles?.[0]?.rates || {}) },
    keepMode: lottery.keepMode ?? defaults.keepMode ?? 'off',
    keepCapAmount: lottery.keepCapAmount ?? defaults.keepCapAmount ?? 0,
    blockedNumbers: [...(lottery.blockedNumbers || [])],
    notes: lottery.notes || '',
    availableRateProfiles: [...(lottery.availableRateProfiles || [])]
  }));

export const createInitialMemberForm = (bootstrap) => {
  const defaults = bootstrap?.defaults || {};
  const defaultRateProfileId = getDefaultRateProfileId(bootstrap);

  return {
    account: {
      username: '',
      password: '',
      name: '',
      phone: ''
    },
    profile: {
      stockPercent: defaults.stockPercent ?? 0,
      ownerPercent: defaults.ownerPercent ?? 0,
      keepPercent: defaults.keepPercent ?? 0,
      commissionRate: defaults.commissionRate ?? 0,
      defaultRateProfileId,
      status: 'active',
      notes: ''
    },
    lotterySettings: cloneLotterySettings(bootstrap?.lotteries || [], defaults)
  };
};

export const createMemberFormFromDetail = (detail, bootstrap) => {
  const defaults = bootstrap?.defaults || {};
  const defaultRateProfileId = detail?.member?.defaultRateProfileId || getDefaultRateProfileId(bootstrap);

  return {
    account: {
      username: detail?.member?.username || '',
      password: '',
      name: detail?.member?.name || '',
      phone: detail?.member?.phone || ''
    },
    profile: {
      stockPercent: detail?.member?.stockPercent ?? 0,
      ownerPercent: detail?.member?.ownerPercent ?? 0,
      keepPercent: detail?.member?.keepPercent ?? 0,
      commissionRate: detail?.member?.commissionRate ?? 0,
      defaultRateProfileId,
      status: detail?.member?.status || 'active',
      notes: detail?.member?.notes || ''
    },
    lotterySettings: cloneLotterySettings(detail?.lotteryConfigs || bootstrap?.lotteries || [], defaults)
  };
};

export const applyProfileToLotterySettings = (form) => ({
  ...form,
  lotterySettings: (form?.lotterySettings || []).map((lottery) => ({
    ...lottery,
    stockPercent: form?.profile?.stockPercent,
    ownerPercent: form?.profile?.ownerPercent,
    keepPercent: form?.profile?.keepPercent,
    commissionRate: form?.profile?.commissionRate
  }))
});

export const buildMemberFormPayload = (form) => ({
  account: { ...form.account },
  profile: {
    ...form.profile,
    stockPercent: toNumber(form.profile.stockPercent),
    ownerPercent: toNumber(form.profile.ownerPercent),
    keepPercent: toNumber(form.profile.keepPercent),
    commissionRate: toNumber(form.profile.commissionRate)
  },
  lotterySettings: (form.lotterySettings || []).map((lottery) => ({
    lotteryTypeId: lottery.lotteryTypeId,
    isEnabled: lottery.isEnabled,
    rateProfileId: lottery.rateProfileId,
    enabledBetTypes: lottery.enabledBetTypes,
    minimumBet: toNumber(lottery.minimumBet),
    maximumBet: toNumber(lottery.maximumBet),
    maximumPerNumber: toNumber(lottery.maximumPerNumber),
    stockPercent: toNumber(lottery.stockPercent),
    ownerPercent: toNumber(lottery.ownerPercent),
    keepPercent: toNumber(lottery.keepPercent),
    commissionRate: toNumber(lottery.commissionRate),
    useCustomRates: Boolean(lottery.useCustomRates),
    customRates: lottery.customRates,
    keepMode: lottery.keepMode,
    keepCapAmount: toNumber(lottery.keepCapAmount),
    blockedNumbers: lottery.blockedNumbers,
    notes: lottery.notes
  }))
});

export const updateLotterySetting = (lotterySettings, lotteryTypeId, patch) =>
  lotterySettings.map((lottery) =>
    lottery.lotteryTypeId === lotteryTypeId
      ? {
        ...lottery,
        ...('rateProfileId' in patch ? buildRateProfileState(lottery, patch.rateProfileId) : {}),
        ...patch
      }
      : lottery
  );

export const toggleBetType = (lotterySettings, lotteryTypeId, betType) =>
  lotterySettings.map((lottery) => {
    if (lottery.lotteryTypeId !== lotteryTypeId) {
      return lottery;
    }

    const exists = lottery.enabledBetTypes.includes(betType);
    const nextTypes = exists
      ? lottery.enabledBetTypes.filter((item) => item !== betType)
      : [...lottery.enabledBetTypes, betType];

    return {
      ...lottery,
      enabledBetTypes: nextTypes.length ? nextTypes : [...lottery.supportedBetTypes]
    };
  });

export const groupLotterySettingsByLeague = (lotterySettings) =>
  lotterySettings.reduce((acc, lottery) => {
    const key = lottery.leagueName || 'Other';
    acc[key] = acc[key] || [];
    acc[key].push(lottery);
    return acc;
  }, {});
