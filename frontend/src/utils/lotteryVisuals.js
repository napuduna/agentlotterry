const LOTTERY_VISUALS = {
  thai_government: {
    shortLabel: 'ไทย',
    accent: '#2563eb',
    background: 'radial-gradient(circle at 30% 30%, #60a5fa, #1d4ed8 68%)'
  },
  baac: {
    shortLabel: 'ธกส',
    accent: '#16a34a',
    background: 'radial-gradient(circle at 30% 30%, #86efac, #15803d 68%)'
  },
  gsb: {
    shortLabel: 'ออม',
    accent: '#dc2626',
    background: 'radial-gradient(circle at 30% 30%, #fca5a5, #b91c1c 72%)'
  },
  'gsb-1year-100': {
    shortLabel: 'ออม',
    accent: '#dc2626',
    background: 'radial-gradient(circle at 30% 30%, #fca5a5, #b91c1c 72%)'
  },
  'hanoi-vip': {
    shortLabel: 'HN',
    accent: '#dc2626',
    background: 'radial-gradient(circle at 30% 30%, #fb7185, #be123c 72%)'
  },
  hanoi_special: {
    shortLabel: 'ฮน',
    accent: '#dc2626',
    background: 'radial-gradient(circle at 30% 30%, #fb7185, #b91c1c 70%)'
  },
  hanoi_extra: {
    shortLabel: 'HX',
    accent: '#f97316',
    background: 'radial-gradient(circle at 30% 30%, #fdba74, #ea580c 72%)'
  },
  hanoi_star: {
    shortLabel: 'HST',
    accent: '#2563eb',
    background: 'radial-gradient(circle at 30% 30%, #93c5fd, #1d4ed8 72%)'
  },
  hanoi_develop: {
    shortLabel: 'HDV',
    accent: '#8b5cf6',
    background: 'radial-gradient(circle at 30% 30%, #c4b5fd, #7c3aed 72%)'
  },
  hanoi_hd: {
    shortLabel: 'HHD',
    accent: '#fb7185',
    background: 'radial-gradient(circle at 30% 30%, #fda4af, #e11d48 72%)'
  },
  hanoi_tv: {
    shortLabel: 'HTV',
    accent: '#06b6d4',
    background: 'radial-gradient(circle at 30% 30%, #67e8f9, #0f766e 72%)'
  },
  hanoi_redcross: {
    shortLabel: 'HRC',
    accent: '#dc2626',
    background: 'radial-gradient(circle at 30% 30%, #fca5a5, #991b1b 72%)'
  },
  hanoi_union: {
    shortLabel: 'HUN',
    accent: '#16a34a',
    background: 'radial-gradient(circle at 30% 30%, #86efac, #166534 72%)'
  },
  hanoi_asean: {
    shortLabel: 'HAS',
    accent: '#2563eb',
    background: 'radial-gradient(circle at 30% 30%, #93c5fd, #1e3a8a 72%)'
  },
  'hanoi-special': {
    shortLabel: 'ฮน',
    accent: '#dc2626',
    background: 'radial-gradient(circle at 30% 30%, #fb7185, #b91c1c 70%)'
  },
  'hanoi-extra': {
    shortLabel: 'HX',
    accent: '#f97316',
    background: 'radial-gradient(circle at 30% 30%, #fdba74, #ea580c 72%)'
  },
  'hanoi-star': {
    shortLabel: 'HST',
    accent: '#2563eb',
    background: 'radial-gradient(circle at 30% 30%, #93c5fd, #1d4ed8 72%)'
  },
  'hanoi-develop': {
    shortLabel: 'HDV',
    accent: '#8b5cf6',
    background: 'radial-gradient(circle at 30% 30%, #c4b5fd, #7c3aed 72%)'
  },
  'hanoi-hd': {
    shortLabel: 'HHD',
    accent: '#fb7185',
    background: 'radial-gradient(circle at 30% 30%, #fda4af, #e11d48 72%)'
  },
  'hanoi-tv': {
    shortLabel: 'HTV',
    accent: '#06b6d4',
    background: 'radial-gradient(circle at 30% 30%, #67e8f9, #0f766e 72%)'
  },
  'hanoi-redcross': {
    shortLabel: 'HRC',
    accent: '#dc2626',
    background: 'radial-gradient(circle at 30% 30%, #fca5a5, #991b1b 72%)'
  },
  'hanoi-union': {
    shortLabel: 'HUN',
    accent: '#16a34a',
    background: 'radial-gradient(circle at 30% 30%, #86efac, #166534 72%)'
  },
  'hanoi-asean': {
    shortLabel: 'HAS',
    accent: '#2563eb',
    background: 'radial-gradient(circle at 30% 30%, #93c5fd, #1e3a8a 72%)'
  },
  'hanoi-specific': {
    shortLabel: 'CQ',
    accent: '#f97316',
    background: 'radial-gradient(circle at 30% 30%, #fdba74, #ea580c 70%)'
  },
  lao: {
    shortLabel: 'ลาว',
    accent: '#0284c7',
    background: 'radial-gradient(circle at 30% 30%, #7dd3fc, #0369a1 72%)'
  },
  lao_vip: {
    shortLabel: 'ลาว',
    accent: '#0891b2',
    background: 'radial-gradient(circle at 30% 30%, #67e8f9, #0f766e 72%)'
  },
  'lao-vip': {
    shortLabel: 'ลาว',
    accent: '#0891b2',
    background: 'radial-gradient(circle at 30% 30%, #67e8f9, #0f766e 72%)'
  },
  lao_pathana: {
    shortLabel: 'LP',
    accent: '#0f766e',
    background: 'radial-gradient(circle at 30% 30%, #86efac, #0f766e 72%)'
  },
  'lao-pathana': {
    shortLabel: 'LP',
    accent: '#0f766e',
    background: 'radial-gradient(circle at 30% 30%, #86efac, #0f766e 72%)'
  },
  lao_redcross: {
    shortLabel: 'RC',
    accent: '#b91c1c',
    background: 'radial-gradient(circle at 30% 30%, #fca5a5, #991b1b 72%)'
  },
  'lao-redcross': {
    shortLabel: 'RC',
    accent: '#b91c1c',
    background: 'radial-gradient(circle at 30% 30%, #fca5a5, #991b1b 72%)'
  },
  lao_tv: {
    shortLabel: 'TV',
    accent: '#f97316',
    background: 'radial-gradient(circle at 30% 30%, #fdba74, #ea580c 72%)'
  },
  'lao-tv': {
    shortLabel: 'TV',
    accent: '#f97316',
    background: 'radial-gradient(circle at 30% 30%, #fdba74, #ea580c 72%)'
  },
  lao_hd: {
    shortLabel: 'HD',
    accent: '#f59e0b',
    background: 'radial-gradient(circle at 30% 30%, #fde68a, #d97706 72%)'
  },
  'lao-hd': {
    shortLabel: 'HD',
    accent: '#f59e0b',
    background: 'radial-gradient(circle at 30% 30%, #fde68a, #d97706 72%)'
  },
  lao_extra: {
    shortLabel: 'EX',
    accent: '#0ea5e9',
    background: 'radial-gradient(circle at 30% 30%, #7dd3fc, #0369a1 72%)'
  },
  'lao-extra': {
    shortLabel: 'EX',
    accent: '#0ea5e9',
    background: 'radial-gradient(circle at 30% 30%, #7dd3fc, #0369a1 72%)'
  },
  lao_star: {
    shortLabel: 'ST',
    accent: '#f59e0b',
    background: 'radial-gradient(circle at 30% 30%, #fde68a, #d97706 72%)'
  },
  'lao-star': {
    shortLabel: 'ST',
    accent: '#f59e0b',
    background: 'radial-gradient(circle at 30% 30%, #fde68a, #d97706 72%)'
  },
  'lao-stars': {
    shortLabel: 'ST',
    accent: '#f59e0b',
    background: 'radial-gradient(circle at 30% 30%, #fde68a, #d97706 72%)'
  },
  lao_star_vip: {
    shortLabel: 'SV',
    accent: '#f97316',
    background: 'radial-gradient(circle at 30% 30%, #fdba74, #c2410c 72%)'
  },
  'lao-star-vip': {
    shortLabel: 'SV',
    accent: '#f97316',
    background: 'radial-gradient(circle at 30% 30%, #fdba74, #c2410c 72%)'
  },
  'lao-stars-vip': {
    shortLabel: 'SV',
    accent: '#f97316',
    background: 'radial-gradient(circle at 30% 30%, #fdba74, #c2410c 72%)'
  },
  lao_union: {
    shortLabel: 'UN',
    accent: '#16a34a',
    background: 'radial-gradient(circle at 30% 30%, #86efac, #15803d 72%)'
  },
  lao_union_vip: {
    shortLabel: 'UV',
    accent: '#0f766e',
    background: 'radial-gradient(circle at 30% 30%, #99f6e4, #0f766e 72%)'
  },
  'lao-union': {
    shortLabel: 'UN',
    accent: '#16a34a',
    background: 'radial-gradient(circle at 30% 30%, #86efac, #15803d 72%)'
  },
  'lao-union-vip': {
    shortLabel: 'UV',
    accent: '#0f766e',
    background: 'radial-gradient(circle at 30% 30%, #99f6e4, #0f766e 72%)'
  },
  lao_asean: {
    shortLabel: 'AS',
    accent: '#2563eb',
    background: 'radial-gradient(circle at 30% 30%, #93c5fd, #1d4ed8 72%)'
  },
  'lao-asean': {
    shortLabel: 'AS',
    accent: '#2563eb',
    background: 'radial-gradient(circle at 30% 30%, #93c5fd, #1d4ed8 72%)'
  },
  'hanoi-normal': {
    shortLabel: 'YN',
    accent: '#e11d48',
    background: 'radial-gradient(circle at 30% 30%, #fda4af, #be123c 72%)'
  },
  malay: {
    shortLabel: 'MY',
    accent: '#ef4444',
    background: 'radial-gradient(circle at 30% 30%, #fca5a5, #dc2626 72%)'
  },
  'yeekee-vip': {
    shortLabel: 'YK',
    accent: '#7c3aed',
    background: 'radial-gradient(circle at 30% 30%, #c4b5fd, #6d28d9 72%)'
  },
  gsus: {
    shortLabel: 'DJ',
    accent: '#64748b',
    background: 'radial-gradient(circle at 30% 30%, #cbd5e1, #475569 72%)'
  },
  'stock-dowjones': {
    shortLabel: 'DJ',
    accent: '#64748b',
    background: 'radial-gradient(circle at 30% 30%, #cbd5e1, #475569 72%)'
  },
  dowjones_vip: {
    shortLabel: 'DJV',
    accent: '#7c3aed',
    background: 'radial-gradient(circle at 30% 30%, #c4b5fd, #6d28d9 72%)'
  },
  'stock-dowjones-vip': {
    shortLabel: 'DJV',
    accent: '#7c3aed',
    background: 'radial-gradient(circle at 30% 30%, #c4b5fd, #6d28d9 72%)'
  },
  nikkei_morning: {
    shortLabel: 'JP',
    accent: '#f97316',
    background: 'radial-gradient(circle at 30% 30%, #fdba74, #ea580c 70%)'
  },
  'stock-nikkei-morning': {
    shortLabel: 'JP',
    accent: '#f97316',
    background: 'radial-gradient(circle at 30% 30%, #fdba74, #ea580c 70%)'
  },
  'stock-nikkei-afternoon': {
    shortLabel: 'JP',
    accent: '#ea580c',
    background: 'radial-gradient(circle at 30% 30%, #fdba74, #c2410c 70%)'
  },
  nikkei_morning_vip: {
    shortLabel: 'NV',
    accent: '#7c3aed',
    background: 'radial-gradient(circle at 30% 30%, #c4b5fd, #6d28d9 72%)'
  },
  'stock-nikkei-morning-vip': {
    shortLabel: 'NV',
    accent: '#7c3aed',
    background: 'radial-gradient(circle at 30% 30%, #c4b5fd, #6d28d9 72%)'
  },
  nikkei_afternoon_vip: {
    shortLabel: 'NV',
    accent: '#9333ea',
    background: 'radial-gradient(circle at 30% 30%, #d8b4fe, #7e22ce 72%)'
  },
  'stock-nikkei-afternoon-vip': {
    shortLabel: 'NV',
    accent: '#9333ea',
    background: 'radial-gradient(circle at 30% 30%, #d8b4fe, #7e22ce 72%)'
  },
  'stock-hangseng-morning': {
    shortLabel: 'HK',
    accent: '#d946ef',
    background: 'radial-gradient(circle at 30% 30%, #f5d0fe, #c026d3 72%)'
  },
  hangseng_morning_vip: {
    shortLabel: 'HV',
    accent: '#c026d3',
    background: 'radial-gradient(circle at 30% 30%, #f5d0fe, #a21caf 72%)'
  },
  'stock-hangseng-morning-vip': {
    shortLabel: 'HV',
    accent: '#c026d3',
    background: 'radial-gradient(circle at 30% 30%, #f5d0fe, #a21caf 72%)'
  },
  'stock-hangseng-afternoon': {
    shortLabel: 'HK',
    accent: '#a21caf',
    background: 'radial-gradient(circle at 30% 30%, #f0abfc, #86198f 72%)'
  },
  hangseng_afternoon_vip: {
    shortLabel: 'HV',
    accent: '#86198f',
    background: 'radial-gradient(circle at 30% 30%, #e9d5ff, #6b21a8 72%)'
  },
  'stock-hangseng-afternoon-vip': {
    shortLabel: 'HV',
    accent: '#86198f',
    background: 'radial-gradient(circle at 30% 30%, #e9d5ff, #6b21a8 72%)'
  },
  'stock-taiwan': {
    shortLabel: 'TW',
    accent: '#2563eb',
    background: 'radial-gradient(circle at 30% 30%, #93c5fd, #1d4ed8 72%)'
  },
  taiwan_vip: {
    shortLabel: 'TV',
    accent: '#1d4ed8',
    background: 'radial-gradient(circle at 30% 30%, #bfdbfe, #1d4ed8 72%)'
  },
  'stock-taiwan-vip': {
    shortLabel: 'TV',
    accent: '#1d4ed8',
    background: 'radial-gradient(circle at 30% 30%, #bfdbfe, #1d4ed8 72%)'
  },
  'stock-korea': {
    shortLabel: 'KR',
    accent: '#ef4444',
    background: 'radial-gradient(circle at 30% 30%, #fca5a5, #b91c1c 72%)'
  },
  korea_vip: {
    shortLabel: 'KV',
    accent: '#dc2626',
    background: 'radial-gradient(circle at 30% 30%, #fca5a5, #991b1b 72%)'
  },
  'stock-korea-vip': {
    shortLabel: 'KV',
    accent: '#dc2626',
    background: 'radial-gradient(circle at 30% 30%, #fca5a5, #991b1b 72%)'
  },
  'stock-china-morning': {
    shortLabel: 'CN',
    accent: '#ef4444',
    background: 'radial-gradient(circle at 30% 30%, #fda4af, #dc2626 72%)'
  },
  china_morning_vip: {
    shortLabel: 'CV',
    accent: '#be123c',
    background: 'radial-gradient(circle at 30% 30%, #fda4af, #9f1239 72%)'
  },
  'stock-china-morning-vip': {
    shortLabel: 'CV',
    accent: '#be123c',
    background: 'radial-gradient(circle at 30% 30%, #fda4af, #9f1239 72%)'
  },
  china_afternoon: {
    shortLabel: 'CN',
    accent: '#ef4444',
    background: 'radial-gradient(circle at 30% 30%, #fda4af, #dc2626 72%)'
  },
  'stock-china-afternoon': {
    shortLabel: 'CN',
    accent: '#ef4444',
    background: 'radial-gradient(circle at 30% 30%, #fda4af, #dc2626 72%)'
  },
  china_afternoon_vip: {
    shortLabel: 'CV',
    accent: '#b91c1c',
    background: 'radial-gradient(circle at 30% 30%, #fca5a5, #991b1b 72%)'
  },
  'stock-china-afternoon-vip': {
    shortLabel: 'CV',
    accent: '#b91c1c',
    background: 'radial-gradient(circle at 30% 30%, #fca5a5, #991b1b 72%)'
  },
  'stock-singapore': {
    shortLabel: 'SG',
    accent: '#dc2626',
    background: 'radial-gradient(circle at 30% 30%, #fda4af, #be123c 72%)'
  },
  singapore_vip: {
    shortLabel: 'SV',
    accent: '#b91c1c',
    background: 'radial-gradient(circle at 30% 30%, #fecaca, #b91c1c 72%)'
  },
  'stock-singapore-vip': {
    shortLabel: 'SV',
    accent: '#b91c1c',
    background: 'radial-gradient(circle at 30% 30%, #fecaca, #b91c1c 72%)'
  },
  'stock-thai': {
    shortLabel: 'TH',
    accent: '#0f766e',
    background: 'radial-gradient(circle at 30% 30%, #99f6e4, #0f766e 72%)'
  },
  'stock-india': {
    shortLabel: 'IN',
    accent: '#f97316',
    background: 'radial-gradient(circle at 30% 30%, #fdba74, #ea580c 72%)'
  },
  'stock-egypt': {
    shortLabel: 'EG',
    accent: '#ca8a04',
    background: 'radial-gradient(circle at 30% 30%, #fde68a, #ca8a04 72%)'
  },
  'stock-russia': {
    shortLabel: 'RU',
    accent: '#1d4ed8',
    background: 'radial-gradient(circle at 30% 30%, #93c5fd, #1e40af 72%)'
  },
  'stock-russia-vip': {
    shortLabel: 'RV',
    accent: '#1e3a8a',
    background: 'radial-gradient(circle at 30% 30%, #93c5fd, #1e3a8a 72%)'
  },
  russia_vip: {
    shortLabel: 'RV',
    accent: '#1e3a8a',
    background: 'radial-gradient(circle at 30% 30%, #93c5fd, #1e3a8a 72%)'
  },
  'stock-germany': {
    shortLabel: 'DE',
    accent: '#111827',
    background: 'radial-gradient(circle at 30% 30%, #9ca3af, #111827 72%)'
  },
  'stock-germany-vip': {
    shortLabel: 'GV',
    accent: '#111827',
    background: 'radial-gradient(circle at 30% 30%, #d1d5db, #111827 72%)'
  },
  germany_vip: {
    shortLabel: 'GV',
    accent: '#111827',
    background: 'radial-gradient(circle at 30% 30%, #d1d5db, #111827 72%)'
  },
  'stock-england': {
    shortLabel: 'UK',
    accent: '#1d4ed8',
    background: 'radial-gradient(circle at 30% 30%, #bfdbfe, #1d4ed8 72%)'
  },
  'stock-england-vip': {
    shortLabel: 'EV',
    accent: '#1d4ed8',
    background: 'radial-gradient(circle at 30% 30%, #dbeafe, #1d4ed8 72%)'
  },
  england_vip: {
    shortLabel: 'EV',
    accent: '#1d4ed8',
    background: 'radial-gradient(circle at 30% 30%, #dbeafe, #1d4ed8 72%)'
  },
  fallback: {
    shortLabel: 'หวย',
    accent: '#64748b',
    background: 'radial-gradient(circle at 30% 30%, #cbd5e1, #475569 72%)'
  }
};

export const getLotteryVisual = (code, fallbackName = '') => {
  const visual = LOTTERY_VISUALS[code] || LOTTERY_VISUALS.fallback;
  return {
    ...visual,
    shortLabel: visual.shortLabel || String(fallbackName || '').slice(0, 3) || LOTTERY_VISUALS.fallback.shortLabel
  };
};
