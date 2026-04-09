import { useMemo } from 'react';
import { buildSlipDisplayGroups } from '../utils/slipGrouping';
import { formatMoney as money } from '../utils/formatters';

const ui = {
  baht: '\u0e1a\u0e32\u0e17',
  memoLabel: '\u0e1a\u0e31\u0e19\u0e17\u0e36\u0e01\u0e0a\u0e48\u0e27\u0e22\u0e08\u0e33',
  emptyMemo: '\u0e44\u0e21\u0e48\u0e21\u0e35\u0e1a\u0e31\u0e19\u0e17\u0e36\u0e01\u0e0a\u0e48\u0e27\u0e22\u0e08\u0e33',
  wonLabel: '\u0e16\u0e39\u0e01\u0e23\u0e32\u0e07\u0e27\u0e31\u0e25'
};

const sortDisplayGroups = (groups = []) =>
  [...groups].sort((left, right) => {
    const leftWon = (left?.winningEntries?.length || 0) > 0;
    const rightWon = (right?.winningEntries?.length || 0) > 0;

    if (leftWon !== rightWon) {
      return leftWon ? -1 : 1;
    }

    const leftWonAmount = Number(left?.totalWonAmount || 0);
    const rightWonAmount = Number(right?.totalWonAmount || 0);
    if (leftWonAmount !== rightWonAmount) {
      return rightWonAmount - leftWonAmount;
    }

    const leftSortOrder = Number(left?.sortOrder ?? 999);
    const rightSortOrder = Number(right?.sortOrder ?? 999);
    if (leftSortOrder !== rightSortOrder) {
      return leftSortOrder - rightSortOrder;
    }

    return String(left?.key || '').localeCompare(String(right?.key || ''));
  });

const GroupedSlipSummary = ({ slip, dense = false, showMemo = false, className = '', summaryBlock = null }) => {
  const groups = useMemo(() => {
    const baseGroups = slip?.items?.length ? buildSlipDisplayGroups(slip.items) : (slip?.displayGroups || []);
    return sortDisplayGroups(baseGroups);
  }, [slip]);

  const memoText = String(slip?.memo || '').trim();

  if (!groups.length && !(showMemo && memoText)) return null;

  const classes = ['grouped-slip-summary', className].filter(Boolean).join(' ');

  return (
    <div className={classes}>
      {groups.length ? (
        <div className={`operator-slip-group-list ${dense ? 'operator-slip-group-list-dense' : ''}`}>
          {groups.map((group) => (
            <div key={group.key} className={`card operator-slip-group-card ${dense ? 'operator-slip-group-card-dense' : ''}`}>
              <div className="operator-slip-group-side">
                <div className="operator-slip-family">{group.familyLabel}</div>
                <div className="operator-slip-combo">{group.comboLabel}</div>
                <div className="operator-slip-amount">{group.amountLabel}</div>
              </div>
              <div className="operator-slip-group-body">
                {group.winningEntries?.length ? (
                  <div className="operator-slip-winning">
                    <div className="operator-slip-winning-head">
                      <span className="operator-slip-winning-title">{ui.wonLabel}</span>
                      <strong className="operator-slip-winning-total">+{money(group.totalWonAmount || 0)} {ui.baht}</strong>
                    </div>
                    <div className="operator-slip-winning-list">
                      {group.winningEntries.map((entry) => (
                        <span key={`${group.key}-${entry.number}`} className="operator-slip-winning-chip">
                          <span className="operator-slip-winning-number">{entry.number}</span>
                          <span className="operator-slip-winning-amount">+{money(entry.wonAmount || 0)} {ui.baht}</span>
                        </span>
                      ))}
                    </div>
                  </div>
                ) : null}
                <div className="operator-slip-group-head">
                  <strong>{money(group.totalAmount)} {ui.baht}</strong>
                </div>
                <div className="operator-slip-numbers">{group.numbersText}</div>
              </div>
            </div>
          ))}
        </div>
      ) : null}

      {summaryBlock}

      {showMemo ? (
        <div className="card operator-preview-note grouped-slip-note">
          <div className="ops-table-note grouped-slip-note-label">{ui.memoLabel}</div>
          <strong>{memoText || ui.emptyMemo}</strong>
        </div>
      ) : null}
    </div>
  );
};

export default GroupedSlipSummary;
