import { useEffect, useMemo, useState } from 'react';
import { FiDollarSign, FiTrendingUp, FiUser, FiUsers } from 'react-icons/fi';
import PageSkeleton from '../../components/PageSkeleton';
import { adminCopy } from '../../i18n/th/admin';
import { getBetResultLabel, getBetTypeLabel } from '../../i18n/th/labels';
import { getAdminDashboard } from '../../services/api';

const money = (value) => Number(value || 0).toLocaleString('th-TH');
const copy = adminCopy.dashboard;

const AdminDashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        const res = await getAdminDashboard();
        setData(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();
  }, []);

  const stats = data?.stats || {};

  const statCards = useMemo(() => ([
    {
      icon: FiUsers,
      value: stats.totalAgents || 0,
      label: copy.statCards.agents.label,
      hint: copy.statCards.agents.hint(stats.activeAgents || 0)
    },
    {
      icon: FiUser,
      value: stats.totalCustomers || 0,
      label: copy.statCards.members.label,
      hint: copy.statCards.members.hint(stats.activeCustomers || 0)
    },
    {
      icon: FiDollarSign,
      value: `${money(stats.totalAmount)} บาท`,
      label: copy.statCards.totalSales.label,
      hint: copy.statCards.totalSales.hint
    },
    {
      icon: FiTrendingUp,
      value: `${money(stats.netProfit)} บาท`,
      label: copy.statCards.netProfit.label,
      hint: copy.statCards.netProfit.hint
    }
  ]), [stats]);

  if (loading) {
    return <PageSkeleton statCount={4} rows={5} sidebar compactSidebar />;
  }

  return (
    <div className="ops-page animate-fade-in">
      <section className="ops-hero">
        <div className="ops-hero-copy">
          <span className="ui-eyebrow">{copy.heroEyebrow}</span>
          <h1 className="page-title">{copy.heroTitle}</h1>
          <p className="page-subtitle">{copy.heroSubtitle}</p>
        </div>

        <div className={`ops-hero-side ${(stats.netProfit || 0) >= 0 ? 'admin-hero-positive' : 'admin-hero-negative'}`}>
          <span>{copy.systemNet}</span>
          <strong>{(stats.netProfit || 0) >= 0 ? '+' : ''}{money(stats.netProfit)} บาท</strong>
          <small>{copy.totalWon(money(stats.totalWon))}</small>
        </div>
      </section>

      <section className="ops-overview-grid">
        {statCards.map((card) => (
          <article key={card.label} className="ops-overview-card">
            <div className="ops-icon-badge"><card.icon /></div>
            <strong>{card.value}</strong>
            <span>{card.label}</span>
            <small>{card.hint}</small>
          </article>
        ))}
      </section>

      <section className="ops-grid">
        <section className="card ops-section">
          <div className="ui-panel-head">
            <div>
              <div className="ui-eyebrow">{copy.activityEyebrow}</div>
              <h3 className="card-title">{copy.activityTitle}</h3>
            </div>
          </div>

          <div className="ops-stack">
            <div className="ops-stat-row"><span>{copy.totalBets}</span><strong>{money(stats.totalBets)}</strong></div>
            <div className="ops-stat-row"><span>{copy.pendingBets}</span><strong>{money(stats.pendingBets)}</strong></div>
            <div className="ops-stat-row"><span>{copy.totalPayout}</span><strong>{money(stats.totalWon)} บาท</strong></div>
            <div className="ops-stat-row"><span>{copy.netProfit}</span><strong>{money(stats.netProfit)} บาท</strong></div>
          </div>
        </section>

        <section className="card ops-section">
          <div className="ui-panel-head">
            <div>
              <div className="ui-eyebrow">{copy.recentEyebrow}</div>
              <h3 className="card-title">{copy.recentTitle}</h3>
            </div>
          </div>

          {data?.recentBets?.length ? (
            <div className="ops-stack">
              {data.recentBets.slice(0, 6).map((bet, index) => (
                <article key={`${bet._id || index}-${bet.number}`} className="ops-feed-row">
                  <div>
                    <strong>{bet.customerId?.name || copy.unknownName} - {getBetTypeLabel(bet.betType)}</strong>
                    <div className="ops-feed-meta">{bet.marketName || copy.defaultMarket} - {bet.roundDate} - #{bet.number}</div>
                  </div>
                  <div className="ops-feed-right">
                    <strong>{money(bet.amount)} บาท</strong>
                    <span className={`badge badge-${bet.result === 'won' ? 'success' : bet.result === 'lost' ? 'danger' : 'warning'}`}>
                      {getBetResultLabel(bet.result)}
                    </span>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="empty-state"><div className="empty-state-text">{copy.noRecentBets}</div></div>
          )}
        </section>
      </section>

      <style>{`
        .admin-hero-positive{border-color:rgba(16,185,129,.22)}
        .admin-hero-negative{border-color:rgba(239,68,68,.22)}
      `}</style>
    </div>
  );
};

export default AdminDashboard;
