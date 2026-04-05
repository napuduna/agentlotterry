import { useEffect, useState } from 'react';
import { FiArrowDownLeft, FiArrowUpRight, FiClock } from 'react-icons/fi';
import PageSkeleton from '../../components/PageSkeleton';
import { memberCopy } from '../../i18n/th/member';
import { getWalletEntryTypeLabel, getWalletReasonLabel } from '../../i18n/th/labels';
import { getWalletHistory, getWalletSummary } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { formatDateTime, formatMoney as money } from '../../utils/formatters';

const CustomerWallet = () => {
  const copy = memberCopy.wallet;
  const { checkAuth } = useAuth();
  const [summary, setSummary] = useState(null);
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [summaryRes, historyRes] = await Promise.all([
          getWalletSummary({}),
          getWalletHistory({ limit: 50 })
        ]);

        setSummary(summaryRes.data);
        setEntries(historyRes.data || []);
        await checkAuth();
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  if (loading) return <PageSkeleton statCount={3} rows={5} sidebar={false} />;

  const totals = summary?.totals || {};
  const account = summary?.account || {};

  return (
    <div className="wallet-page animate-fade-in">
      <section className="wallet-hero card">
        <div className="wallet-hero-copy">
          <span className="section-eyebrow">{copy.heroEyebrow}</span>
          <h1 className="page-title">{copy.heroTitle}</h1>
          <p className="page-subtitle">{copy.heroSubtitle}</p>
        </div>
        <div className="wallet-balance-block">
          <span>{copy.currentBalance}</span>
          <strong>{money(account.creditBalance)} ฿</strong>
          <small>{copy.transactionCount(totals.transactionCount || 0)}</small>
        </div>
      </section>

      <section className="wallet-grid">
        <article className="wallet-stat"><span>{copy.stats.creditIn}</span><strong>{money(totals.totalCreditIn)}</strong><small>{copy.stats.creditInHint}</small></article>
        <article className="wallet-stat"><span>{copy.stats.creditOut}</span><strong>{money(totals.totalCreditOut)}</strong><small>{copy.stats.creditOutHint}</small></article>
        <article className="wallet-stat"><span>{copy.stats.netFlow}</span><strong>{money(totals.netFlow)}</strong><small>{copy.stats.netFlowHint}</small></article>
      </section>

      <section className="card wallet-list">
        <div className="panel-head">
          <div>
            <div className="panel-eyebrow">{copy.panelEyebrow}</div>
            <h3 className="card-title">{copy.panelTitle}</h3>
          </div>
        </div>

        {entries.length === 0 ? (
          <div className="empty-state"><div className="empty-state-text">{copy.empty}</div></div>
        ) : entries.map((entry) => (
          <article key={entry.id} className={`wallet-row wallet-${entry.direction}`}>
            <div className="wallet-row-icon">{entry.direction === 'credit' ? <FiArrowDownLeft /> : <FiArrowUpRight />}</div>
            <div className="wallet-row-main">
              <div className="wallet-row-top">
                <strong>{getWalletEntryTypeLabel(entry.entryType)}</strong>
                <span className={`wallet-amount ${entry.direction}`}>{entry.direction === 'credit' ? '+' : '-'}{money(entry.amount)}</span>
              </div>
              <div className="wallet-row-meta">
                <span>{entry.counterparty?.name || entry.performedBy?.name || 'ระบบ'}</span>
                <span>{getWalletReasonLabel(entry.reasonCode)}</span>
                <span>{copy.balanceAfter(money(entry.balanceAfter))}</span>
              </div>
              {entry.note ? <div className="wallet-row-note">{entry.note}</div> : null}
            </div>
            <div className="wallet-row-time"><FiClock /><span>{formatDateTime(entry.createdAt)}</span></div>
          </article>
        ))}
      </section>

      <style>{`
        .wallet-page,.wallet-list{display:flex;flex-direction:column;gap:16px;position:relative;isolation:isolate}
        .wallet-page::before{content:'';position:absolute;inset:-48px 0 auto;height:220px;background:radial-gradient(circle at top left,rgba(16,185,129,.14),transparent 62%);pointer-events:none;z-index:-1}
        .wallet-hero{display:grid;grid-template-columns:minmax(0,1fr) minmax(280px,.8fr);gap:20px;padding:28px;background:linear-gradient(135deg,rgba(15,23,42,.96),rgba(17,24,39,.9)),radial-gradient(circle at top right,rgba(56,189,248,.14),transparent 38%);border-color:rgba(96,165,250,.18);box-shadow:0 24px 60px rgba(15,23,42,.34)}
        .wallet-hero-copy{display:flex;flex-direction:column;gap:12px}
        .section-eyebrow,.panel-eyebrow{font-size:.78rem;letter-spacing:.16em;text-transform:uppercase;color:var(--primary-light);font-weight:700}
        .wallet-hero .page-title{margin:0;font-size:clamp(2rem,4vw,3rem);line-height:.96;letter-spacing:-.04em}
        .wallet-hero .page-subtitle{margin:0;max-width:56ch}
        .wallet-balance-block{display:flex;flex-direction:column;justify-content:center;gap:8px;padding:18px;border-radius:20px;border:1px solid rgba(96,165,250,.18);background:rgba(9,16,30,.84)}
        .wallet-balance-block span,.wallet-balance-block small,.wallet-stat span,.wallet-stat small,.wallet-row-meta,.wallet-row-time,.wallet-row-note{color:var(--text-muted)}
        .wallet-balance-block strong{font-size:clamp(2rem,4vw,2.8rem);line-height:.95;letter-spacing:-.05em}
        .wallet-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px}
        .wallet-stat{padding:18px;border-radius:20px;border:1px solid rgba(148,163,184,.14);background:linear-gradient(180deg,rgba(20,30,49,.94),rgba(15,23,42,.9));display:flex;flex-direction:column;gap:8px}
        .wallet-stat strong{font-size:1.35rem;line-height:1;letter-spacing:-.04em}
        .wallet-list{padding:20px}
        .panel-head{margin-bottom:16px}
        .panel-head .card-title{margin:6px 0 0;font-size:1.15rem}
        .wallet-row{padding:16px;border-radius:20px;border:1px solid rgba(148,163,184,.14);background:linear-gradient(180deg,rgba(20,30,49,.94),rgba(15,23,42,.9));display:grid;grid-template-columns:auto 1fr auto;gap:12px;align-items:center;border-left-width:3px}
        .wallet-credit{border-left-color:var(--success)} .wallet-debit{border-left-color:var(--danger)}
        .wallet-row-icon{width:40px;height:40px;border-radius:14px;background:var(--bg-surface);display:flex;align-items:center;justify-content:center}
        .wallet-row-top{display:flex;align-items:center;justify-content:space-between;gap:12px}
        .wallet-row-meta{display:flex;gap:12px;flex-wrap:wrap;font-size:.8rem;margin-top:4px}
        .wallet-row-note{margin-top:6px;font-size:.82rem}
        .wallet-row-time{display:flex;align-items:center;gap:6px;font-size:.78rem}
        .wallet-amount.credit{color:var(--success)} .wallet-amount.debit{color:var(--danger)}
        @media (max-width:960px){.wallet-hero,.wallet-grid{grid-template-columns:1fr}}
        @media (max-width:760px){.wallet-row{grid-template-columns:auto 1fr}.wallet-row-time{grid-column:2}}
      `}</style>
    </div>
  );
};

export default CustomerWallet;
