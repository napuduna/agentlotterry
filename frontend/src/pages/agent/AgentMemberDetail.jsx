import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { FiArrowLeft, FiHash, FiPhone, FiRefreshCw, FiRepeat, FiSave, FiWifi } from 'react-icons/fi';
import PageSkeleton, { SectionSkeleton } from '../../components/PageSkeleton';
import { useAuth } from '../../context/AuthContext';
import { getAgentMemberBootstrap, getAgentMemberDetail, getWalletHistory, getWalletSummary, transferWalletCredit, updateAgentMemberProfile } from '../../services/api';
import { createMemberFormFromDetail, groupLotterySettingsByLeague, toggleBetType, updateLotterySetting } from './memberFormUtils';

const tabs = ['General', 'Lotteries', 'Wallet'];
const statusOptions = ['active', 'inactive', 'suspended'];
const betTypeLabels = { '3top': '3 Top', '3tod': '3 Tod', '2top': '2 Top', '2bottom': '2 Bottom', 'run_top': 'Run Top', 'run_bottom': 'Run Bottom' };
const toNumber = (value) => Number(value || 0);
const money = (value) => toNumber(value).toLocaleString('th-TH');
const formatDateTime = (value) => {
  if (!value) return 'No recent activity';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'No recent activity';
  return date.toLocaleString('th-TH', { dateStyle: 'medium', timeStyle: 'short' });
};

