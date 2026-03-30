import { useEffect, useMemo, useState } from 'react';
import { FiBell, FiClock, FiDollarSign, FiTrendingUp, FiUsers, FiWifi } from 'react-icons/fi';
import PageSkeleton from '../../components/PageSkeleton';
import { getAgentDashboard } from '../../services/api';
import { useCatalog } from '../../context/CatalogContext';

const betTypeLabels = {
  '3top': '3 Top',
  '3tod': '3 Tod',
  '2top': '2 Top',
  '2bottom': '2 Bottom',
  'run_top': 'Run Top',
  'run_bottom': 'Run Bottom'
};

const money = (value) => Number(value || 0).toLocaleString('th-TH');
const formatDateTime = (value) => {
  if (!value) return 'No recent activity';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'No recent activity';
  return date.toLocaleString('th-TH', { dateStyle: 'medium', timeStyle: 'short' });
};

const AgentDashboard = () => {
  const { announcements, markAnnouncementRead } = useCatalog();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await getAgentDashboard();
        setData(res.data);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  const stats = data?.stats || {};
  const unreadAnnouncements = announcements.filter((announcement) => !announcement.isRead).length;
  const hasSidePanels = Boolean(data?.onlineMembers?.length || announcements.length);

  const statCards = useMemo(() => ([
    {
      icon: FiUsers,
      value: stats.totalCustomers || 0,
      label: 'Members',
      hint: `${stats.activeCustomers || 0} active profiles`
    },
    {
      icon: FiWifi,
      value: stats.onlineCustomers || 0,
      label: 'Online now',
      hint: 'Recently active in the system'
    },
    {
      icon: FiClock,
      value: stats.pendingBets || 0,
      label: 'Pending items',
      hint: `${stats.totalBets || 0} total submitted items`
    },
    {
      icon: FiDollarSign,
      value: money(stats.agentCreditBalance),
      label: 'Agent credit',
      hint: 'Available wallet balance'
    },
    {
      icon: FiDollarSign,
      value: money(stats.totalCreditBalance),
      label: 'Member credit',
      hint: 'Balance across all members'
    },
    {
      icon: FiTrendingUp,
      value: `${Number(stats.averageStockPercent || 0).toFixed(1)}%`,
      label: 'Average stock',
      hint: 'Across member profiles'
    }
  ]), [stats]);

  if (loading) return <PageSkeleton statCount={6} rows={6} sidebar compactSidebar />;

  return (
    <div className="agent-dash-page animate-fade-in">
      <section className="agent-dash-hero card">
        <div className="agent-dash-hero-copy">
          <span className="section-eyebrow">Operations overview</span>
          <h1 className="page-title">Agent Dashboard</h1>
          <p className="page-subtitle">Track member activity, credit exposure, and the latest submitted items from one calm control room.</p>
        </div>

        <div className="hero-insight-grid">
          <div className={`net-result-panel ${(stats.netProfit || 0) >= 0 ? 'positive' : 'negative'}`}>
            <span>Net result</span>
            <strong>{(stats.netProfit || 0) >= 0 ? '+' : ''}{money(stats.netProfit)} ฿</strong>
            <small>Total won {money(stats.totalWon)} ฿ from sales {money(stats.totalAmount)} ฿</small>
          </div>

          <div className="hero-mini-card">
            <div className="hero-mini-icon"><FiWifi /></div>
            <span>Online members</span>
            <strong>{stats.onlineCustomers || 0}</strong>
            <small>Live presence from member heartbeat</small>
          </div>

          <div className="hero-mini-card">
            <div className="hero-mini-icon"><FiBell /></div>
            <span>Unread notices</span>
            <strong>{unreadAnnouncements}</strong>
            <small>{announcements.length} total announcement{announcements.length === 1 ? '' : 's'}</small>
          </div>
        </div>
      </section>

      <section className="dash-grid">
        {statCards.map((card) => (
          <article key={card.label} className="dash-card">
            <div className="dash-card-icon"><card.icon /></div>
            <strong>{card.value}</strong>
            <span>{card.label}</span>
            <small>{card.hint}</small>
          </article>
        ))}
      </section>

      <section className={`dashboard-columns ${hasSidePanels ? '' : 'single'}`}>
        <section className="card panel-card">
          <div className="panel-head">
            <div>
              <div className="panel-eyebrow">Activity feed</div>
              <h3 className="card-title">Latest items</h3>
            </div>
            <span className="panel-count">{data?.recentBets?.length || 0} items</span>
          </div>

          <div className="recent-list">
            {data?.recentBets?.length ? data.recentBets.map((bet) => (
              <article key={bet._id} className={`recent-row recent-${bet.result || 'pending'}`}>
                <div className="recent-main">
                  <div className="recent-topline">
                    <strong>{bet.number}</strong>
                    <span className={`result-pill result-${bet.result || 'pending'}`}>{bet.result || 'pending'}</span>
                  </div>
                  <div className="recent-meta">{bet.customerId?.name || 'Unknown'} • {betTypeLabels[bet.betType] || bet.betType}</div>
                  <div className="recent-meta">{bet.marketName || bet.marketId} • {bet.roundTitle || bet.roundDate}</div>
                </div>
                <div className="recent-right">
                  <strong>{money(bet.amount)} ฿</strong>
                  <span>Potential {money(bet.potentialPayout)} ฿</span>
                </div>
              </article>
            )) : (
              <div className="empty-state"><div className="empty-state-text">No recent items.</div></div>
            )}
          </div>
        </section>

        {hasSidePanels ? (
          <div className="dashboard-side-stack">
            {data?.onlineMembers?.length ? (
              <section className="card panel-card compact-panel">
                <div className="panel-head">
                  <div>
                    <div className="panel-eyebrow">Presence</div>
                    <h3 className="card-title">Members online</h3>
                  </div>
                  <span className="panel-count">{data.onlineMembers.length}</span>
                </div>

                <div className="recent-list">
                  {data.onlineMembers.map((member) => (
                    <article key={member.id} className="recent-row recent-pending">
                      <div className="recent-main">
                        <div className="recent-topline">
                          <strong>{member.name}</strong>
                          <span className="result-pill result-pending">online</span>
                        </div>
                        <div className="recent-meta">@{member.username} • {member.memberCode || '-'}</div>
                      </div>
                      <div className="recent-right">
                        <span>{formatDateTime(member.lastActiveAt)}</span>
                      </div>
                    </article>
                  ))}
                </div>
              </section>
            ) : null}

            {announcements.length ? (
              <section className="card panel-card compact-panel">
                <div className="panel-head">
                  <div>
                    <div className="panel-eyebrow">Broadcast</div>
                    <h3 className="card-title">Announcements</h3>
                  </div>
                  <span className="panel-count">{unreadAnnouncements} unread</span>
                </div>

                <div className="recent-list">
                  {announcements.map((announcement) => (
                    <article key={announcement.id} className="recent-row recent-pending">
                      <div className="recent-main">
                        <div className="recent-topline">
                          <strong>{announcement.title}</strong>
                          {!announcement.isRead ? <span className="result-pill result-pending">new</span> : null}
                        </div>
                        <div className="recent-meta">{announcement.body}</div>
                      </div>
                      <div className="recent-right">
                        {!announcement.isRead ? (
                          <button className="btn btn-secondary btn-sm" onClick={() => markAnnouncementRead(announcement.id)}>
                            Mark read
                          </button>
                        ) : (
                          <span>Read</span>
                        )}
                      </div>
                    </article>
                  ))}
                </div>
              </section>
            ) : null}
          </div>
        ) : null}
      </section>

      <style>{`
        .agent-dash-page, .recent-list, .dashboard-side-stack {
          display: flex;
          flex-direction: column;
          gap: 18px;
        }

        .agent-dash-page {
          position: relative;
          isolation: isolate;
        }

        .agent-dash-page::before {
          content: '';
          position: absolute;
          inset: -48px 0 auto;
          height: 220px;
          background: radial-gradient(circle at top left, rgba(16, 185, 129, 0.14), transparent 62%);
          pointer-events: none;
          z-index: -1;
        }

        .agent-dash-hero {
          display: grid;
          grid-template-columns: minmax(0, 1.2fr) minmax(280px, 0.95fr);
          gap: 20px;
          padding: 28px;
          background:
            linear-gradient(135deg, rgba(15, 23, 42, 0.96), rgba(17, 24, 39, 0.9)),
            radial-gradient(circle at top right, rgba(16, 185, 129, 0.12), transparent 38%);
          border-color: rgba(52, 211, 153, 0.18);
          box-shadow: 0 24px 60px rgba(15, 23, 42, 0.34);
        }

        .agent-dash-hero-copy {
          display: flex;
          flex-direction: column;
          gap: 10px;
          justify-content: space-between;
        }

        .section-eyebrow, .panel-eyebrow {
          font-size: 0.78rem;
          letter-spacing: 0.16em;
          text-transform: uppercase;
          color: var(--primary-light);
          font-weight: 700;
        }

        .agent-dash-hero .page-title {
          margin: 0;
          font-size: clamp(2rem, 4vw, 3rem);
          line-height: 0.96;
          letter-spacing: -0.04em;
        }

        .agent-dash-hero .page-subtitle {
          margin: 0;
          max-width: 56ch;
        }

        .hero-insight-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 14px;
        }

        .net-result-panel, .hero-mini-card, .dash-card, .recent-row {
          border-radius: 20px;
          border: 1px solid rgba(148, 163, 184, 0.14);
        }

        .net-result-panel {
          grid-column: 1 / -1;
          padding: 18px;
          display: flex;
          flex-direction: column;
          gap: 8px;
          background: rgba(9, 16, 30, 0.84);
        }

        .net-result-panel.positive {
          border-color: rgba(16, 185, 129, 0.22);
          box-shadow: inset 0 0 0 1px rgba(16, 185, 129, 0.06);
        }

        .net-result-panel.negative {
          border-color: rgba(239, 68, 68, 0.22);
          box-shadow: inset 0 0 0 1px rgba(239, 68, 68, 0.06);
        }

        .net-result-panel span, .net-result-panel small, .dash-card span, .dash-card small, .recent-meta, .hero-mini-card span, .hero-mini-card small {
          color: var(--text-muted);
        }

        .net-result-panel strong {
          font-size: clamp(2rem, 4vw, 2.8rem);
          line-height: 0.95;
          letter-spacing: -0.05em;
        }

        .hero-mini-card {
          padding: 16px;
          background: rgba(9, 16, 30, 0.78);
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .hero-mini-card strong {
          font-size: 1.5rem;
          letter-spacing: -0.04em;
        }

        .hero-mini-icon, .dash-card-icon {
          width: 42px;
          height: 42px;
          border-radius: 14px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          background: rgba(16, 185, 129, 0.12);
          color: var(--primary-light);
          border: 1px solid rgba(52, 211, 153, 0.16);
        }

        .dash-grid {
          display: grid;
          grid-template-columns: repeat(6, minmax(0, 1fr));
          gap: 12px;
        }

        .dash-card {
          background: linear-gradient(180deg, rgba(20, 30, 49, 0.94), rgba(15, 23, 42, 0.9));
          padding: 18px;
          display: flex;
          flex-direction: column;
          gap: 10px;
          min-height: 172px;
        }

        .dash-card strong {
          font-size: 1.45rem;
          line-height: 1;
          letter-spacing: -0.04em;
        }

        .dash-card span {
          font-size: 0.9rem;
          color: var(--text-secondary);
        }

        .dashboard-columns {
          display: grid;
          grid-template-columns: minmax(0, 1.2fr) minmax(320px, 0.8fr);
          gap: 16px;
          align-items: start;
        }

        .dashboard-columns.single {
          grid-template-columns: 1fr;
        }

        .panel-card {
          padding: 20px;
        }

        .panel-head {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 12px;
          margin-bottom: 16px;
        }

        .panel-head .card-title {
          margin: 6px 0 0;
          font-size: 1.15rem;
        }

        .panel-count {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          padding: 8px 12px;
          border-radius: 999px;
          background: rgba(16, 185, 129, 0.1);
          border: 1px solid rgba(52, 211, 153, 0.16);
          color: var(--primary-light);
          font-size: 0.78rem;
          font-weight: 700;
          white-space: nowrap;
        }

        .recent-row {
          background: rgba(20, 30, 49, 0.94);
          padding: 15px 16px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          border-left-width: 3px;
        }

        .recent-row strong {
          letter-spacing: -0.03em;
        }

        .recent-main {
          min-width: 0;
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .recent-topline {
          display: flex;
          align-items: center;
          gap: 10px;
          flex-wrap: wrap;
        }

        .recent-meta {
          font-size: 0.84rem;
        }

        .recent-pending { border-left-color: var(--warning); }
        .recent-won { border-left-color: var(--success); }
        .recent-lost { border-left-color: var(--danger); }

        .recent-right {
          min-width: 132px;
          text-align: right;
          display: flex;
          flex-direction: column;
          gap: 6px;
          color: var(--text-secondary);
          font-size: 0.84rem;
        }

        .result-pill {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          padding: 5px 10px;
          border-radius: 999px;
          font-size: 0.72rem;
          font-weight: 700;
          text-transform: capitalize;
        }

        .result-pending {
          background: rgba(245, 158, 11, 0.12);
          color: #fbbf24;
        }

        .result-won {
          background: rgba(16, 185, 129, 0.12);
          color: #34d399;
        }

        .result-lost {
          background: rgba(239, 68, 68, 0.12);
          color: #f87171;
        }

        @media (max-width: 1100px) {
          .dash-grid {
            grid-template-columns: repeat(3, minmax(0, 1fr));
          }

          .dashboard-columns, .agent-dash-hero {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 760px) {
          .dash-grid, .hero-insight-grid {
            grid-template-columns: 1fr;
          }

          .recent-row {
            flex-direction: column;
            align-items: flex-start;
          }

          .recent-right {
            min-width: 0;
            text-align: left;
          }
        }
      `}</style>
    </div>
  );
};

export default AgentDashboard;
