const betTypeLabels = {
  '3top': '3 ตัวบน',
  '3front': '3 ตัวหน้า',
  '3bottom': '3 ตัวล่าง',
  '3tod': '3 ตัวโต๊ด',
  '2top': '2 ตัวบน',
  '2bottom': '2 ตัวล่าง',
  '2tod': '2 ตัวโต๊ด',
  'run_top': 'วิ่งบน',
  'run_bottom': 'วิ่งล่าง',
  'lao_set4': 'หวยชุดลาว 4 ตัว'
};

const roundStatusLabels = {
  open: 'เปิดรับ',
  upcoming: 'กำลังจะเปิด',
  closed: 'ปิดรับ',
  resulted: 'ประกาศผลแล้ว',
  missing: 'ยังไม่มีงวด'
};

const slipStatusLabels = {
  draft: 'ร่าง',
  submitted: 'ส่งซื้อแล้ว',
  cancelled: 'ยกเลิกแล้ว'
};

const betResultLabels = {
  pending: 'รอผล',
  won: 'ถูก',
  lost: 'ไม่ถูก'
};

const sourceFlagLabels = {
  doubleSet: 'เลขเบิ้ล',
  reverse: 'กลับเลข',
  manual: 'พิมพ์ตรง'
};

const providerLabels = {
  'Internal Feed': 'ฟีดภายใน',
  'Market Feed': 'ฟีดตลาด',
  'ManyCai Feed': 'ฟีด ManyCai',
  'Legacy Import': 'นำเข้าจากข้อมูลเดิม',
  internal: 'ภายในระบบ'
};

const resultSourceTypeLabels = {
  api: 'API อัตโนมัติ',
  manual: 'บันทึกด้วยมือ',
  legacy: 'ข้อมูลเดิม'
};

const userStatusLabels = {
  active: 'ใช้งาน',
  inactive: 'ปิดใช้งาน',
  suspended: 'ระงับ'
};

const walletEntryTypeLabels = {
  transfer: 'โอนเครดิต',
  adjustment: 'ปรับยอด'
};

const walletDirectionLabels = {
  credit: 'เข้า',
  debit: 'ออก'
};

const walletReasonLabels = {
  agent_topup: 'เติมเครดิตโดยเจ้ามือ',
  agent_deduction: 'หักเครดิตโดยเจ้ามือ',
  admin_adjustment: 'ปรับยอดโดยผู้ดูแล',
  transfer: 'โอนเครดิต',
  credit: 'เครดิตเข้า',
  debit: 'เครดิตออก'
};

const fallbackLabel = (value, emptyLabel = '-') => {
  if (value === null || value === undefined || value === '') return emptyLabel;
  return value;
};

export const getBetTypeLabel = (value) => betTypeLabels[value] || fallbackLabel(value);
export const getRoundStatusLabel = (value) => roundStatusLabels[value] || fallbackLabel(value);
export const getSlipStatusLabel = (value) => slipStatusLabels[value] || fallbackLabel(value);
export const getBetResultLabel = (value) => betResultLabels[value] || fallbackLabel(value);
export const getSourceFlagLabel = (value) => sourceFlagLabels[value] || fallbackLabel(value);
export const getProviderLabel = (value, emptyLabel = 'ไม่ระบุผู้ให้บริการ') => providerLabels[value] || fallbackLabel(value, emptyLabel);
export const getResultSourceTypeLabel = (value, emptyLabel = '-') => resultSourceTypeLabels[value] || fallbackLabel(value, emptyLabel);
export const getUserStatusLabel = (value) => userStatusLabels[value] || fallbackLabel(value);
export const getWalletEntryTypeLabel = (value) => walletEntryTypeLabels[value] || fallbackLabel(value);
export const getWalletDirectionLabel = (value) => walletDirectionLabels[value] || fallbackLabel(value);
export const getWalletReasonLabel = (value, emptyLabel = '-') => walletReasonLabels[value] || fallbackLabel(value, emptyLabel);
