import { useEffect, useMemo, useState } from 'react';
import { FiDollarSign, FiTrendingUp, FiUser, FiUsers } from 'react-icons/fi';
import PageSkeleton from '../../components/PageSkeleton';
import { getAdminDashboard } from '../../services/api';

const money = (value) => Number(value || 0).toLocaleString('th-TH');

const betTypeLabels = {
  '3top': '3 ตัวบน',
  '3tod': '3 ตัวโต๊ด',
  '2top': '2 ตัวบน',
  '2bottom': '2 ตัวล่าง',
  'run_top': 'วิ่งบน',
  'run_bottom': 'วิ่งล่าง'
};

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
      label: 'เจ้ามือ',
      hint: `ใช้งานอยู่ ${stats.activeAgents || 0} คน`
    },
    {
      icon: FiUser,
      value: stats.totalCustomers || 0,
      label: 'สมาชิก',
      hint: `ใช้งานอยู่ ${stats.activeCustomers || 0} คน`
    },
    {
      icon: FiDollarSign,
      value: `${money(stats.totalAmount)} บาท`,
      label: 'ยอดแทงรวม',
      hint: 'ยอดรับทั้งหมดของระบบ'
    },
    {
      icon: FiTrendingUp,
      value: `${money(stats.netProfit)} บาท`,
      label: 'กำไรสุทธิ',
      hint: 'ผลสุทธิหลังหักยอดจ่าย'
    }
  ]), [stats]);

  if (loading) {
    return <PageSkeleton statCount={4} rows={5} sidebar compactSidebar />;
  }

  return (
    <div className="ops-page animate-fade-in">
      <section className="ops-hero">
        <div className="ops-hero-copy">
          <span className="ui-eyebrow">ศูนย์ควบคุมระบบ</span>
          <h1 className="page-title">แดชบอร์ดแอดมิน</h1>
          <p className="page-subtitle">ดูภาพรวมสุขภาพระบบ จำนวนผู้ใช้งาน ความเคลื่อนไหวยอดเงิน และรายการแทงล่าสุดจากหน้าเดียว</p>
        </div>

        <div className={`ops-hero-side ${(stats.netProfit || 0) >= 0 ? 'admin-hero-positive' : 'admin-hero-negative'}`}>
          <span>ผลสุทธิของระบบ</span>
          <strong>{(stats.netProfit || 0) >= 0 ? '+' : ''}{money(stats.netProfit)} บาท</strong>
          <small>ยอดจ่ายรวม {money(stats.totalWon)} บาท</small>
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
              <div className="ui-eyebrow">Platform activity</div>
              <h3 className="card-title">สถิติการแทง</h3>
            </div>
          </div>

          <div className="ops-stack">
            <div className="ops-stat-row"><span>รายการแทงทั้งหมด</span><strong>{money(stats.totalBets)}</strong></div>
            <div className="ops-stat-row"><span>รายการรอผล</span><strong>{money(stats.pendingBets)}</strong></div>
            <div className="ops-stat-row"><span>ยอดจ่ายรวม</span><strong>{money(stats.totalWon)} บาท</strong></div>
            <div className="ops-stat-row"><span>ผลสุทธิ</span><strong>{money(stats.netProfit)} บาท</strong></div>
          </div>
        </section>

        <section className="card ops-section">
          <div className="ui-panel-head">
            <div>
              <div className="ui-eyebrow">ความเคลื่อนไหวล่าสุด</div>
              <h3 className="card-title">รายการแทงล่าสุด</h3>
            </div>
          </div>

          {data?.recentBets?.length ? (
            <div className="ops-stack">
              {data.recentBets.slice(0, 6).map((bet, index) => (
                <article key={`${bet._id || index}-${bet.number}`} className="ops-feed-row">
                  <div>
                    <strong>{bet.customerId?.name || 'ไม่ทราบชื่อ'} - {betTypeLabels[bet.betType] || bet.betType}</strong>
                    <div className="ops-feed-meta">{bet.marketName || 'ตลาดหวย'} - {bet.roundDate} - #{bet.number}</div>
                  </div>
                  <div className="ops-feed-right">
                    <strong>{money(bet.amount)} บาท</strong>
                    <span className={`badge badge-${bet.result === 'won' ? 'success' : bet.result === 'lost' ? 'danger' : 'warning'}`}>
                      {bet.result === 'won' ? 'ถูกรางวัล' : bet.result === 'lost' ? 'ไม่ถูก' : 'รอผล'}
                    </span>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="empty-state"><div className="empty-state-text">ยังไม่มีรายการแทงล่าสุด</div></div>
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
