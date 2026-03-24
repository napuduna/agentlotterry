import { useEffect, useMemo, useState } from 'react';
import { getMarketOverview, placeBets } from '../../services/api';
import toast from 'react-hot-toast';
import { FiCheckCircle, FiClock, FiPlus, FiRefreshCw, FiSend, FiTrash2 } from 'react-icons/fi';

const betTypes = [
  { value: '3top', label: '3 ตัวบน', digits: 3, rate: 500 },
  { value: '3tod', label: '3 ตัวโต๊ด', digits: 3, rate: 100 },
  { value: '2top', label: '2 ตัวบน', digits: 2, rate: 70 },
  { value: '2bottom', label: '2 ตัวล่าง', digits: 2, rate: 70 },
  { value: 'run_top', label: 'วิ่งบน', digits: 1, rate: 3 },
  { value: 'run_bottom', label: 'วิ่งล่าง', digits: 1, rate: 2 }
];

const disabledStatuses = new Set(['unsupported']);

const CustomerBet = () => {
  const [overview, setOverview] = useState(null);
  const [selectedMarketId, setSelectedMarketId] = useState('thai-government');
  const [bets, setBets] = useState([{ betType: '3top', number: '', amount: '' }]);
  const [loadingMarkets, setLoadingMarkets] = useState(true);
  const [reloadingMarkets, setReloadingMarkets] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const loadMarkets = async (showReload = false) => {
    if (showReload) {
      setReloadingMarkets(true);
    } else {
      setLoadingMarkets(true);
    }

    try {
      const res = await getMarketOverview();
      setOverview(res.data);
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || 'โหลดตลาดไม่สำเร็จ');
    } finally {
      setLoadingMarkets(false);
      setReloadingMarkets(false);
    }
  };

  useEffect(() => {
    loadMarkets();
  }, []);

  const marketSections = useMemo(() => {
    if (!overview?.sections) return [];

    return overview.sections
      .map((section) => ({
        ...section,
        markets: section.markets.filter((market) => {
          if (disabledStatuses.has(market.status)) return false;
          if (market.provider === 'internal') return true;
          if (market.provider !== 'apilotto') return true;
          return overview.provider?.configured;
        })
      }))
      .filter((section) => section.markets.length > 0);
  }, [overview]);

  const allMarkets = useMemo(
    () => marketSections.flatMap((section) => section.markets.map((market) => ({ ...market, sectionId: section.id, sectionTitle: section.title }))),
    [marketSections]
  );

  useEffect(() => {
    if (!allMarkets.length) return;

    if (!allMarkets.some((market) => market.id === selectedMarketId)) {
      setSelectedMarketId(allMarkets[0].id);
    }
  }, [allMarkets, selectedMarketId]);

  const selectedMarket = allMarkets.find((market) => market.id === selectedMarketId) || null;

  const addBet = () => {
    setBets([...bets, { betType: '3top', number: '', amount: '' }]);
  };

  const removeBet = (index) => {
    if (bets.length <= 1) return;
    setBets(bets.filter((_, i) => i !== index));
  };

  const updateBet = (index, field, value) => {
    const updated = [...bets];
    updated[index] = { ...updated[index], [field]: value };
    setBets(updated);
  };

  const getDigits = (betType) => betTypes.find((bet) => bet.value === betType)?.digits || 3;
  const getRate = (betType) => betTypes.find((bet) => bet.value === betType)?.rate || 0;
  const totalAmount = bets.reduce((sum, bet) => sum + (Number(bet.amount) || 0), 0);

  const handleSubmit = async () => {
    if (!selectedMarket) {
      return toast.error('กรุณาเลือกตลาดก่อนส่งโพย');
    }

    const validBets = bets.filter((bet) => bet.number && bet.amount);
    if (validBets.length === 0) {
      return toast.error('กรุณากรอกข้อมูลอย่างน้อย 1 รายการ');
    }

    for (const bet of validBets) {
      const digits = getDigits(bet.betType);
      if (bet.number.length !== digits) {
        return toast.error(`${betTypes.find((item) => item.value === bet.betType)?.label} ต้องกรอก ${digits} หลัก`);
      }
      if (!/^\d+$/.test(bet.number)) {
        return toast.error('เลขที่แทงต้องเป็นตัวเลขเท่านั้น');
      }
      if (Number(bet.amount) < 1) {
        return toast.error('จำนวนเงินต้องอย่างน้อย 1 บาท');
      }
    }

    setSubmitting(true);
    try {
      const res = await placeBets({
        marketId: selectedMarket.id,
        bets: validBets.map((bet) => ({
          betType: bet.betType,
          number: bet.number,
          amount: Number(bet.amount)
        }))
      });

      toast.success(`ส่งโพย ${res.data.market?.name || selectedMarket.name} สำเร็จ`);
      setBets([{ betType: '3top', number: '', amount: '' }]);
    } catch (err) {
      toast.error(err.response?.data?.message || 'แทงไม่สำเร็จ');
    } finally {
      setSubmitting(false);
    }
  };

  if (loadingMarkets) {
    return <div className="loading-container"><div className="spinner"></div></div>;
  }

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">🎯 แทงหวยและหุ้น</h1>
          <p className="page-subtitle">เลือกตลาดที่ต้องการก่อน จากนั้นกรอกเลขและจำนวนเงินในโพยเดียวกัน</p>
        </div>
        <button className="btn btn-secondary" onClick={() => loadMarkets(true)} disabled={reloadingMarkets}>
          {reloadingMarkets ? <div className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }}></div> : <FiRefreshCw />}
          รีเฟรชตลาด
        </button>
      </div>

      {selectedMarket ? (
        <div className="card mb-lg">
          <div className="card-header">
            <div>
              <h3 className="card-title">ตลาดที่เลือก: {selectedMarket.name}</h3>
              <div className="page-subtitle">{selectedMarket.sectionTitle} • งวด/รอบอ้างอิง: {selectedMarket.resultDate || 'รอ provider ระบุรอบล่าสุด'}</div>
            </div>
            <span className={`badge ${selectedMarket.status === 'live' ? 'badge-success' : 'badge-warning'}`}>
              {selectedMarket.status === 'live' ? <FiCheckCircle /> : <FiClock />}
              <span>{selectedMarket.status === 'live' ? 'ข้อมูลพร้อม' : 'รอผล/รอรอบเปิด'}</span>
            </span>
          </div>
          <div className="market-chip-list" style={{ marginTop: 0 }}>
            {selectedMarket.numbers?.length ? selectedMarket.numbers.map((item) => (
              <div className="market-chip" key={`${selectedMarket.id}-${item.label}`}>
                <span className="market-chip-label">{item.label}</span>
                <strong>{item.value}</strong>
              </div>
            )) : (
              <div className="market-chip market-chip-empty">
                <span className="market-chip-label">สถานะตลาด</span>
                <strong>{selectedMarket.note || 'ยังไม่มีข้อมูลสรุปล่าสุด'}</strong>
              </div>
            )}
          </div>
        </div>
      ) : null}

      <div className="card mb-lg">
        <div className="card-header">
          <div>
            <h3 className="card-title">เลือกตลาดที่ต้องการแทง</h3>
            <div className="page-subtitle">เลือกได้ครั้งละ 1 ตลาดต่อการส่งโพย 1 ชุด</div>
          </div>
        </div>

        {marketSections.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">🎰</div>
            <div className="empty-state-text">ยังไม่มีตลาดที่พร้อมให้แทงในตอนนี้</div>
          </div>
        ) : (
          <div className="market-section-stack">
            {marketSections.map((section) => (
              <div key={section.id}>
                <div className="market-section-heading">{section.title}</div>
                <div className="market-grid">
                  {section.markets.map((market) => {
                    const isActive = selectedMarketId === market.id;

                    return (
                      <button
                        key={market.id}
                        type="button"
                        className={`market-card market-card-${market.status} market-card-button ${isActive ? 'market-card-active' : ''}`}
                        onClick={() => setSelectedMarketId(market.id)}
                      >
                        <div className="market-card-header">
                          <div>
                            <div className="market-card-title">{market.name}</div>
                            <div className="market-card-date">{market.resultDate || 'ยังไม่มีวันอ้างอิงล่าสุด'}</div>
                          </div>
                          {isActive ? <span className="badge badge-success"><FiCheckCircle /><span>เลือกแล้ว</span></span> : null}
                        </div>

                        <div className="market-card-headline">{market.headline || '--'}</div>
                        <div className="market-card-note">{market.note || 'พร้อมสำหรับสร้างโพย'}</div>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="card mb-lg">
        <div style={{ marginBottom: 16 }}>
          <div className="bet-row-header">
            <span className="form-label" style={{ marginBottom: 0 }}>ประเภท</span>
            <span className="form-label" style={{ marginBottom: 0 }}>เลข</span>
            <span className="form-label" style={{ marginBottom: 0 }}>จำนวน (฿)</span>
            <span className="form-label" style={{ marginBottom: 0 }}>อัตราจ่าย</span>
            <span></span>
          </div>

          {bets.map((bet, index) => (
            <div key={index} className="bet-row-card">
              <select
                className="form-select"
                value={bet.betType}
                onChange={(e) => {
                  updateBet(index, 'betType', e.target.value);
                  updateBet(index, 'number', '');
                }}
              >
                {betTypes.map((type) => <option key={type.value} value={type.value}>{type.label}</option>)}
              </select>

              <input
                className="form-input"
                type="text"
                placeholder={`${getDigits(bet.betType)} หลัก`}
                value={bet.number}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, '').slice(0, getDigits(bet.betType));
                  updateBet(index, 'number', value);
                }}
                maxLength={getDigits(bet.betType)}
                style={{ fontWeight: 700, fontSize: '1.1rem', textAlign: 'center', letterSpacing: '0.15em' }}
              />

              <input
                className="form-input"
                type="number"
                placeholder="จำนวน"
                value={bet.amount}
                onChange={(e) => updateBet(index, 'amount', e.target.value)}
                min="1"
              />

              <div className="bet-rate-pill">x{getRate(bet.betType)}</div>

              <button
                className="btn btn-danger btn-sm"
                onClick={() => removeBet(index)}
                disabled={bets.length <= 1}
                style={{ width: 36, padding: 6 }}
              >
                <FiTrash2 />
              </button>
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between" style={{ flexWrap: 'wrap', gap: 12 }}>
          <button className="btn btn-secondary" onClick={addBet}><FiPlus /> เพิ่มรายการ</button>
          <div style={{ display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap' }}>
            <div style={{ fontSize: '1.1rem', fontWeight: 700 }}>
              รวม: <span style={{ color: 'var(--primary-light)' }}>{totalAmount.toLocaleString()} ฿</span>
            </div>
            <button
              className="btn btn-primary btn-lg"
              onClick={handleSubmit}
              disabled={submitting || !selectedMarket}
            >
              {submitting ? <div className="spinner" style={{ width: 20, height: 20, borderWidth: 2 }}></div> : <><FiSend /> ส่งโพย</>}
            </button>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <h3 className="card-title">📌 อัตราจ่าย</h3>
        </div>
        <div className="grid grid-3">
          {betTypes.map((type) => (
            <div key={type.value} style={{ padding: 16, background: 'var(--bg-surface)', borderRadius: 'var(--radius-sm)', textAlign: 'center' }}>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: 4 }}>{type.label}</div>
              <div style={{ fontSize: '1.3rem', fontWeight: 700, color: 'var(--primary-light)' }}>x{type.rate}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{type.digits} หลัก</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CustomerBet;
