import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { FiCalendar, FiRefreshCw, FiRotateCcw } from 'react-icons/fi';
import PageSkeleton from '../../components/PageSkeleton';
import { agentCopy } from '../../i18n/th/agent';
import { getBetResultLabel, getBetTypeLabel } from '../../i18n/th/labels';
import { cancelAgentBettingSlip, getAgentBets } from '../../services/api';

const money = (value) => Number(value || 0).toLocaleString('th-TH');

const AgentBets = () => {
  const [bets, setBets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [roundDate, setRoundDate] = useState('');
  const [cancellingSlipId, setCancellingSlipId] = useState('');

  useEffect(() => {
    load();
  }, [roundDate]);

  const load = async () => {
    try {
      const params = {};
      if (roundDate) params.roundDate = roundDate;
      const res = await getAgentBets(params);
      setBets(res.data || []);
    } catch (err) {
      console.error(err);
      toast.error('โหลดรายการโพยไม่สำเร็จ');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelSlip = async (slipId) => {
    if (!slipId) return;
    setCancellingSlipId(slipId);
    try {
      await cancelAgentBettingSlip(slipId);
      toast.success('ยกเลิกโพยสำเร็จ');
      await load();
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message || 'ยกเลิกโพยไม่สำเร็จ');
    } finally {
      setCancellingSlipId('');
    }
  };

  if (loading) return <PageSkeleton statCount={3} rows={5} sidebar={false} />;

  return (
    <div className="ag-bets animate-fade-in">
      <div className="ag-bets-header">
        <div>
          <h1 className="ag-bets-title">โพยลูกค้า</h1>
          <p className="ag-bets-subtitle">ดูรายการซื้อที่เอเย่นต์ทำแทนสมาชิก และยกเลิกโพยที่ยังเปิดอยู่ได้จากหน้านี้</p>
        </div>
        <span className="ag-bets-count">{bets.length} รายการ</span>
      </div>

      <div className="ag-bets-filter">
        <FiCalendar />
        <input
          type="text"
          placeholder={agentCopy.bets.filterPlaceholder}
          value={roundDate}
          onChange={(e) => setRoundDate(e.target.value)}
        />
      </div>

      <div className="ag-bets-list">
        {bets.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-text">{agentCopy.bets.empty}</div>
          </div>
        ) : bets.map((b) => {
          const canCancel = (b.result || 'pending') === 'pending' && !!b.slipId;
          return (
            <div key={b._id} className={`ag-bet-card ag-bet-card-${b.result || 'pending'}`}>
              <div className="ag-bet-card-top">
                <div>
                  <span className="ag-bet-card-customer">{b.customerId?.name || agentCopy.bets.unknownMember}</span>
                  <div className="ag-bet-card-slip">{b.slipNumber || b.slipId || '-'}</div>
                </div>
                <span className={`ag-bet-badge ag-bet-badge-${b.result || 'pending'}`}>
                  {getBetResultLabel(b.result || 'pending')}
                </span>
              </div>

              <div className="ag-bet-card-body">
                <span className="ag-bet-card-number">{b.number}</span>
                <div className="ag-bet-card-details">
                  <span className="ag-bet-card-type">{getBetTypeLabel(b.betType)} x{b.payRate}</span>
                  <span className="ag-bet-card-market">{b.marketName || agentCopy.bets.defaultMarket} • {b.roundDate}</span>
                </div>
              </div>

              <div className="ag-bet-card-bottom">
                <div className="ag-bet-card-amounts">
                  <span>แทง {money(b.amount)} บาท</span>
                  {b.wonAmount > 0 ? <span className="ag-bet-card-won">+{money(b.wonAmount)} บาท</span> : null}
                </div>

                {canCancel ? (
                  <button
                    type="button"
                    className="btn btn-danger btn-sm"
                    onClick={() => handleCancelSlip(b.slipId)}
                    disabled={cancellingSlipId === b.slipId}
                  >
                    {cancellingSlipId === b.slipId ? <FiRefreshCw className="spin-animation" /> : <FiRotateCcw />}
                    {cancellingSlipId === b.slipId ? 'กำลังยกเลิก...' : 'ยกเลิกโพย'}
                  </button>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>

      <style>{`
        .ag-bets {
          display: flex;
          flex-direction: column;
          gap: 14px;
        }

        .ag-bets-header {
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          gap: 12px;
        }

        .ag-bets-title {
          font-size: 1.35rem;
          font-weight: 800;
          margin: 0;
        }

        .ag-bets-subtitle {
          margin: 6px 0 0;
          color: var(--text-secondary);
          font-size: 0.9rem;
          line-height: 1.6;
        }

        .ag-bets-count {
          font-size: 0.8rem;
          color: var(--text-muted);
          background: var(--bg-surface);
          padding: 6px 12px;
          border-radius: 999px;
          white-space: nowrap;
        }

        .ag-bets-filter {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 12px 14px;
          background: var(--bg-card);
          border: 1px solid var(--border);
          border-radius: var(--radius-md);
          color: var(--text-muted);
        }

        .ag-bets-filter input {
          background: none;
          border: none;
          color: var(--text-primary);
          font-size: 0.88rem;
          flex: 1;
          min-width: 0;
        }

        .ag-bets-filter input::placeholder {
          color: var(--text-muted);
        }

        .ag-bets-list {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .ag-bet-card {
          background: var(--bg-card);
          border: 1px solid var(--border);
          border-radius: var(--radius-md);
          padding: 16px;
          border-left: 3px solid var(--border);
        }

        .ag-bet-card-pending { border-left-color: var(--warning); }
        .ag-bet-card-won { border-left-color: var(--success); }
        .ag-bet-card-lost { border-left-color: var(--danger); }

        .ag-bet-card-top {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 12px;
          margin-bottom: 10px;
        }

        .ag-bet-card-customer {
          font-size: 0.86rem;
          font-weight: 700;
          color: var(--text-primary);
        }

        .ag-bet-card-slip {
          margin-top: 4px;
          font-size: 0.74rem;
          color: var(--text-muted);
          letter-spacing: 0.04em;
        }

        .ag-bet-badge {
          font-size: 0.68rem;
          font-weight: 700;
          padding: 4px 10px;
          border-radius: 999px;
          white-space: nowrap;
        }

        .ag-bet-badge-pending { background: rgba(245, 158, 11, 0.15); color: #fbbf24; }
        .ag-bet-badge-won { background: rgba(16, 185, 129, 0.15); color: #34d399; }
        .ag-bet-badge-lost { background: rgba(239, 68, 68, 0.15); color: #f87171; }

        .ag-bet-card-body {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 12px;
        }

        .ag-bet-card-number {
          font-size: 1.7rem;
          font-weight: 800;
          color: var(--text-primary);
          letter-spacing: 0.08em;
          min-width: 72px;
        }

        .ag-bet-card-details {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .ag-bet-card-type {
          font-size: 0.8rem;
          color: var(--text-secondary);
          font-weight: 600;
        }

        .ag-bet-card-market {
          font-size: 0.74rem;
          color: var(--text-muted);
        }

        .ag-bet-card-bottom {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          padding-top: 10px;
          border-top: 1px solid var(--border-light);
        }

        .ag-bet-card-amounts {
          display: flex;
          flex-direction: column;
          gap: 4px;
          font-size: 0.82rem;
          color: var(--text-muted);
        }

        .ag-bet-card-won {
          font-weight: 800;
          color: var(--success);
        }

        @media (max-width: 760px) {
          .ag-bets-header,
          .ag-bet-card-top,
          .ag-bet-card-bottom {
            flex-direction: column;
            align-items: flex-start;
          }

          .ag-bets-count {
            align-self: flex-start;
          }

          .ag-bet-card-body {
            align-items: flex-start;
          }
        }
      `}</style>
    </div>
  );
};

export default AgentBets;
