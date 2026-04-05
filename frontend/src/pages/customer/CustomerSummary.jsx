import { useEffect, useState } from 'react';
import { FiTrendingDown, FiTrendingUp } from 'react-icons/fi';
import PageSkeleton from '../../components/PageSkeleton';
import { memberCopy } from '../../i18n/th/member';
import { getMemberSummary } from '../../services/api';
import { formatMoney as money } from '../../utils/formatters';

const CustomerSummary = () => {
  const copy = memberCopy.summary;
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await getMemberSummary({});
        setData(res.data);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  if (loading) return <PageSkeleton statCount={3} rows={4} sidebar={false} />;

  const overall = data?.overall || { totalAmount: 0, totalWon: 0, netResult: 0, totalBets: 0 };

  return (
    <div className="summary-page animate-fade-in">
      <section className={`summary-hero ${overall.netResult >= 0 ? 'positive' : 'negative'}`}>
        <div className="summary-hero-copy">
          <span className="section-eyebrow">{copy.heroEyebrow}</span>
          <h1 className="page-title">{copy.heroTitle}</h1>
          <p className="page-subtitle">{copy.heroSubtitle}</p>
        </div>
        <div className="summary-hero-score">
          <span className="summary-hero-label">{copy.netResult}</span>
          <span className="summary-hero-value">{overall.netResult >= 0 ? '+' : ''}{money(overall.netResult)} ฿</span>
          <span className="summary-hero-icon">{overall.netResult >= 0 ? <FiTrendingUp /> : <FiTrendingDown />}</span>
        </div>
      </section>

      <section className="summary-stats-grid">
        <article className="summary-stat-card"><span>{copy.stats.totalBets}</span><strong>{money(overall.totalBets)}</strong><small>{copy.stats.totalBetsHint}</small></article>
        <article className="summary-stat-card"><span>{copy.stats.totalAmount}</span><strong>{money(overall.totalAmount)} ฿</strong><small>{copy.stats.totalAmountHint}</small></article>
        <article className="summary-stat-card"><span>{copy.stats.totalWon}</span><strong>{money(overall.totalWon)} ฿</strong><small>{copy.stats.totalWonHint}</small></article>
      </section>

      <section className="summary-rounds-panel card">
        <div className="panel-head">
          <div>
            <div className="panel-eyebrow">{copy.panelEyebrow}</div>
            <h3 className="card-title">{copy.panelTitle}</h3>
          </div>
        </div>

        <div className="summary-rounds">
          {(!data?.rounds || data.rounds.length === 0) ? (
            <div className="empty-state"><div className="empty-state-text">{copy.empty}</div></div>
          ) : data.rounds.map((round) => (
            <article key={`${round.roundCode}-${round.marketId}`} className="summary-round-card">
              <div className="summary-round-top">
                <div>
                  <div className="summary-round-market">{round.marketName || copy.fallbackMarketName}</div>
                  <div className="summary-round-date">{round.roundCode || round.roundDate} • {copy.betCount(round.betCount)}</div>
                </div>
                <div className={`summary-round-net ${(round.netResult || 0) >= 0 ? 'positive' : 'negative'}`}>
                  {(round.netResult || 0) >= 0 ? '+' : ''}{money(round.netResult)} ฿
                </div>
              </div>
              <div className="summary-round-bottom">
                <span>{copy.stake(money(round.totalAmount))}</span>
                <span className="summary-round-results">
                  <span className="summary-dot dot-won"></span>{round.wonCount || 0}
                  <span className="summary-dot dot-lost"></span>{round.lostCount || 0}
                  <span className="summary-dot dot-pending"></span>{round.pendingCount || 0}
                </span>
              </div>
            </article>
          ))}
        </div>
      </section>

      <style>{`
        .summary-page{display:flex;flex-direction:column;gap:16px;position:relative;isolation:isolate}
        .summary-page::before{content:'';position:absolute;inset:-48px 0 auto;height:220px;background:radial-gradient(circle at top left,rgba(16,185,129,.14),transparent 62%);pointer-events:none;z-index:-1}
        .summary-hero{display:grid;grid-template-columns:minmax(0,1.1fr) minmax(280px,.9fr);gap:20px;padding:28px;border-radius:24px}
        .summary-hero.positive{background:linear-gradient(135deg,rgba(16,185,129,.14),rgba(16,185,129,.05));border:1px solid rgba(16,185,129,.25)}
        .summary-hero.negative{background:linear-gradient(135deg,rgba(239,68,68,.14),rgba(239,68,68,.05));border:1px solid rgba(239,68,68,.25)}
        .summary-hero-copy{display:flex;flex-direction:column;gap:12px}
        .section-eyebrow,.panel-eyebrow{font-size:.78rem;letter-spacing:.16em;text-transform:uppercase;color:var(--primary-light);font-weight:700}
        .summary-hero .page-title{margin:0;font-size:clamp(2rem,4vw,3rem);line-height:.96;letter-spacing:-.04em}
        .summary-hero .page-subtitle{margin:0;max-width:56ch}
        .summary-hero-score{display:flex;flex-direction:column;justify-content:center;align-items:flex-start;gap:8px}
        .summary-hero-label{font-size:.8rem;color:var(--text-muted)}
        .summary-hero-value{font-size:clamp(2rem,4vw,2.8rem);font-weight:800;line-height:.95}
        .summary-hero-icon{font-size:1.4rem;opacity:.7}
        .summary-stats-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px}
        .summary-stat-card,.summary-round-card{padding:18px;border-radius:20px;border:1px solid rgba(148,163,184,.14);background:linear-gradient(180deg,rgba(20,30,49,.94),rgba(15,23,42,.9))}
        .summary-stat-card span,.summary-stat-card small,.summary-round-date{color:var(--text-muted)}
        .summary-stat-card strong{font-size:1.45rem;line-height:1;letter-spacing:-.04em}
        .summary-rounds-panel{padding:20px}
        .panel-head{margin-bottom:16px}
        .panel-head .card-title{margin:6px 0 0;font-size:1.15rem}
        .summary-rounds{display:flex;flex-direction:column;gap:10px}
        .summary-round-top,.summary-round-bottom{display:flex;align-items:center;justify-content:space-between;gap:12px}
        .summary-round-market{font-size:.92rem;font-weight:700;color:var(--text-primary)}
        .summary-round-net{font-size:1rem;font-weight:800}
        .summary-round-net.positive{color:var(--success)} .summary-round-net.negative{color:var(--danger)}
        .summary-round-bottom{padding-top:10px;border-top:1px solid var(--border-light);font-size:.78rem;color:var(--text-muted)}
        .summary-round-results{display:flex;align-items:center;gap:4px;font-weight:600;font-size:.78rem;color:var(--text-secondary)}
        .summary-dot{width:8px;height:8px;border-radius:50%;margin-left:6px}
        .dot-won{background:var(--success)} .dot-lost{background:var(--danger)} .dot-pending{background:var(--warning)}
        @media (max-width:960px){.summary-hero,.summary-stats-grid{grid-template-columns:1fr}}
      `}</style>
    </div>
  );
};

export default CustomerSummary;
