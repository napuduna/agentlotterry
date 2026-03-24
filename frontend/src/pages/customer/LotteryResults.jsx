import { useEffect, useState } from 'react';
import { FiActivity, FiAlertCircle, FiAward, FiCheckCircle, FiClock, FiGrid, FiRefreshCw, FiSlash } from 'react-icons/fi';
import { getMarketOverview } from '../../services/api';

const statusMap = {
  live: { label: 'พร้อมใช้งาน', className: 'badge-success', icon: <FiCheckCircle /> },
  pending: { label: 'รอผล', className: 'badge-warning', icon: <FiClock /> },
  waiting: { label: 'รอเชื่อมต่อ', className: 'badge-info', icon: <FiRefreshCw /> },
  unsupported: { label: 'ยังไม่รองรับ', className: 'badge-danger', icon: <FiSlash /> }
};

const summaryCards = [
  { key: 'totalMarkets', label: 'ตลาดทั้งหมด', icon: <FiGrid /> },
  { key: 'liveCount', label: 'ข้อมูลพร้อมใช้', icon: <FiCheckCircle /> },
  { key: 'pendingCount', label: 'กำลังรอผล', icon: <FiClock /> },
  { key: 'unsupportedCount', label: 'ยังไม่รองรับ', icon: <FiSlash /> }
];

const getStatusMeta = (status) => statusMap[status] || statusMap.waiting;

