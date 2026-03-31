import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { FiClock, FiFileText, FiRotateCcw, FiSlash } from 'react-icons/fi';
import PageSkeleton from '../../components/PageSkeleton';
import { memberCopy } from '../../i18n/th/member';
import { getSlipStatusLabel } from '../../i18n/th/labels';
import { cancelMemberSlip, getMemberSlips } from '../../services/api';

const tabs = [
  { value: 'draft', label: memberCopy.history.tabs.draft, icon: <FiFileText /> },
  { value: 'submitted', label: memberCopy.history.tabs.submitted, icon: <FiClock /> },
  { value: 'cancelled', label: memberCopy.history.tabs.cancelled, icon: <FiSlash /> }
];

const BetHistory = () => {
  const copy = memberCopy.history;
  const [activeTab, setActiveTab] = useState('draft');
  const [slips, setSlips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cancellingId, setCancellingId] = useState('');

  const loadSlips = async (status = activeTab) => {
    setLoading(true);
    try {
      const res = await getMemberSlips({ status });
      setSlips(res.data || []);
    } catch (error) {
      console.error(error);
      toast.error(copy.loadError);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSlips(activeTab);
  }, [activeTab]);

  const handleCancel = async (slipId) => {
    setCancellingId(slipId);
    try {
      await cancelMemberSlip(slipId);
      toast.success(copy.cancelSuccess);
      await loadSlips(activeTab);
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message || copy.cancelError);
    } finally {
      setCancellingId('');
    }
  };

  return (
    <div className="animate-fade-in customer-history-page">
      <section className="history-hero card">
        <div className="history-hero-copy">
          <span className="section-eyebrow">{copy.heroEyebrow}</span>
          <h1 className="page-title">{copy.heroTitle}</h1>
          <p className="page-subtitle">{copy.heroSubtitle}</p>
        </div>
        <Link to="/customer" className="btn btn-primary">ดูตลาดและผลล่าสุด</Link>
      </section>

      <section className="card history-note-card">
        <div className="history-note">
          <FiClock />
          <span>รายการใหม่จะถูกทำโดยเอเย่นต์หรือแอดมินแทนสมาชิก คุณยังดูโพย ยกเลิกรายการที่ยังเปิดอยู่ และติดตามผลได้จากหน้านี้</span>
        </div>
      </section>

      <div className="history-filter-chips">
        {tabs.map((tab) => (
          <button key={tab.value} className={`history-chip ${activeTab === tab.value ? 'active' : ''}`} onClick={() => setActiveTab(tab.value)}>
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {loading ? (
        <PageSkeleton statCount={3} rows={4} sidebar={false} />
      ) : slips.length === 0 ? (
        <section className="card">
          <div className="empty-state">
            <div className="empty-state-icon"><FiFileText /></div>
            <div className="empty-state-text">{copy.empty}</div>
            <Link to="/customer" className="btn btn-secondary btn-sm">กลับไปดูตลาดหวย</Link>
          </div>
        </section>
      ) : (
        <div className="slip-history-list">
          {slips.map((slip) => (
            <article key={slip.id} className={`card slip-history-card slip-history-card-${slip.status}`}>
              <div className="slip-history-top">
                <div>
                  <div className="slip-history-number">{slip.slipNumber}</div>
                  <div className="slip-history-market">{slip.lotteryName} • {slip.roundCode}</div>
                  <div className="slip-history-placed-by">ทำรายการโดย {slip.placedBy?.name || slip.placedBy?.role || '-'}</div>
                </div>
                <span className={`badge badge-${slip.status === 'submitted' ? 'success' : slip.status === 'cancelled' ? 'danger' : 'info'}`}>{getSlipStatusLabel(slip.status)}</span>
              </div>

              {slip.memo ? <div className="slip-history-memo">{slip.memo}</div> : null}

              <div className="slip-history-grid">
                <div className="slip-history-stat"><span>{copy.stats.itemCount}</span><strong>{slip.itemCount}</strong></div>
                <div className="slip-history-stat"><span>{copy.stats.totalAmount}</span><strong>{slip.totalAmount.toLocaleString('th-TH')} ฿</strong></div>
                <div className="slip-history-stat"><span>{copy.stats.totalWon}</span><strong>{(slip.summary?.totalWon || 0).toLocaleString('th-TH')} ฿</strong></div>
                <div className="slip-history-stat"><span>{copy.stats.pending}</span><strong>{slip.summary?.pendingCount || 0}</strong></div>
              </div>

              <div className="slip-preview-list">
                {(slip.previewNumbers || []).map((number, index) => <span key={`${slip.id}-${number}-${index}`} className="slip-preview-pill">{number}</span>)}
              </div>

              <div className="slip-history-bottom">
                <div className="slip-history-date">{slip.submittedAt || slip.createdAt ? new Date(slip.submittedAt || slip.createdAt).toLocaleString('th-TH') : '-'}</div>
                {slip.canCancel ? (
                  <button className="btn btn-danger" onClick={() => handleCancel(slip.id)} disabled={cancellingId === slip.id}>
                    <FiRotateCcw /> {copy.cancelSlip}
                  </button>
                ) : null}
              </div>
            </article>
          ))}
        </div>
      )}

      <style>{`
        .customer-history-page,.slip-history-list{display:flex;flex-direction:column;gap:16px}
        .customer-history-page{position:relative;isolation:isolate}
        .customer-history-page::before{content:'';position:absolute;inset:-48px 0 auto;height:220px;background:radial-gradient(circle at top left,rgba(16,185,129,.14),transparent 62%);pointer-events:none;z-index:-1}
        .history-hero{display:flex;justify-content:space-between;align-items:flex-end;gap:24px;padding:28px;background:linear-gradient(135deg,rgba(15,23,42,.96),rgba(17,24,39,.9)),radial-gradient(circle at top right,rgba(16,185,129,.12),transparent 38%);border-color:rgba(52,211,153,.18);box-shadow:0 24px 60px rgba(15,23,42,.34)}
        .history-hero-copy{display:flex;flex-direction:column;gap:12px}
        .section-eyebrow{font-size:.78rem;letter-spacing:.16em;text-transform:uppercase;color:var(--primary-light);font-weight:700}
        .history-hero .page-title{margin:0;font-size:clamp(2rem,4vw,3rem);line-height:.96;letter-spacing:-.04em}
        .history-hero .page-subtitle{margin:0;max-width:56ch}
        .history-note-card{padding:0}
        .history-note{display:flex;align-items:flex-start;gap:10px;padding:16px 18px;border-radius:inherit;background:rgba(16,185,129,.08);color:var(--text-secondary);line-height:1.6}
        .history-note svg{margin-top:2px;flex-shrink:0;color:var(--primary-light)}
        .history-filter-chips{display:flex;gap:8px;overflow-x:auto;scrollbar-width:none}
        .history-filter-chips::-webkit-scrollbar{display:none}
        .history-chip{display:inline-flex;align-items:center;gap:8px;padding:10px 16px;border-radius:999px;background:rgba(9,16,30,.76);border:1px solid rgba(148,163,184,.16);color:var(--text-secondary);font-size:.84rem;font-weight:700;white-space:nowrap}
        .history-chip.active{background:rgba(16,185,129,.12);border-color:rgba(52,211,153,.2);color:var(--primary-light)}
        .slip-history-card{display:flex;flex-direction:column;gap:14px}
        .slip-history-card-submitted{border-left:3px solid var(--success)}
        .slip-history-card-draft{border-left:3px solid #38bdf8}
        .slip-history-card-cancelled{border-left:3px solid var(--danger)}
        .slip-history-top,.slip-history-bottom{display:flex;align-items:center;justify-content:space-between;gap:12px}
        .slip-history-number{font-size:1rem;font-weight:800;color:var(--text-primary)}
        .slip-history-market,.slip-history-date{font-size:.8rem;color:var(--text-muted)}
        .slip-history-placed-by{margin-top:4px;font-size:.78rem;color:var(--primary-light)}
        .slip-history-memo{padding:10px 12px;background:var(--bg-surface);border-radius:var(--radius-md);color:var(--text-secondary);font-size:.85rem}
        .slip-history-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px}
        .slip-history-stat{padding:14px;background:var(--bg-surface);border:1px solid var(--border);border-radius:var(--radius-md)}
        .slip-history-stat span{display:block;font-size:.72rem;color:var(--text-muted);margin-bottom:6px;text-transform:uppercase;letter-spacing:.05em}
        .slip-history-stat strong{font-size:1rem;color:var(--text-primary)}
        .slip-preview-list{display:flex;flex-wrap:wrap;gap:8px}
        .slip-preview-pill{padding:7px 12px;border-radius:999px;background:var(--bg-surface);border:1px solid var(--border);color:var(--text-primary);font-size:.8rem;font-weight:700;letter-spacing:.06em}
        @media (max-width:900px){.history-hero{flex-direction:column;align-items:stretch}.slip-history-grid{grid-template-columns:repeat(2,minmax(0,1fr))}}
        @media (max-width:760px){.slip-history-grid{grid-template-columns:1fr}.slip-history-top,.slip-history-bottom{flex-direction:column;align-items:flex-start}}
      `}</style>
    </div>
  );
};

export default BetHistory;
