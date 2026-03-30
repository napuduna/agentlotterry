import { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { FiActivity, FiAward, FiClock, FiDownload, FiEdit3, FiRefreshCw } from 'react-icons/fi';
import Modal from '../../components/Modal';
import PageSkeleton from '../../components/PageSkeleton';
import { adminCopy } from '../../i18n/th/admin';
import { fetchLottery, getLatestLottery, getLotteryResults, manualLottery } from '../../services/api';

const copy = adminCopy.lottery;

const resultStatusBadge = (result) => {
  if (result?.isCalculated) return 'badge-success';
  return result?.firstPrize ? 'badge-warning' : 'badge-info';
};

const resultStatusLabel = (result) => {
  if (result?.isCalculated) return copy.settled;
  if (result?.firstPrize) return copy.resultSaved;
  return copy.waitingResult;
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
    const latestRound = latest?.roundDate || copy.noRound;
    const latestFirstPrize = latest?.firstPrize || '-';
    const latestTop = latest?.firstPrize?.slice(-3) || '-';
    const latestBottom = latest?.twoBottom || '-';

    return [
      {
        label: copy.overviewCards.latestRound.label,
        value: latestRound,
        hint: latest?.isCalculated ? copy.overviewCards.latestRound.settled : copy.overviewCards.latestRound.pending
      },
      {
        label: copy.overviewCards.firstPrize.label,
        value: latestFirstPrize,
        hint: copy.overviewCards.firstPrize.hint
      },
      {
        label: copy.overviewCards.top3.label,
        value: latestTop,
        hint: copy.overviewCards.top3.hint
      },
      {
        label: copy.overviewCards.bottom2.label,
        value: latestBottom,
        hint: copy.overviewCards.bottom2.hint(results.length)
      }
    ];
  }, [latest, results.length]);

  const handleFetch = async () => {
    if (!fetchDate) {
      toast.error(copy.fetchErrorNoDate);
      return;
    }

    const toastId = toast.loading(copy.fetchingExternal);

    try {
      const res = await fetchLottery({ roundDate: fetchDate });
      const settlement = res.data?.settlement;
      if (settlement) {
        toast.success(copy.fetchAndSettleSuccess(settlement.wonCount, settlement.lostCount), { id: toastId });
      } else {
        toast.success(copy.fetchSuccess, { id: toastId });
      }
      await loadData();
    } catch (error) {
      toast.error(error.response?.data?.message || copy.fetchError, { id: toastId });
    }
  };

  const handleQuickSync = async () => {
    const targetDate = fetchDate || latest?.roundDate;
    if (!targetDate) {
      toast.error(copy.noRoundToSync);
      return;
    }

    setFetchDate(targetDate);
    const toastId = toast.loading(copy.quickSyncLoading(targetDate));

    try {
      const res = await fetchLottery({ roundDate: targetDate });
      const settlement = res.data?.settlement;
      if (settlement) {
        toast.success(copy.quickSyncSettled(targetDate), { id: toastId });
      } else {
        toast.success(copy.quickSyncSuccess(targetDate), { id: toastId });
      }
      await loadData();
    } catch (error) {
      toast.error(error.response?.data?.message || copy.quickSyncError(targetDate), { id: toastId });
    }
  };

  const handleManualSave = async (event) => {
    event.preventDefault();

    const toastId = toast.loading(copy.manualLoading);

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
        toast.success(copy.manualSettled(settlement.wonCount, settlement.lostCount), { id: toastId });
      } else {
        toast.success(copy.manualSuccess, { id: toastId });
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
      toast.error(error.response?.data?.message || copy.manualError, { id: toastId });
    }
  };

  if (loading) {
    return <PageSkeleton statCount={4} rows={5} sidebar={false} />;
  }

  return (
    <div className="ops-page animate-fade-in">
      <section className="ops-hero">
        <div className="ops-hero-copy">
          <span className="ui-eyebrow">{copy.heroEyebrow}</span>
          <h1 className="page-title">{copy.heroTitle}</h1>
          <p className="page-subtitle">{copy.heroSubtitle}</p>
        </div>

        <div className="ops-hero-side">
          <span>{copy.latestStatus}</span>
          <strong>{latest?.roundDate || copy.noRound}</strong>
          <small>{latest?.firstPrize ? `${copy.firstPrize} ${latest.firstPrize}` : copy.noSavedResult}</small>
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
              <div className="ui-eyebrow">{copy.externalEyebrow}</div>
              <h3 className="card-title">{copy.externalTitle}</h3>
            </div>
            <span className="ui-pill">{copy.autoSyncEnabled}</span>
          </div>

          <div className="ops-stack">
            <label className="form-label" htmlFor="lottery-round-date">{copy.roundDate}</label>
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
                {copy.fetchByDate}
              </button>
              <button className="btn btn-secondary" onClick={handleQuickSync}>
                <FiRefreshCw />
                {copy.fetchLatest}
              </button>
            </div>

            <p className="ops-table-note">{copy.externalHint}</p>
          </div>
        </section>

        <section className="card ops-section">
          <div className="ui-panel-head">
            <div>
              <div className="ui-eyebrow">{copy.fallbackEyebrow}</div>
              <h3 className="card-title">{copy.fallbackTitle}</h3>
            </div>
            <span className={`badge ${resultStatusBadge(latest)}`}>{resultStatusLabel(latest)}</span>
          </div>

          <div className="ops-stack">
            <div className="ops-feed-row">
              <div>
                <strong>{copy.latestFirstPrize}</strong>
                <div className="ops-feed-meta">{latest?.firstPrize || copy.noFirstPrize}</div>
              </div>
              <div className="ops-feed-right">
                <strong>{latest?.twoBottom || '-'}</strong>
                <span className="ops-feed-meta">{copy.bottom2Short}</span>
              </div>
            </div>

            <p className="ops-table-note">{copy.fallbackHint}</p>
            <button className="btn btn-secondary" onClick={() => setShowManual(true)}>
              <FiEdit3 />
              {copy.openManualForm}
            </button>
          </div>
        </section>
      </section>

      <section className="card ops-section">
        <div className="ops-table-head">
          <div>
            <div className="ui-eyebrow">{copy.historyEyebrow}</div>
            <h3 className="card-title">{copy.historyTitle}</h3>
            <p className="ops-table-note">{copy.historyNote}</p>
          </div>
          <div className="ops-actions">
            <span className="ui-pill"><FiActivity /> {copy.roundsCount(results.length)}</span>
            <span className={`badge ${resultStatusBadge(latest)}`}>{resultStatusLabel(latest)}</span>
          </div>
        </div>

        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>{copy.roundDate}</th>
                <th>{copy.firstPrize}</th>
                <th>{copy.overviewCards.top3.label}</th>
                <th>{copy.bottom2Short}</th>
                <th>สถานะ</th>
              </tr>
            </thead>
            <tbody>
              {results.length === 0 ? (
                <tr>
                  <td colSpan="5" className="text-center text-muted" style={{ padding: 40 }}>{copy.noResults}</td>
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

      <Modal isOpen={showManual} onClose={() => setShowManual(false)} title={copy.manualTitle} size="lg">
        <form onSubmit={handleManualSave}>
          <div className="ops-form-grid">
            <div className="form-group">
              <label className="form-label">{copy.roundDate} *</label>
              <input
                type="date"
                className="form-input"
                value={manualForm.roundDate}
                onChange={(event) => setManualForm({ ...manualForm, roundDate: event.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">{copy.firstPrize} *</label>
              <input
                className="form-input"
                value={manualForm.firstPrize}
                onChange={(event) => setManualForm({ ...manualForm, firstPrize: event.target.value })}
                maxLength={6}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">{copy.bottom2Short}</label>
              <input
                className="form-input"
                value={manualForm.twoBottom}
                onChange={(event) => setManualForm({ ...manualForm, twoBottom: event.target.value })}
                maxLength={2}
              />
            </div>

            <div className="form-group">
              <label className="form-label">{copy.threeTopList}</label>
              <input
                className="form-input"
                placeholder="123, 456"
                value={manualForm.threeTopList}
                onChange={(event) => setManualForm({ ...manualForm, threeTopList: event.target.value })}
              />
            </div>

            <div className="form-group">
              <label className="form-label">{copy.threeBottomList}</label>
              <input
                className="form-input"
                placeholder="321, 654"
                value={manualForm.threeBotList}
                onChange={(event) => setManualForm({ ...manualForm, threeBotList: event.target.value })}
              />
            </div>

            <div className="form-group">
              <label className="form-label">{copy.runTop}</label>
              <input
                className="form-input"
                placeholder="1, 2, 3"
                value={manualForm.runTop}
                onChange={(event) => setManualForm({ ...manualForm, runTop: event.target.value })}
              />
            </div>

            <div className="form-group">
              <label className="form-label">{copy.runBottom}</label>
              <input
                className="form-input"
                placeholder="4, 5, 6"
                value={manualForm.runBottom}
                onChange={(event) => setManualForm({ ...manualForm, runBottom: event.target.value })}
              />
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={() => setShowManual(false)}>{adminCopy.common.cancel}</button>
            <button type="submit" className="btn btn-primary">
              <FiAward />
              {copy.saveResult}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default AdminLottery;