const LotteryResults = () => {
  const [overview, setOverview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [reloading, setReloading] = useState(false);
  const [error, setError] = useState('');

  const loadOverview = async (showReload = false) => {
    if (showReload) {
      setReloading(true);
    } else {
      setLoading(true);
    }

    try {
      setError('');
      const response = await getMarketOverview();
      setOverview(response.data);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'โหลดภาพรวมตลาดไม่สำเร็จ');
    } finally {
      setLoading(false);
      setReloading(false);
    }
  };

  useEffect(() => {
    loadOverview();
  }, []);

  if (loading) {
    return <div className="loading-container"><div className="spinner"></div></div>;
  }

  if (!overview && error) {
    return (
      <div className="animate-fade-in">
        <div className="card">
          <div className="empty-state">
            <div className="empty-state-icon">⚠️</div>
            <div className="empty-state-text">{error}</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">🎰 ตลาดหวยและหุ้น</h1>
          <p className="page-subtitle">หน้าแสดงผลรวมหลายตลาดในดีไซน์ของระบบเรา ดึงข้อมูลสดจาก provider ภายนอกและข้อมูลในระบบ</p>
        </div>
        <button className="btn btn-secondary" onClick={() => loadOverview(true)} disabled={reloading}>
          {reloading ? <div className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }}></div> : <FiRefreshCw />}
          รีเฟรชข้อมูล
        </button>
      </div>

      <div className="market-overview-hero mb-lg">
        <div className="market-overview-copy">
          <div className="market-provider-pill">
            <FiActivity />
            <span>{overview?.provider?.configured ? `Provider: ${overview.provider.name}` : 'Provider ยังไม่ถูกตั้งค่า'}</span>
          </div>
          <h2>ภาพรวมตลาดพร้อมใช้งานในหน้าเดียว</h2>
          <p>
            ออกแบบใหม่ให้เรียบ อ่านง่าย และแสดงสถานะข้อมูลชัดเจน ทั้งหวยรัฐบาล หวยต่างประเทศ และตลาดหุ้นที่รองรับ
          </p>
          <div className="market-hero-meta">
            <span>อัปเดตล่าสุด: {overview?.provider?.fetchedAt ? new Date(overview.provider.fetchedAt).toLocaleString('th-TH') : '-'}</span>
            <span>Cache: {overview?.provider?.cacheTtlMs ? `${Math.round(overview.provider.cacheTtlMs / 1000)} วินาที` : '-'}</span>
          </div>
        </div>
        <div className="overview-stat-grid">
          {summaryCards.map((item) => (
            <div className="overview-stat-card" key={item.key}>
              <div className="overview-stat-icon">{item.icon}</div>
              <div className="overview-stat-value">{overview?.summary?.[item.key] ?? 0}</div>
              <div className="overview-stat-label">{item.label}</div>
            </div>
          ))}
        </div>
      </div>

      {error ? (
        <div className="card mb-lg">
          <div className="badge badge-danger" style={{ marginBottom: 12 }}>
            <FiAlertCircle />
            <span>มีปัญหาในการโหลดข้อมูลบางส่วน</span>
          </div>
          <div className="text-muted">{error}</div>
        </div>
      ) : null}

      {overview?.warnings?.length ? (
        <div className="card mb-lg">
          <div className="card-header">
            <h3 className="card-title"><FiAlertCircle style={{ marginRight: 8, color: 'var(--warning)' }} />สถานะการเชื่อมต่อ</h3>
          </div>
          <div className="warning-list">
            {overview.warnings.map((warning, index) => (
              <div className="warning-item" key={`${warning}-${index}`}>{warning}</div>
            ))}
          </div>
        </div>
      ) : null}

      {(overview?.sections || []).map((section) => (
        <div className="card mb-lg" key={section.id}>
          <div className="card-header">
            <div>
              <h3 className="card-title">{section.title}</h3>
              <div className="page-subtitle">{section.description}</div>
            </div>
            <span className="badge badge-info">{section.markets.length} รายการ</span>
          </div>

          <div className="market-grid">
            {section.markets.map((market) => {
              const statusMeta = getStatusMeta(market.status);

              return (
                <div className={`market-card market-card-${market.status}`} key={market.id}>
                  <div className="market-card-header">
                    <div>
                      <div className="market-card-title">{market.name}</div>
                      <div className="market-card-date">{market.resultDate || 'ยังไม่มีวันออกรางวัลล่าสุด'}</div>
                    </div>
                    <span className={`badge ${statusMeta.className}`}>
                      {statusMeta.icon}
                      <span>{statusMeta.label}</span>
                    </span>
                  </div>

                  <div className="market-card-headline">{market.headline || '--'}</div>

                  <div className="market-chip-list">
                    {market.numbers.length ? market.numbers.map((number) => (
                      <div className="market-chip" key={`${market.id}-${number.label}`}>
                        <span className="market-chip-label">{number.label}</span>
                        <strong>{number.value}</strong>
                      </div>
                    )) : (
                      <div className="market-chip market-chip-empty">
                        <span className="market-chip-label">สถานะ</span>
                        <strong>{market.note || 'ยังไม่มีข้อมูลสำหรับแสดงผล'}</strong>
                      </div>
                    )}
                  </div>

                  <div className="market-card-footer">
                    <div className="market-card-note">{market.note || 'พร้อมสำหรับเชื่อมต่อข้อมูลเพิ่มเติม'}</div>
                    <div className="market-card-provider">{market.provider === 'internal' ? 'ข้อมูลในระบบ' : 'APILOTTO'}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}

      <div className="card">
        <div className="card-header">
          <h3 className="card-title"><FiAward style={{ marginRight: 8, color: 'var(--primary-light)' }} />หมายเหตุการใช้งาน</h3>
        </div>
        <div className="warning-list">
          <div className="warning-item">ถ้ายังไม่ได้ตั้งค่า `APILOTTO_API_KEY` ระบบจะยังแสดงโครงสร้างตลาดพร้อมสถานะรอเชื่อมต่อ</div>
          <div className="warning-item">หวยรัฐบาลไทยยังอ่านจากฐานข้อมูลเดิมในระบบ เพื่อให้หน้าใหม่ทำงานต่อเนื่องกับ flow เก่า</div>
          <div className="warning-item">รายการที่ provider ยังไม่รองรับ เช่น ธกส หรือ ออมสิน จะแสดงเป็นยังไม่รองรับไว้ก่อน</div>
        </div>
      </div>
    </div>
  );
};

export default LotteryResults;
