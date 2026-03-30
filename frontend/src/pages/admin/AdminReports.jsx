import { useEffect, useMemo, useState } from 'react';
import { FiFileText } from 'react-icons/fi';
import PageSkeleton from '../../components/PageSkeleton';
import { getAdminReports } from '../../services/api';

const money = (value) => Number(value || 0).toLocaleString('th-TH');

const AdminReports = () => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [roundDate, setRoundDate] = useState('');

  useEffect(() => {
    const loadReports = async () => {
      try {
        const params = {};
        if (roundDate) params.roundDate = roundDate;
        const res = await getAdminReports(params);
        setReports(res.data || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    loadReports();
  }, [roundDate]);

  const totalAmount = reports.reduce((sum, report) => sum + (report.totalAmount || 0), 0);
  const totalWon = reports.reduce((sum, report) => sum + (report.totalWon || 0), 0);
  const totalBets = reports.reduce((sum, report) => sum + (report.betCount || 0), 0);

  const overviewCards = useMemo(() => ([
    { label: 'รายการแทง', value: money(totalBets), hint: 'รวมทุกรายการภายใต้ตัวกรองปัจจุบัน' },
    { label: 'ยอดขายรวม', value: `${money(totalAmount)} บาท`, hint: 'ยอดรับจากเจ้ามือทั้งหมด' },
    { label: 'ผลสุทธิ', value: `${money(totalAmount - totalWon)} บาท`, hint: 'ยอดขายรวมหลังหักยอดจ่าย' }
  ]), [totalAmount, totalWon, totalBets]);

  if (loading) {
    return <PageSkeleton statCount={3} rows={6} sidebar={false} />;
  }

  return (
    <div className="ops-page animate-fade-in">
      <section className="ops-hero">
        <div className="ops-hero-copy">
          <span className="ui-eyebrow">ภาพรวมรายงาน</span>
          <h1 className="page-title">รายงานแอดมิน</h1>
          <p className="page-subtitle">ดูยอดขาย ยอดจ่าย และผลสุทธิแยกตามงวดและเจ้ามือจากหน้ารายงานเดียว</p>
        </div>

        <div className="ops-hero-side">
          <span>ผลสุทธิช่วงนี้</span>
          <strong>{money(totalAmount - totalWon)} บาท</strong>
          <small>{reports.length} แถวรายงานที่จัดกลุ่มแล้ว</small>
        </div>
      </section>

      <section className="ops-overview-grid compact">
        {overviewCards.map((card) => (
          <article key={card.label} className="ops-overview-card">
            <span>{card.label}</span>
            <strong>{card.value}</strong>
            <small>{card.hint}</small>
          </article>
        ))}
      </section>

      <section className="card ops-section">
        <div className="ui-panel-head">
          <div>
            <div className="ui-eyebrow">ตัวกรอง</div>
            <h3 className="card-title">เลือกงวด</h3>
          </div>
        </div>

        <div className="ops-form-grid single">
          <label className="form-group" style={{ marginBottom: 0 }}>
            <span className="form-label">วันที่งวด</span>
            <input
              type="text"
              className="form-input"
              placeholder="2026-03-16"
              value={roundDate}
              onChange={(event) => setRoundDate(event.target.value)}
            />
          </label>
        </div>
      </section>

      <section className="card ops-section">
        <div className="ops-table-head">
          <div>
            <div className="ui-eyebrow">ตารางรายงาน</div>
            <h3 className="card-title"><FiFileText style={{ marginRight: 8 }} />สรุปตามเจ้ามือและงวด</h3>
            <p className="ops-table-note">แต่ละแถวคือข้อมูลสรุปที่จัดกลุ่มตามตลาด งวด และเจ้ามือ</p>
          </div>
        </div>

        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>งวด</th>
                <th>ตลาด</th>
                <th>เจ้ามือ</th>
                <th>จำนวนรายการ</th>
                <th>ยอดขาย</th>
                <th>ยอดจ่าย</th>
                <th>ผลสุทธิ</th>
                <th>ถูก / ไม่ถูก / รอผล</th>
              </tr>
            </thead>
            <tbody>
              {reports.length === 0 ? (
                <tr>
                  <td colSpan="8" className="text-center text-muted" style={{ padding: 40 }}>ยังไม่มีข้อมูลรายงาน</td>
                </tr>
              ) : (
                reports.map((report, index) => (
                  <tr key={`${report.roundDate}-${report.agentName || index}`}>
                    <td>{report.roundDate}</td>
                    <td>{report.marketName || 'ตลาดหวย'}</td>
                    <td>{report.agentName || '-'}</td>
                    <td>{report.betCount}</td>
                    <td>{money(report.totalAmount)} บาท</td>
                    <td>{money(report.totalWon)} บาท</td>
                    <td style={{ fontWeight: 700, color: (report.netProfit || 0) >= 0 ? 'var(--success)' : 'var(--danger)' }}>
                      {money(report.netProfit)} บาท
                    </td>
                    <td>
                      <span className="badge badge-success" style={{ marginRight: 4 }}>{report.wonCount}</span>
                      <span className="badge badge-danger" style={{ marginRight: 4 }}>{report.lostCount}</span>
                      <span className="badge badge-warning">{report.pendingCount}</span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};

export default AdminReports;
