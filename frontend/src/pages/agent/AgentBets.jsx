import { useEffect, useState } from 'react';
import { FiCalendar } from 'react-icons/fi';
import PageSkeleton from '../../components/PageSkeleton';
import { agentCopy } from '../../i18n/th/agent';
import { getBetResultLabel, getBetTypeLabel } from '../../i18n/th/labels';
import { getAgentBets } from '../../services/api';

const AgentBets = () => {
  const [bets, setBets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [roundDate, setRoundDate] = useState('');

  useEffect(() => { load(); }, [roundDate]);

  const load = async () => {
    try {
      const params = {};
      if (roundDate) params.roundDate = roundDate;
      const res = await getAgentBets(params);
      setBets(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <PageSkeleton statCount={3} rows={5} sidebar={false} />;

  return (
    <div className="ag-bets animate-fade-in">
      <div className="ag-bets-header">
        <h1 className="ag-bets-title">โพยลูกค้า</h1>
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
          <div className="empty-state"><div className="empty-state-text">{agentCopy.bets.empty}</div></div>
        ) : bets.map((b) => (
          <div key={b._id} className={`ag-bet-card ag-bet-card-${b.result || 'pending'}`}>
            <div className="ag-bet-card-top">
              <span className="ag-bet-card-customer">{b.customerId?.name || agentCopy.bets.unknownMember}</span>
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
              <span>แทง {b.amount.toLocaleString()} บาท</span>
              {b.wonAmount > 0 && (
                <span className="ag-bet-card-won">+{b.wonAmount.toLocaleString()} บาท</span>
              )}
            </div>
          </div>
        ))}
      </div>

      <style>{`
        .ag-bets {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .ag-bets-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .ag-bets-title {
          font-size: 1.3rem;
          font-weight: 800;
        }

        .ag-bets-count {
          font-size: 0.8rem;
          color: var(--text-muted);
          background: var(--bg-surface);
          padding: 4px 12px;
          border-radius: 20px;
        }

        .ag-bets-filter {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 14px;
          background: var(--bg-card);
          border: 1px solid var(--border);
          border-radius: var(--radius-md);
          color: var(--text-muted);
        }

        .ag-bets-filter input {
          background: none;
          border: none;
          color: var(--text-primary);
          font-size: 0.85rem;
          flex: 1;
          min-width: 0;
        }

        .ag-bets-filter input::placeholder {
          color: var(--text-muted);
        }

        .ag-bets-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .ag-bet-card {
          background: var(--bg-card);
          border: 1px solid var(--border);
          border-radius: var(--radius-md);
          padding: 14px;
          border-left: 3px solid var(--border);
        }

        .ag-bet-card-pending { border-left-color: var(--warning); }
        .ag-bet-card-won { border-left-color: var(--success); }
        .ag-bet-card-lost { border-left-color: var(--danger); }

        .ag-bet-card-top {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 8px;
        }

        .ag-bet-card-customer {
          font-size: 0.8rem;
          font-weight: 600;
          color: var(--text-secondary);
        }

        .ag-bet-badge {
          font-size: 0.65rem;
          font-weight: 700;
          padding: 2px 8px;
          border-radius: 10px;
        }

        .ag-bet-badge-pending { background: rgba(245, 158, 11, 0.15); color: #fbbf24; }
        .ag-bet-badge-won { background: rgba(16, 185, 129, 0.15); color: #34d399; }
        .ag-bet-badge-lost { background: rgba(239, 68, 68, 0.15); color: #f87171; }

        .ag-bet-card-body {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 10px;
        }

        .ag-bet-card-number {
          font-size: 1.6rem;
          font-weight: 800;
          color: var(--text-primary);
          letter-spacing: 0.1em;
          min-width: 60px;
        }

        .ag-bet-card-details {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .ag-bet-card-type {
          font-size: 0.78rem;
          color: var(--text-secondary);
          font-weight: 600;
        }

        .ag-bet-card-market {
          font-size: 0.7rem;
          color: var(--text-muted);
        }

        .ag-bet-card-bottom {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding-top: 8px;
          border-top: 1px solid var(--border-light);
          font-size: 0.8rem;
          color: var(--text-muted);
        }

        .ag-bet-card-won {
          font-weight: 800;
          color: var(--success);
        }
      `}</style>
    </div>
  );
};

export default AgentBets;
