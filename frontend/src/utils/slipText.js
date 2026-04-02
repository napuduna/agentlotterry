import { buildSlipDisplayGroups } from './slipGrouping';

const money = (value) => Number(value || 0).toLocaleString('th-TH');

const fallbackWriteText = async (text) => {
  const textarea = document.createElement('textarea');
  textarea.value = text;
  textarea.setAttribute('readonly', 'readonly');
  textarea.style.position = 'fixed';
  textarea.style.left = '-9999px';
  document.body.appendChild(textarea);
  textarea.select();
  document.execCommand('copy');
  textarea.remove();
};

export const buildPreviewSlipText = ({
  preview,
  selectedMember,
  selectedLottery,
  selectedRound,
  selectedRateProfile,
  actorLabel,
  operatorName,
  resolveRoundStatusLabel
}) => {
  const memberName = preview?.member?.name || selectedMember?.name || '-';
  const memberUsername = preview?.member?.username || selectedMember?.username || '-';
  const roundStatus = resolveRoundStatusLabel?.(preview?.roundStatus?.status) || preview?.roundStatus?.label || '-';
  const groups = buildSlipDisplayGroups(preview?.items || []);

  const lines = [
    'สรุปโพยก่อนบันทึก',
    `สมาชิก: ${memberName} (@${memberUsername})`,
    `ผู้ทำรายการ: ${operatorName || '-'}${actorLabel ? ` • ${actorLabel}` : ''}`,
    `ตลาด: ${selectedLottery?.name || preview?.lottery?.name || '-'}`,
    `งวด: ${selectedRound?.title || preview?.round?.title || '-'}`,
    `เรท: ${selectedRateProfile?.name || preview?.rateProfile?.name || 'เรทมาตรฐาน'}`,
    `สถานะงวด: ${roundStatus}`,
    `จำนวนรายการ: ${preview?.summary?.itemCount || 0}`,
    `ยอดรวม: ${money(preview?.summary?.totalAmount)} บาท`,
    `จ่ายสูงสุด: ${money(preview?.summary?.potentialPayout)} บาท`,
    ''
  ];

  if (groups.length) {
    groups.forEach((group, index) => {
      lines.push(`${index + 1}. ${group.familyLabel} ${group.comboLabel} ${group.amountLabel}`);
      lines.push(`เลข: ${group.numbersText}`);
      lines.push(`รวม ${group.itemCount} รายการ • ${money(group.totalAmount)} บาท • จ่ายสูงสุด ${money(group.potentialPayout)} บาท`);
      lines.push('');
    });
  } else {
    lines.push('ยังไม่มีรายการในโพย');
    lines.push('');
  }

  if (preview?.memo) {
    lines.push(`บันทึกช่วยจำ: ${preview.memo}`);
  }

  return lines.join('\n').trim();
};

export const copyPreviewSlipText = async (options) => {
  const text = buildPreviewSlipText(options);

  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
    return { mode: 'clipboard', text };
  }

  await fallbackWriteText(text);
  return { mode: 'fallback', text };
};
