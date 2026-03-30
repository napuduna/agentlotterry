import { Link, useNavigate } from 'react-router-dom';
import { FiActivity, FiArrowRight, FiClock, FiLayers, FiTrendingUp } from 'react-icons/fi';
import PageSkeleton from '../../components/PageSkeleton';
import { useCatalog } from '../../context/CatalogContext';

const statusLabels = {
  open: 'Open',
  upcoming: 'Upcoming',
  closed: 'Closed',
  resulted: 'Resulted',
  missing: 'No round'
};

const formatCountdown = (seconds) => {
  if (seconds === null || seconds === undefined) return '-';
  if (seconds <= 0) return '00:00:00';
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  return [hours, minutes, secs].map((value) => String(value).padStart(2, '0')).join(':');
};

const betTypeLabels = {
  '3top': '3 Top',
  '3tod': '3 Tod',
  '2top': '2 Top',
  '2bottom': '2 Bottom',
  'run_top': 'Run Top',
  'run_bottom': 'Run Bottom'
};

const CustomerOverview = () => {
  const navigate = useNavigate();
  const {
    leagues,
    announcements,
    selectedLottery,
    selectedRound,
    selectedRateProfile,
    markAnnouncementRead,
    setSelectedLottery,
    setSelectedRateProfile,
    loading
  } = useCatalog();

  if (loading) return <PageSkeleton statCount={4} rows={6} sidebar={false} />;

  const lotteryCount = leagues.reduce((sum, league) => sum + league.lotteries.length, 0);
  const openCount = leagues.reduce((sum, league) => sum + league.lotteries.filter((lottery) => lottery.status === 'open').length, 0);

  return (
    <div className="animate-fade-in customer-market-page">
      <section className="market-hero card">
        <div className="market-hero-copy">
          <span className="section-eyebrow">Markets board</span>
          <h1 className="page-title">Choose your market</h1>
          <p className="page-subtitle">Browse active lotteries, review round timing, compare rate profiles, and jump into the betting console from one clean board.</p>
          <div className="market-hero-meta">
            <span><FiActivity /> {lotteryCount} markets</span>
            <span><FiTrendingUp /> {openCount} open now</span>
            <span><FiClock /> Countdown {formatCountdown(selectedLottery?.countdownSeconds)}</span>
          </div>
        </div>
        <Link to="/customer/bet" className="btn btn-primary">
          Open betting console <FiArrowRight />
        </Link>
      </section>

      <section className="market-stat-grid">
        <article className="market-stat-card">
          <span>Selected market</span>
          <strong>{selectedLottery?.name || '-'}</strong>
          <small>{selectedLottery?.provider || 'No provider selected'}</small>
        </article>
        <article className="market-stat-card">
          <span>Current round</span>
          <strong>{selectedRound?.displayDate || selectedRound?.title || '-'}</strong>
          <small>{selectedRound?.displayCloseAt || 'No round loaded'}</small>
        </article>
        <article className="market-stat-card">
          <span>Rate profile</span>
          <strong>{selectedRateProfile?.name || '-'}</strong>
          <small>{selectedLottery?.supportedBetTypes?.length || 0} bet types supported</small>
        </article>
        <article className="market-stat-card">
          <span>Status</span>
          <strong>{statusLabels[selectedLottery?.status] || '-'}</strong>
          <small>{selectedLottery?.description || 'Select a market to see more details'}</small>
        </article>
      </section>

      {announcements.length > 0 ? (
        <section className="card market-panel">
          <div className="panel-head">
            <div>
              <div className="panel-eyebrow">Notice board</div>
              <h3 className="card-title">Announcements</h3>
            </div>
          </div>
          <div className="announcement-list">
            {announcements.map((announcement) => (
              <article key={announcement.id} className="announcement-row">
                <div>
                  <strong>{announcement.title}</strong>
                  <div className="announcement-body">{announcement.body}</div>
                </div>
                {!announcement.isRead ? (
                  <button type="button" className="btn btn-secondary btn-sm" onClick={() => markAnnouncementRead(announcement.id)}>
                    Mark read
                  </button>
                ) : (
                  <span className="read-pill">Read</span>
                )}
              </article>
            ))}
          </div>
        </section>
      ) : null}

      {selectedLottery ? (
        <section className="card market-panel">
          <div className="panel-head">
            <div>
              <div className="panel-eyebrow">Selected market</div>
              <h3 className="card-title">{selectedLottery.name}</h3>
            </div>
          </div>

          <div className="selected-market-summary">
            <span>Round {selectedRound?.title || '-'}</span>
            <span>Close {selectedRound?.displayCloseAt || '-'}</span>
            <span>Draw {selectedRound?.displayDrawAt || '-'}</span>
          </div>

          <div className="catalog-rate-chips">
            {selectedLottery.rateProfiles.map((profile) => (
              <button key={profile.id} className={`catalog-chip ${selectedRateProfile?.id === profile.id ? 'catalog-chip-active' : ''}`} onClick={() => setSelectedRateProfile(profile.id)}>
                {profile.name}
              </button>
            ))}
          </div>

          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Bet type</th>
                  <th>Rate</th>
                </tr>
              </thead>
              <tbody>
                {selectedLottery.supportedBetTypes.map((betType) => (
                  <tr key={betType}>
                    <td>{betTypeLabels[betType]}</td>
                    <td>x{selectedRateProfile?.rates?.[betType] || 0}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}

      {leagues.map((league) => (
        <section key={league.id} className="league-section">
          <div className="market-section-heading">{league.name}</div>
          <div className="market-grid">
            {league.lotteries.map((lottery) => {
              const latestResult = lottery.latestResult;
              return (
                <button
                  key={lottery.id}
                  type="button"
                  className={`market-card market-card-button market-card-${lottery.status === 'open' ? 'live' : lottery.status === 'upcoming' ? 'pending' : lottery.status === 'closed' ? 'waiting' : 'unsupported'} ${selectedLottery?.id === lottery.id ? 'market-card-active' : ''}`}
                  onClick={() => {
                    setSelectedLottery(lottery.id);
                    navigate('/customer/bet');
                  }}
                >
                  <div className="market-card-header">
                    <div>
                      <div className="market-card-title">{lottery.name}</div>
                      <div className="market-card-date">{lottery.activeRound?.title || 'No round'}</div>
                    </div>
                    <span className={`badge badge-${lottery.status === 'open' ? 'success' : lottery.status === 'upcoming' ? 'warning' : lottery.status === 'closed' ? 'info' : 'danger'}`}>
                      {statusLabels[lottery.status] || lottery.status}
                    </span>
                  </div>

                  <div className="market-card-headline">
                    {latestResult?.headline || lottery.activeRound?.displayDate || 'Waiting for data'}
                  </div>

                  <div className="market-chip-list">
                    <div className="market-chip"><span className="market-chip-label">Close</span><strong>{lottery.activeRound?.displayCloseAt || '-'}</strong></div>
                    <div className="market-chip"><span className="market-chip-label">Countdown</span><strong>{formatCountdown(lottery.countdownSeconds)}</strong></div>
                    <div className="market-chip"><span className="market-chip-label">Rate</span><strong>{lottery.rateProfiles?.[0]?.name || '-'}</strong></div>
                    <div className="market-chip"><span className="market-chip-label">Latest result</span><strong>{latestResult?.headline || latestResult?.twoBottom || latestResult?.threeTop || 'No result yet'}</strong></div>
                  </div>

                  <div className="market-card-footer">
                    <div className="market-card-note">{lottery.supportedBetTypes.length} bet types available</div>
                    <div className="market-card-provider">{lottery.provider}</div>
                  </div>
                </button>
              );
            })}
          </div>
        </section>
      ))}

      <style>{`
        .customer-market-page{display:flex;flex-direction:column;gap:18px;position:relative;isolation:isolate}
        .customer-market-page::before{content:'';position:absolute;inset:-48px 0 auto;height:220px;background:radial-gradient(circle at top left,rgba(16,185,129,.14),transparent 62%);pointer-events:none;z-index:-1}
        .market-hero{display:flex;justify-content:space-between;align-items:flex-end;gap:24px;padding:28px;background:linear-gradient(135deg,rgba(15,23,42,.96),rgba(17,24,39,.9)),radial-gradient(circle at top right,rgba(16,185,129,.12),transparent 38%);border-color:rgba(52,211,153,.18);box-shadow:0 24px 60px rgba(15,23,42,.34)}
        .market-hero-copy{display:flex;flex-direction:column;gap:12px;min-width:0}
        .section-eyebrow,.panel-eyebrow{font-size:.78rem;letter-spacing:.16em;text-transform:uppercase;color:var(--primary-light);font-weight:700}
        .market-hero .page-title{margin:0;font-size:clamp(2rem,4vw,3rem);line-height:.96;letter-spacing:-.04em}
        .market-hero .page-subtitle{margin:0;max-width:56ch}
        .market-hero-meta,.selected-market-summary{display:flex;gap:12px;flex-wrap:wrap}
        .market-hero-meta span,.selected-market-summary span{display:inline-flex;align-items:center;gap:6px;padding:8px 12px;border-radius:999px;background:rgba(9,16,30,.78);border:1px solid rgba(148,163,184,.14);color:var(--text-secondary);font-size:.82rem}
        .market-stat-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px}
        .market-stat-card{padding:18px;border-radius:20px;border:1px solid rgba(148,163,184,.14);background:linear-gradient(180deg,rgba(20,30,49,.94),rgba(15,23,42,.9));display:flex;flex-direction:column;gap:8px}
        .market-stat-card span,.market-stat-card small,.announcement-body{color:var(--text-muted)}
        .market-stat-card strong{font-size:1.35rem;line-height:1;letter-spacing:-.04em}
        .market-panel{padding:20px}
        .panel-head{display:flex;justify-content:space-between;align-items:flex-start;gap:12px;margin-bottom:16px}
        .panel-head .card-title{margin:6px 0 0;font-size:1.15rem}
        .announcement-list{display:flex;flex-direction:column;gap:12px}
        .announcement-row{display:flex;justify-content:space-between;gap:12px;align-items:flex-start;padding:16px;border-radius:18px;border:1px solid rgba(148,163,184,.14);background:rgba(20,30,49,.94)}
        .read-pill{display:inline-flex;align-items:center;justify-content:center;padding:6px 10px;border-radius:999px;background:rgba(16,185,129,.12);color:#34d399;font-size:.72rem;font-weight:700}
        .catalog-rate-chips{display:flex;gap:8px;flex-wrap:wrap;margin:16px 0}
        .catalog-chip{padding:8px 14px;border-radius:999px;background:rgba(9,16,30,.76);border:1px solid rgba(148,163,184,.16);color:var(--text-secondary);font-size:.82rem;font-weight:700}
        .catalog-chip-active{background:rgba(16,185,129,.12);border-color:rgba(52,211,153,.2);color:var(--primary-light)}
        .league-section{display:flex;flex-direction:column;gap:12px}
        @media (max-width:1100px){.market-stat-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.market-hero{flex-direction:column;align-items:stretch}}
        @media (max-width:760px){.market-stat-grid{grid-template-columns:1fr}.announcement-row{flex-direction:column;align-items:stretch}}
      `}</style>
    </div>
  );
};

export default CustomerOverview;