const AgentMemberDetail = () => {
  const navigate = useNavigate();
  const { memberId } = useParams();
  const { checkAuth } = useAuth();
  const [bootstrap, setBootstrap] = useState(null);
  const [detail, setDetail] = useState(null);
  const [form, setForm] = useState(null);
  const [tab, setTab] = useState('General');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [walletLoading, setWalletLoading] = useState(true);
  const [walletSubmitting, setWalletSubmitting] = useState(false);
  const [agentWallet, setAgentWallet] = useState(null);
  const [memberWallet, setMemberWallet] = useState(null);
  const [walletEntries, setWalletEntries] = useState([]);
  const [transferForm, setTransferForm] = useState({ direction: 'to_member', amount: '', note: '' });

  const load = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const [bootstrapRes, detailRes] = await Promise.all([getAgentMemberBootstrap(), getAgentMemberDetail(memberId)]);
      setBootstrap(bootstrapRes.data);
      setDetail(detailRes.data);
      setForm(createMemberFormFromDetail(detailRes.data, bootstrapRes.data));
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message || 'Failed to load member');
      navigate('/agent/customers');
    } finally {
      if (!silent) setLoading(false);
    }
  };

  const loadWalletData = async (silent = false) => {
    if (!silent) setWalletLoading(true);
    try {
      const [agentWalletRes, memberWalletRes, historyRes] = await Promise.all([
        getWalletSummary({}),
        getWalletSummary({ targetUserId: memberId }),
        getWalletHistory({ targetUserId: memberId, limit: 20 })
      ]);
      setAgentWallet(agentWalletRes.data);
      setMemberWallet(memberWalletRes.data);
      setWalletEntries(historyRes.data || []);
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message || 'Failed to load wallet activity');
    } finally {
      if (!silent) setWalletLoading(false);
    }
  };

  useEffect(() => {
    const loadAll = async () => { await Promise.all([load(), loadWalletData()]); };
    loadAll();
  }, [memberId]);

  const groupedLotteries = useMemo(() => groupLotterySettingsByLeague(form?.lotterySettings || []), [form?.lotterySettings]);
  const updateAccount = (field, value) => setForm((current) => ({ ...current, account: { ...current.account, [field]: value } }));
  const updateProfile = (field, value) => setForm((current) => ({ ...current, profile: { ...current.profile, [field]: value } }));
  const patchLottery = (lotteryTypeId, patch) => setForm((current) => ({ ...current, lotterySettings: updateLotterySetting(current.lotterySettings, lotteryTypeId, patch) }));

  const applyProfileToAllLotteries = () => {
    setForm((current) => ({
      ...current,
      lotterySettings: current.lotterySettings.map((lottery) => ({
        ...lottery,
        stockPercent: current.profile.stockPercent,
        ownerPercent: current.profile.ownerPercent,
        keepPercent: current.profile.keepPercent,
        commissionRate: current.profile.commissionRate
      }))
    }));
  };

  const save = async () => {
    if (!form?.account.username || !form?.account.name) {
      toast.error('Username and name are required');
      setTab('General');
      return;
    }

    setSaving(true);
    try {
      const res = await updateAgentMemberProfile(memberId, {
        account: { ...form.account },
        profile: {
          ...form.profile,
          stockPercent: toNumber(form.profile.stockPercent),
          ownerPercent: toNumber(form.profile.ownerPercent),
          keepPercent: toNumber(form.profile.keepPercent),
          commissionRate: toNumber(form.profile.commissionRate)
        },
        lotterySettings: form.lotterySettings.map((lottery) => ({
          lotteryTypeId: lottery.lotteryTypeId,
          isEnabled: lottery.isEnabled,
          rateProfileId: lottery.rateProfileId,
          enabledBetTypes: lottery.enabledBetTypes,
          minimumBet: toNumber(lottery.minimumBet),
          maximumBet: toNumber(lottery.maximumBet),
          maximumPerNumber: toNumber(lottery.maximumPerNumber),
          stockPercent: toNumber(lottery.stockPercent),
          ownerPercent: toNumber(lottery.ownerPercent),
          keepPercent: toNumber(lottery.keepPercent),
          commissionRate: toNumber(lottery.commissionRate),
          useCustomRates: Boolean(lottery.useCustomRates),
          customRates: lottery.customRates,
          keepMode: lottery.keepMode,
          keepCapAmount: toNumber(lottery.keepCapAmount),
          blockedNumbers: lottery.blockedNumbers,
          notes: lottery.notes
        }))
      });
      setDetail(res.data);
      setForm(createMemberFormFromDetail(res.data, bootstrap));
      toast.success('Member updated');
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message || 'Failed to update member');
    } finally {
      setSaving(false);
    }
  };

  const refresh = async () => {
    setRefreshing(true);
    try {
      await Promise.all([load(true), loadWalletData(true)]);
    } finally {
      setRefreshing(false);
    }
  };

  const submitTransfer = async (event) => {
    event.preventDefault();
    const amount = toNumber(transferForm.amount);
    if (amount <= 0) {
      toast.error('Transfer amount must be greater than zero');
      return;
    }

    setWalletSubmitting(true);
    try {
      await transferWalletCredit({ memberId, direction: transferForm.direction, amount, note: transferForm.note });
      setTransferForm({ direction: transferForm.direction, amount: '', note: '' });
      await Promise.all([load(true), loadWalletData(true), checkAuth()]);
      toast.success('Wallet transfer completed');
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message || 'Failed to transfer credit');
    } finally {
      setWalletSubmitting(false);
    }
  };

  if (loading || !form || !detail) return <PageSkeleton statCount={4} rows={5} sidebar compactSidebar />;

  const member = detail.member;

  return (
    <div className="agent-member-detail animate-fade-in">
      <section className="member-hero card">
        <div className="member-hero-copy">
          <div className="member-hero-topline">
            <Link to="/agent/customers" className="member-back-link"><FiArrowLeft /> Members</Link>
            {member.isOnline ? <span className="member-online"><FiWifi /> online</span> : null}
          </div>
          <h1 className="page-title">{member.name}</h1>
          <p className="page-subtitle">@{member.username} • {member.memberCode || '-'} • Last active {formatDateTime(member.lastActiveAt)}</p>
          <div className="member-meta-row">
            <span><FiHash /> {member.memberCode || 'No member code'}</span>
            <span><FiPhone /> {member.phone || 'No phone'}</span>
            <span>{member.status}</span>
          </div>
        </div>
        <div className="detail-actions">
          <button className="btn btn-secondary" onClick={refresh} disabled={refreshing}>
            <FiRefreshCw className={refreshing ? 'spin-animation' : ''} />
            Refresh
          </button>
          <button className="btn btn-primary" onClick={save} disabled={saving}>
            <FiSave />
            {saving ? 'Saving...' : 'Save changes'}
          </button>
        </div>
      </section>

      <section className="detail-summary-grid">
        <article className="detail-summary-card"><span>Credit balance</span><strong>{money(member.creditBalance)}</strong><small>Ledger controlled</small></article>
        <article className="detail-summary-card"><span>Total bets</span><strong>{money(member.totals?.totalBets)}</strong><small>Submitted items</small></article>
        <article className="detail-summary-card"><span>Total sales</span><strong>{money(member.totals?.totalAmount)}</strong><small>Gross sales</small></article>
        <article className="detail-summary-card"><span>Enabled lotteries</span><strong>{money(member.configSummary?.enabledLotteryCount)}</strong><small>Available markets</small></article>
      </section>

      <section className="card">
        <div className="tab-row">
          {tabs.map((item) => <button key={item} className={`tab-chip ${tab === item ? 'active' : ''}`} onClick={() => setTab(item)}>{item}</button>)}
        </div>
      </section>

      {tab === 'General' ? (
        <section className="card detail-panel">
          <div className="panel-head">
            <div>
              <div className="panel-eyebrow">Profile and defaults</div>
              <h3 className="card-title">General settings</h3>
            </div>
            <button className="btn btn-secondary btn-sm" onClick={applyProfileToAllLotteries}>Apply values to all lotteries</button>
          </div>
          <div className="detail-grid">
            <label><span>Username</span><input value={form.account.username} onChange={(event) => updateAccount('username', event.target.value)} /></label>
            <label><span>New password</span><input type="password" value={form.account.password} onChange={(event) => updateAccount('password', event.target.value)} placeholder="Leave empty to keep current password" /></label>
            <label><span>Name</span><input value={form.account.name} onChange={(event) => updateAccount('name', event.target.value)} /></label>
            <label><span>Phone</span><input value={form.account.phone} onChange={(event) => updateAccount('phone', event.target.value)} /></label>
            <label><span>Member code</span><input value={form.account.memberCode} onChange={(event) => updateAccount('memberCode', event.target.value.toUpperCase())} /></label>
            <label><span>Status</span><select value={form.profile.status} onChange={(event) => updateProfile('status', event.target.value)}>{statusOptions.map((status) => <option key={status} value={status}>{status}</option>)}</select></label>
            <label><span>Default rate</span><select value={form.profile.defaultRateProfileId} onChange={(event) => updateProfile('defaultRateProfileId', event.target.value)}>{(bootstrap?.rateProfiles || []).map((profile) => <option key={profile.id} value={profile.id}>{profile.name}</option>)}</select></label>
            <label><span>Stock %</span><input type="number" min="0" max="100" value={form.profile.stockPercent} onChange={(event) => updateProfile('stockPercent', event.target.value)} /></label>
            <label><span>Owner %</span><input type="number" min="0" max="100" value={form.profile.ownerPercent} onChange={(event) => updateProfile('ownerPercent', event.target.value)} /></label>
            <label><span>Keep %</span><input type="number" min="0" max="100" value={form.profile.keepPercent} onChange={(event) => updateProfile('keepPercent', event.target.value)} /></label>
            <label><span>Commission %</span><input type="number" min="0" max="100" value={form.profile.commissionRate} onChange={(event) => updateProfile('commissionRate', event.target.value)} /></label>
            <label className="full"><span>Notes</span><textarea rows="5" value={form.profile.notes} onChange={(event) => updateProfile('notes', event.target.value)} /></label>
          </div>
          <div className="detail-footnote">Credit balance is managed in the Wallet tab so every change is written to the ledger.</div>
        </section>
      ) : null}

      {tab === 'Lotteries' ? (
        <section className="detail-stack">
          {Object.entries(groupedLotteries).map(([leagueName, items]) => (
            <section key={leagueName} className="card detail-panel">
              <div className="panel-head">
                <div>
                  <div className="panel-eyebrow">League</div>
                  <h3 className="card-title">{leagueName}</h3>
                </div>
              </div>
              <div className="detail-stack">
                {items.map((lottery) => (
                  <article key={lottery.lotteryTypeId} className={`lottery-panel ${lottery.isEnabled ? '' : 'muted'}`}>
                    <div className="lottery-panel-head">
                      <div><strong>{lottery.lotteryName}</strong><span>{lottery.lotteryCode}</span></div>
                      <label className="inline-check"><input type="checkbox" checked={lottery.isEnabled} onChange={(event) => patchLottery(lottery.lotteryTypeId, { isEnabled: event.target.checked })} />Enabled</label>
                    </div>
                    <div className="detail-grid">
                      <label><span>Rate profile</span><select value={lottery.rateProfileId} onChange={(event) => patchLottery(lottery.lotteryTypeId, { rateProfileId: event.target.value })}>{lottery.availableRateProfiles.map((profile) => <option key={profile.id} value={profile.id}>{profile.name}</option>)}</select></label>
                      <label><span>Min bet</span><input type="number" min="0" value={lottery.minimumBet} onChange={(event) => patchLottery(lottery.lotteryTypeId, { minimumBet: event.target.value })} /></label>
                      <label><span>Max bet</span><input type="number" min="0" value={lottery.maximumBet} onChange={(event) => patchLottery(lottery.lotteryTypeId, { maximumBet: event.target.value })} /></label>
                      <label><span>Max per number</span><input type="number" min="0" value={lottery.maximumPerNumber} onChange={(event) => patchLottery(lottery.lotteryTypeId, { maximumPerNumber: event.target.value })} /></label>
                      <label><span>Stock %</span><input type="number" min="0" max="100" value={lottery.stockPercent} onChange={(event) => patchLottery(lottery.lotteryTypeId, { stockPercent: event.target.value })} /></label>
                      <label><span>Owner %</span><input type="number" min="0" max="100" value={lottery.ownerPercent} onChange={(event) => patchLottery(lottery.lotteryTypeId, { ownerPercent: event.target.value })} /></label>
                      <label><span>Keep %</span><input type="number" min="0" max="100" value={lottery.keepPercent} onChange={(event) => patchLottery(lottery.lotteryTypeId, { keepPercent: event.target.value })} /></label>
                      <label><span>Commission %</span><input type="number" min="0" max="100" value={lottery.commissionRate} onChange={(event) => patchLottery(lottery.lotteryTypeId, { commissionRate: event.target.value })} /></label>
                      <label><span>Keep mode</span><select value={lottery.keepMode} onChange={(event) => patchLottery(lottery.lotteryTypeId, { keepMode: event.target.value })}><option value="off">off</option><option value="cap">cap</option></select></label>
                      <label><span>Keep cap</span><input type="number" min="0" value={lottery.keepCapAmount} onChange={(event) => patchLottery(lottery.lotteryTypeId, { keepCapAmount: event.target.value })} /></label>
                    </div>
                    <div className="lottery-toolbar"><label className="inline-check"><input type="checkbox" checked={lottery.useCustomRates} onChange={(event) => patchLottery(lottery.lotteryTypeId, { useCustomRates: event.target.checked })} />Use custom rates</label></div>
                    <div className="bet-type-row">
                      {lottery.supportedBetTypes.map((betType) => <button key={betType} type="button" className={`bet-chip ${lottery.enabledBetTypes.includes(betType) ? 'active' : ''}`} onClick={() => setForm((current) => ({ ...current, lotterySettings: toggleBetType(current.lotterySettings, lottery.lotteryTypeId, betType) }))}>{betTypeLabels[betType] || betType}</button>)}
                    </div>
                    {lottery.useCustomRates ? (
                      <div className="detail-grid">
                        {Object.keys(betTypeLabels).map((betType) => <label key={betType}><span>{betTypeLabels[betType]}</span><input type="number" min="0" value={lottery.customRates?.[betType] || 0} onChange={(event) => patchLottery(lottery.lotteryTypeId, { customRates: { ...lottery.customRates, [betType]: event.target.value } })} /></label>)}
                      </div>
                    ) : null}
                    <label className="textarea-block"><span>Blocked numbers</span><textarea rows="3" value={(lottery.blockedNumbers || []).join('\n')} onChange={(event) => patchLottery(lottery.lotteryTypeId, { blockedNumbers: event.target.value.split(/\r?\n|,/).map((item) => item.trim()).filter(Boolean) })} placeholder="One number per line" /></label>
                  </article>
                ))}
              </div>
            </section>
          ))}
        </section>
      ) : null}

      {tab === 'Wallet' ? (
        <section className="detail-stack">
          {walletLoading ? <SectionSkeleton rows={5} /> : (
            <>
              <section className="detail-summary-grid">
                <article className="detail-summary-card"><span>Agent balance</span><strong>{money(agentWallet?.account?.creditBalance)}</strong><small>Agent wallet</small></article>
                <article className="detail-summary-card"><span>Member balance</span><strong>{money(memberWallet?.account?.creditBalance)}</strong><small>Member wallet</small></article>
                <article className="detail-summary-card"><span>Credit in</span><strong>{money(memberWallet?.totals?.totalCreditIn)}</strong><small>Total incoming credit</small></article>
                <article className="detail-summary-card"><span>Ledger entries</span><strong>{money(memberWallet?.totals?.transactionCount)}</strong><small>Wallet history rows</small></article>
              </section>

              <section className="wallet-grid">
                <section className="card detail-panel">
                  <div className="panel-head"><div><div className="panel-eyebrow">Ledger action</div><h3 className="card-title">Transfer credit</h3></div></div>
                  <form className="detail-stack" onSubmit={submitTransfer}>
                    <div className="detail-grid">
                      <label><span>Direction</span><select value={transferForm.direction} onChange={(event) => setTransferForm((current) => ({ ...current, direction: event.target.value }))}><option value="to_member">Agent to member</option><option value="from_member">Member to agent</option></select></label>
                      <label><span>Amount</span><input type="number" min="0" step="0.01" value={transferForm.amount} onChange={(event) => setTransferForm((current) => ({ ...current, amount: event.target.value }))} /></label>
                      <label className="full"><span>Note</span><textarea rows="4" value={transferForm.note} onChange={(event) => setTransferForm((current) => ({ ...current, note: event.target.value }))} placeholder="Optional ledger note" /></label>
                    </div>
                    <div className="inline-actions"><button className="btn btn-primary" type="submit" disabled={walletSubmitting}><FiRepeat />{walletSubmitting ? 'Transferring...' : 'Transfer credit'}</button></div>
                  </form>
                </section>

                <section className="card detail-panel">
                  <div className="panel-head"><div><div className="panel-eyebrow">Ledger feed</div><h3 className="card-title">Recent wallet activity</h3></div></div>
                  {walletEntries.length === 0 ? <div className="empty-state"><div className="empty-state-text">No wallet activity for this member.</div></div> : (
                    <div className="detail-stack">
                      {walletEntries.map((entry) => (
                        <article key={entry.id} className={`wallet-row wallet-${entry.direction}`}>
                          <div className="wallet-main">
                            <div className="wallet-topline">
                              <strong>{entry.entryType === 'transfer' ? 'Transfer' : 'Adjustment'}</strong>
                              <span className={`wallet-direction-pill wallet-direction-${entry.direction}`}>{entry.direction}</span>
                            </div>
                            <div className="wallet-meta">{entry.counterparty?.name || entry.performedBy?.name || 'System'} • {entry.reasonCode || '-'} • Balance {money(entry.balanceAfter)}</div>
                            {entry.note ? <div className="wallet-note-text">{entry.note}</div> : null}
                          </div>
                          <div className="wallet-right">
                            <strong className={entry.direction === 'credit' ? 'wallet-credit-text' : 'wallet-debit-text'}>{entry.direction === 'credit' ? '+' : '-'}{money(entry.amount)}</strong>
                            <span>{formatDateTime(entry.createdAt)}</span>
                          </div>
                        </article>
                      ))}
                    </div>
                  )}
                </section>
              </section>
            </>
          )}
        </section>
      ) : null}

      <style>{`
        .agent-member-detail,.detail-stack{display:flex;flex-direction:column;gap:18px}
        .agent-member-detail{position:relative;isolation:isolate}
        .agent-member-detail::before{content:'';position:absolute;inset:-48px 0 auto;height:220px;background:radial-gradient(circle at top left,rgba(16,185,129,.14),transparent 62%);pointer-events:none;z-index:-1}
        .member-hero{display:flex;justify-content:space-between;align-items:flex-end;gap:24px;padding:28px;background:linear-gradient(135deg,rgba(15,23,42,.96),rgba(17,24,39,.9)),radial-gradient(circle at top right,rgba(16,185,129,.12),transparent 38%);border-color:rgba(52,211,153,.18);box-shadow:0 24px 60px rgba(15,23,42,.34)}
        .member-hero-copy,.detail-actions,.tab-row,.inline-actions,.lottery-panel-head,.lottery-toolbar,.member-hero-topline{display:flex;gap:10px;flex-wrap:wrap}
        .member-hero-copy{flex-direction:column;min-width:0}
        .member-hero .page-title{margin:0;font-size:clamp(2rem,4vw,3rem);line-height:.96;letter-spacing:-.04em}
        .member-hero .page-subtitle{margin:0;max-width:56ch}
        .member-back-link,.member-online,.member-meta-row span{display:inline-flex;align-items:center;gap:6px}
        .member-online{padding:6px 12px;border-radius:999px;background:rgba(56,189,248,.14);color:#7dd3fc;font-size:.82rem;font-weight:700}
        .member-meta-row{display:flex;gap:10px;flex-wrap:wrap}
        .member-meta-row span{padding:8px 12px;border-radius:999px;background:rgba(9,16,30,.78);border:1px solid rgba(148,163,184,.14);color:var(--text-secondary);font-size:.82rem}
        .detail-summary-grid,.detail-grid,.wallet-grid{display:grid;gap:12px}
        .detail-summary-grid{grid-template-columns:repeat(4,minmax(0,1fr))}
        .detail-summary-card,.lottery-panel,.wallet-row{border-radius:20px;border:1px solid rgba(148,163,184,.14);background:linear-gradient(180deg,rgba(20,30,49,.94),rgba(15,23,42,.9))}
        .detail-summary-card{padding:18px;display:flex;flex-direction:column;gap:8px}
        .detail-summary-card span,.detail-summary-card small,.detail-footnote,.panel-eyebrow,.lottery-panel-head span,.wallet-meta,.wallet-note-text,.wallet-right span{color:var(--text-muted)}
        .detail-summary-card strong{font-size:1.45rem;line-height:1;letter-spacing:-.04em}
        .detail-panel,.card>.tab-row{padding:20px}
        .panel-head{display:flex;justify-content:space-between;align-items:flex-start;gap:12px;margin-bottom:16px}
        .panel-head .card-title{margin:6px 0 0;font-size:1.15rem}
        .tab-chip,.bet-chip{padding:8px 12px;border-radius:999px;border:1px solid rgba(148,163,184,.16);background:rgba(9,16,30,.76);color:var(--text-secondary);font-size:.8rem;font-weight:700}
        .tab-chip.active,.bet-chip.active{border-color:rgba(52,211,153,.2);background:rgba(16,185,129,.12);color:var(--primary-light)}
        .detail-grid{grid-template-columns:repeat(2,minmax(0,1fr))}
        .detail-grid label,.textarea-block{display:flex;flex-direction:column;gap:8px}
        .detail-grid label span,.textarea-block span{font-size:.78rem;color:var(--text-secondary);text-transform:uppercase;letter-spacing:.08em;font-weight:700}
        .detail-grid input,.detail-grid select,.detail-grid textarea,.textarea-block textarea{width:100%;min-height:52px;padding:14px 16px;border-radius:16px;border:1px solid rgba(148,163,184,.16);background:rgba(9,16,30,.92);color:var(--text-primary)}
        .detail-grid input:focus,.detail-grid select:focus,.detail-grid textarea:focus,.textarea-block textarea:focus{outline:none;border-color:rgba(52,211,153,.42);box-shadow:0 0 0 4px rgba(16,185,129,.08)}
        .detail-grid .full{grid-column:1/-1}
        .lottery-panel{padding:18px}
        .lottery-panel.muted{opacity:.72}
        .lottery-panel-head{justify-content:space-between;margin-bottom:16px}
        .lottery-panel-head strong{display:block;margin-bottom:6px}
        .inline-check{display:inline-flex;align-items:center;gap:8px;color:var(--text-secondary)}
        .bet-type-row{display:flex;flex-wrap:wrap;gap:8px;margin:16px 0}
        .wallet-grid{grid-template-columns:minmax(320px,.9fr) minmax(0,1.1fr)}
        .wallet-row{padding:16px;display:flex;align-items:center;justify-content:space-between;gap:12px;border-left-width:3px}
        .wallet-credit{border-left-color:var(--success)} .wallet-debit{border-left-color:var(--danger)}
        .wallet-main{min-width:0;display:flex;flex-direction:column;gap:6px}
        .wallet-topline{display:flex;align-items:center;gap:10px;flex-wrap:wrap}
        .wallet-direction-pill{padding:5px 10px;border-radius:999px;font-size:.72rem;font-weight:700;text-transform:capitalize}
        .wallet-direction-credit{background:rgba(16,185,129,.12);color:#34d399}
        .wallet-direction-debit{background:rgba(239,68,68,.12);color:#f87171}
        .wallet-right{text-align:right;display:flex;flex-direction:column;gap:4px}
        .wallet-credit-text{color:var(--success)} .wallet-debit-text{color:var(--danger)}
        @media (max-width:1100px){.detail-summary-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.wallet-grid,.member-hero{grid-template-columns:1fr}.member-hero{display:flex;flex-direction:column;align-items:stretch}}
        @media (max-width:760px){.detail-summary-grid,.detail-grid,.wallet-grid{grid-template-columns:1fr}.detail-actions,.detail-actions .btn,.inline-actions,.inline-actions .btn{width:100%}.detail-actions .btn,.inline-actions .btn{justify-content:center}.wallet-row{flex-direction:column;align-items:flex-start}.wallet-right{text-align:left}}
      `}</style>
    </div>
  );
};

export default AgentMemberDetail;
