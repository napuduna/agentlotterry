import { useMemo } from 'react';
import { FiCopy, FiX } from 'react-icons/fi';
import { buildSlipDisplayGroups } from '../utils/slipGrouping';

const money = (value) => Number(value || 0).toLocaleString('th-TH');

const SlipPreviewModal = ({
  slip,
  onClose,
  onCopyImage,
  copyingImage = false,
  actorLabel = '-',
  unknownMember = '-'
}) => {
  const groups = useMemo(() => buildSlipDisplayGroups(slip?.items || []), [slip]);

  if (!slip) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal operator-preview-dialog"
        role="dialog"
        aria-modal="true"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="modal-header">
          <div>
            <div className="ui-eyebrow">สรุปโพยดิจิทัล</div>
            <h3 className="modal-title">โพย {slip.slipNumber || slip.slipId || '-'}</h3>
          </div>
          <div className="operator-preview-modal-actions">
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={onCopyImage}
              disabled={copyingImage}
            >
              <FiCopy />
              {copyingImage ? 'กำลังคัดลอกโพยเป็นรูป...' : 'คัดลอกโพยเป็นรูป'}
            </button>
            <button
              type="button"
              className="modal-close"
              onClick={onClose}
              aria-label="ปิดหน้าต่าง"
            >
              <FiX />
            </button>
          </div>
        </div>

        <div className="card operator-preview-meta">
          <div>
            <strong>สมาชิก:</strong> {slip.customer?.name || unknownMember}
            <span className="ops-table-note">
              {slip.customer?.username ? `@${slip.customer.username}` : ''}
            </span>
          </div>
          <div className="operator-preview-meta-row">
            <strong>ผู้ทำรายการ:</strong> {slip.placedBy?.name || actorLabel}
            <span className="ops-table-note">{slip.placedBy?.roleLabel || actorLabel}</span>
          </div>
          <div className="operator-preview-meta-row">
            <strong>ตลาด / งวด:</strong> {slip.marketName || '-'} • {slip.roundLabel || '-'}
          </div>
        </div>

        <div className="operator-preview-summary">
          <div className="card">
            <div className="ops-table-note" style={{ margin: 0 }}>จำนวนรายการ</div>
            <strong>{slip.items?.length || 0}</strong>
          </div>
          <div className="card">
            <div className="ops-table-note" style={{ margin: 0 }}>ยอดรวม</div>
            <strong>{money(slip.totalAmount)} บาท</strong>
          </div>
          <div className="card">
            <div className="ops-table-note" style={{ margin: 0 }}>จ่ายสูงสุด</div>
            <strong>{money(slip.totalPotentialPayout)} บาท</strong>
          </div>
          <div className="card">
            <div className="ops-table-note" style={{ margin: 0 }}>สถานะโพย</div>
            <strong>{slip.resultLabel || '-'}</strong>
          </div>
        </div>

        <div className="operator-preview-list operator-slip-group-list">
          {groups.map((group) => (
            <div key={group.key} className="card operator-slip-group-card operator-slip-group-card-compact">
              <div className="operator-slip-group-side">
                <div className="operator-slip-family">{group.familyLabel}</div>
                <div className="operator-slip-combo">{group.comboLabel}</div>
                <div className="operator-slip-amount">{group.amountLabel}</div>
              </div>
              <div className="operator-slip-group-body">
                <div className="operator-slip-group-head">
                  <span className="ops-table-note">{group.itemCount} รายการ</span>
                  <strong>{money(group.totalAmount)} บาท</strong>
                </div>
                <div className="operator-slip-numbers">{group.numbersText}</div>
                <div className="ops-table-note">จ่ายสูงสุด {money(group.potentialPayout)} บาท</div>
              </div>
            </div>
          ))}
        </div>

        {slip.memo ? (
          <div className="card operator-preview-note">
            <div className="ops-table-note" style={{ margin: 0 }}>บันทึกช่วยจำ</div>
            <strong>{slip.memo}</strong>
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default SlipPreviewModal;
