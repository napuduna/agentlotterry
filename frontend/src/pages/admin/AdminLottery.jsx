import { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { FiActivity, FiAward, FiClock, FiDownload, FiEdit3, FiRefreshCw } from 'react-icons/fi';
import Modal from '../../components/Modal';
import PageSkeleton from '../../components/PageSkeleton';
import { fetchLottery, getLatestLottery, getLotteryResults, manualLottery } from '../../services/api';

const resultStatusBadge = (result) => {
  if (result?.isCalculated) return 'badge-success';
  return result?.firstPrize ? 'badge-warning' : 'badge-info';
};

const resultStatusLabel = (result) => {
  if (result?.isCalculated) return 'สรุปโพยแล้ว';
  if (result?.firstPrize) return 'บันทึกผลแล้ว';
  return 'รอผล';
};

const AdminLottery = () => {
  const [latest, setLatest] = useState(null);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fetchDate, setFetchDate] = useState('');
  const [showManual, setShowManual] = useState(false);
  const [manualForm, setManualForm] = useState({
    roundDate: '',
    firstPrize: '',
    twoBottom: '',
    threeTopList: '',
    threeBotList: '',
    runTop: '',
    runBottom: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [latestRes, resultsRes] = await Promise.all([getLatestLottery(), getLotteryResults()]);
      setLatest(latestRes.data);
      setResults(resultsRes.data || []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const overviewCards = useMemo(() => {
    const latestRound = latest?.roundDate || 'No round';
    const latestFirstPrize = latest?.firstPrize || '-';
    const latestTop = latest?.firstPrize?.slice(-3) || '-';
    const latestBottom = latest?.twoBottom || '-';

    return [
      {
        label: 'งวดล่าสุด',
        value: latestRound,
        hint: latest?.isCalculated ? 'สรุปโพยครบแล้ว' : 'รอระบบสรุปโพย'
      },
      {
        label: 'รางวัลที่ 1',
        value: latestFirstPrize,
        hint: 'เลขรางวัลหลักของงวด'
      },
      {
        label: '3 ตัวบน',
        value: latestTop,
        hint: 'ตัดจากรางวัลที่ 1'
      },
      {
        label: '2 ตัวล่าง',
        value: latestBottom,
        hint: `บันทึกผลแล้ว ${results.length} งวด`
      }
    ];
  }, [latest, results.length]);

  const handleFetch = async () => {
    if (!fetchDate) {
      toast.error('กรุณาเลือกวันที่งวดก่อน');
      return;
    }

    const toastId = toast.loading('กำลังดึงผลจาก API ภายนอก...');

    try {
      const res = await fetchLottery({ roundDate: fetchDate });
      const settlement = res.data?.settlement;
      if (settlement) {
        toast.success(`ดึงผลและสรุปโพยแล้ว ถูก ${settlement.wonCount} รายการ ไม่ถูก ${settlement.lostCount} รายการ`, { id: toastId });
      } else {
        toast.success('ดึงผลสำเร็จ', { id: toastId });
      }
      await loadData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'ดึงผลไม่สำเร็จ', { id: toastId });
    }
  };

  const handleQuickSync = async () => {
    const targetDate = fetchDate || latest?.roundDate;
    if (!targetDate) {
      toast.error('ยังไม่มีงวดให้ดึงผลในตอนนี้');
      return;
    }

    setFetchDate(targetDate);
    const toastId = toast.loading(`กำลังดึงผลของงวด ${targetDate}...`);

    try {
      const res = await fetchLottery({ roundDate: targetDate });
      const settlement = res.data?.settlement;
      if (settlement) {
        toast.success(`งวด ${targetDate} ถูกดึงผลและสรุปโพยแล้ว`, { id: toastId });
      } else {
        toast.success(`ดึงผลของงวด ${targetDate} สำเร็จ`, { id: toastId });
      }
      await loadData();
    } catch (error) {
      toast.error(error.response?.data?.message || `ดึงผลของงวด ${targetDate} ไม่สำเร็จ`, { id: toastId });
    }
  };

  const handleManualSave = async (event) => {
    event.preventDefault();

    const toastId = toast.loading('กำลังบันทึกผลแบบ manual...');

    try {
      const payload = {
        ...manualForm,
        threeTopList: manualForm.threeTopList ? manualForm.threeTopList.split(',').map((item) => item.trim()).filter(Boolean) : [],
        threeBotList: manualForm.threeBotList ? manualForm.threeBotList.split(',').map((item) => item.trim()).filter(Boolean) : [],
        runTop: manualForm.runTop ? manualForm.runTop.split(',').map((item) => item.trim()).filter(Boolean) : [],
        runBottom: manualForm.runBottom ? manualForm.runBottom.split(',').map((item) => item.trim()).filter(Boolean) : []
      };

      const res = await manualLottery(payload);
      const settlement = res.data?.settlement;
      if (settlement) {
        toast.success(`บันทึกผลแล้ว ถูก ${settlement.wonCount} รายการ ไม่ถูก ${settlement.lostCount} รายการ`, { id: toastId });
      } else {
        toast.success('บันทึกผลสำเร็จ', { id: toastId });
      }

      setShowManual(false);
      setManualForm({
        roundDate: '',
        firstPrize: '',
        twoBottom: '',
        threeTopList: '',
        threeBotList: '',
        runTop: '',
        runBottom: ''
      });
      await loadData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'บันทึกผลไม่สำเร็จ', { id: toastId });
    }
  };

  if (loading) {
    return <PageSkeleton statCount={4} rows={5} sidebar={false} />;
  }

  return (
    <div className="ops-page animate-fade-in">
      <section className="ops-hero">
        <div className="ops-hero-copy">
          <span className="ui-eyebrow">ศูนย์จัดการผลหวย</span>
          <h1 className="page-title">ผลหวย</h1>
          <p className="page-subtitle">ดึงผลจาก API ภายนอก เก็บประวัติผลย้อนหลัง และใช้การกรอกมือเฉพาะตอนที่ feed ภายนอกยังไม่พร้อม</p>
        </div>

        <div className="ops-hero-side">
          <span>สถานะผลล่าสุด</span>
          <strong>{latest?.roundDate || 'ยังไม่มีงวด'}</strong>
          <small>{latest?.firstPrize ? `รางวัลที่ 1 ${latest.firstPrize}` : 'ยังไม่มีผลถูกบันทึก'}</small>
        </div>
      </section>

      <section className="ops-overview-grid">
        {overviewCards.map((card) => (
          <article key={card.label} className="ops-overview-card">
            <span>{card.label}</span>
            <strong>{card.value}</strong>
            <small>{card.hint}</small>
          </article>
        ))}
      </section>

      <section className="ops-grid">
        <section className="card ops-section">
          <div className="ui-panel-head">
            <div>
              <div className="ui-eyebrow">API ภายนอก</div>
              <h3 className="card-title">ดึงผลตามงวด</h3>
            </div>
            <span className="ui-pill">เปิด sync อัตโนมัติ</span>
          </div>

          <div className="ops-stack">
            <label className="form-label" htmlFor="lottery-round-date">วันที่งวด</label>
            <input
              id="lottery-round-date"
              type="date"
              className="form-input"
              value={fetchDate}
              onChange={(event) => setFetchDate(event.target.value)}
            />

            <div className="ops-actions">
              <button className="btn btn-primary" onClick={handleFetch}>
                <FiDownload />
                ดึงผลตามวันที่เลือก
              </button>
              <button className="btn btn-secondary" onClick={handleQuickSync}>
                <FiRefreshCw />
                ดึงผลล่าสุด
              </button>
            </div>

            <p className="ops-table-note">ใช้ช่องนี้เมื่อต้องการดึงผลย้อนหลังหรือดึงผลของงวดใดงวดหนึ่งใหม่จาก feed ภายนอก</p>
          </div>
        </section>

        <section className="card ops-section">
          <div className="ui-panel-head">
            <div>
              <div className="ui-eyebrow">ช่องทางสำรอง</div>
              <h3 className="card-title">กรอกผลด้วยมือ</h3>
            </div>
            <span className={`badge ${resultStatusBadge(latest)}`}>{resultStatusLabel(latest)}</span>
          </div>

          <div className="ops-stack">
            <div className="ops-feed-row">
              <div>
                <strong>รางวัลที่ 1 ล่าสุด</strong>
                <div className="ops-feed-meta">{latest?.firstPrize || 'ยังไม่มีรางวัลที่ 1 ถูกบันทึก'}</div>
              </div>
              <div className="ops-feed-right">
                <strong>{latest?.twoBottom || '-'}</strong>
                <span className="ops-feed-meta">2 ตัวล่าง</span>
              </div>
            </div>

            <p className="ops-table-note">การกรอกมือใช้เป็นทางสำรองเท่านั้น และยังใช้ flow สรุปโพยเดียวกับการดึงผลอัตโนมัติ</p>
            <button className="btn btn-secondary" onClick={() => setShowManual(true)}>
              <FiEdit3 />
              เปิดฟอร์มกรอกผล
            </button>
          </div>
        </section>
      </section>

      <section className="card ops-section">
        <div className="ops-table-head">
          <div>
            <div className="ui-eyebrow">ประวัติผล</div>
            <h3 className="card-title">รายการผลที่บันทึกแล้ว</h3>
            <p className="ops-table-note">ตรวจดูงวดที่เคยบันทึกไว้ และเช็กว่าแต่ละงวดถูกสรุปโพยกับระบบแล้วหรือยัง</p>
          </div>
          <div className="ops-actions">
            <span className="ui-pill"><FiActivity /> {results.length} งวด</span>
            <span className={`badge ${resultStatusBadge(latest)}`}>{resultStatusLabel(latest)}</span>
          </div>
        </div>

        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>งวด</th>
                <th>รางวัลที่ 1</th>
                <th>3 ตัวบน</th>
                <th>2 ตัวล่าง</th>
                <th>สถานะ</th>
              </tr>
            </thead>
            <tbody>
              {results.length === 0 ? (
                <tr>
                  <td colSpan="5" className="text-center text-muted" style={{ padding: 40 }}>ยังไม่มีผลถูกบันทึกในระบบ</td>
                </tr>
              ) : (
                results.map((result) => (
                  <tr key={result._id}>
                    <td style={{ fontWeight: 700 }}>{result.roundDate}</td>
                    <td>{result.firstPrize || '-'}</td>
                    <td>{result.firstPrize?.slice(-3) || '-'}</td>
                    <td>{result.twoBottom || '-'}</td>
                    <td>
                      <span className={`badge ${resultStatusBadge(result)}`}>
                        {resultStatusLabel(result)}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      <Modal isOpen={showManual} onClose={() => setShowManual(false)} title="กรอกผลแบบ manual" size="lg">
        <form onSubmit={handleManualSave}>
          <div className="ops-form-grid">
            <div className="form-group">
              <label className="form-label">วันที่งวด *</label>
              <input
                type="date"
                className="form-input"
                value={manualForm.roundDate}
                onChange={(event) => setManualForm({ ...manualForm, roundDate: event.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">รางวัลที่ 1 *</label>
              <input
                className="form-input"
                value={manualForm.firstPrize}
                onChange={(event) => setManualForm({ ...manualForm, firstPrize: event.target.value })}
                maxLength={6}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">2 ตัวล่าง</label>
              <input
                className="form-input"
                value={manualForm.twoBottom}
                onChange={(event) => setManualForm({ ...manualForm, twoBottom: event.target.value })}
                maxLength={2}
              />
            </div>

            <div className="form-group">
              <label className="form-label">รายการ 3 ตัวบน</label>
              <input
                className="form-input"
                placeholder="123, 456"
                value={manualForm.threeTopList}
                onChange={(event) => setManualForm({ ...manualForm, threeTopList: event.target.value })}
              />
            </div>

            <div className="form-group">
              <label className="form-label">รายการ 3 ตัวล่าง</label>
              <input
                className="form-input"
                placeholder="321, 654"
                value={manualForm.threeBotList}
                onChange={(event) => setManualForm({ ...manualForm, threeBotList: event.target.value })}
              />
            </div>

            <div className="form-group">
              <label className="form-label">วิ่งบน</label>
              <input
                className="form-input"
                placeholder="1, 2, 3"
                value={manualForm.runTop}
                onChange={(event) => setManualForm({ ...manualForm, runTop: event.target.value })}
              />
            </div>

            <div className="form-group">
              <label className="form-label">วิ่งล่าง</label>
              <input
                className="form-input"
                placeholder="4, 5, 6"
                value={manualForm.runBottom}
                onChange={(event) => setManualForm({ ...manualForm, runBottom: event.target.value })}
              />
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={() => setShowManual(false)}>ยกเลิก</button>
            <button type="submit" className="btn btn-primary">
              <FiAward />
              บันทึกผล
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default AdminLottery;
