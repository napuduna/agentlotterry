import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  FiBarChart2,
  FiClock,
  FiDollarSign,
  FiEdit2,
  FiPhone,
  FiPlus,
  FiRefreshCw,
  FiSearch,
  FiTrendingUp,
  FiUserCheck,
  FiUsers,
  FiXCircle
} from 'react-icons/fi';
import Modal from '../../components/Modal';
import PageSkeleton from '../../components/PageSkeleton';
import { adminCopy } from '../../i18n/th/admin';
import { getUserStatusLabel } from '../../i18n/th/labels';
import {
  createAdminCustomer,
  deleteAdminCustomer,
  getAdminCustomers,
  getAgents,
  updateAdminCustomer
} from '../../services/api';
import { formatDateTime, formatMoney as money, formatNumber, getInitial, toNumber } from '../../utils/formatters';

const copy = adminCopy.customers;
const statusOptions = ['', 'active', 'inactive'];
const sortOptions = [
  { value: 'recent', label: 'อัปเดตล่าสุด' },
  { value: 'sales_desc', label: 'ยอดซื้อสูงสุด' },
  { value: 'profit_desc', label: 'กำไร/ขาดทุนสูงสุด' },
  { value: 'name_asc', label: 'ชื่อ A-Z' }
];

const ui = {
  filterTitle: 'ค้นหาและกรอง',
  filterSubtitle: 'ค้นหาสมาชิกและกรองตามเจ้ามือผู้ดูแล สถานะ และลำดับการแสดงผล',
  filterCount: (value) => `${value} สมาชิก`,
  filterAgentLabel: 'เจ้ามือผู้ดูแล',
  statusLabel: 'สถานะ',
  sortLabel: 'เรียงลำดับ',
  allStatuses: 'ทุกสถานะ',
  noPhone: 'ไม่ระบุเบอร์',
  unassignedAgent: 'ยังไม่มอบหมาย',
  lastUpdatedPrefix: 'อัปเดตล่าสุด',
  currentOwner: 'เจ้ามือผู้ดูแล',
  purchasedSlips: 'จำนวนโพยที่ซื้อ',
  purchaseAmount: 'ยอดซื้อ',
  won: 'ยอดถูก',
  profitLoss: 'กำไร/ขาดทุน',
  memberSummary: 'สรุปสมาชิก',
  ownerHint: (agentName) => `ดูแลโดย ${agentName || 'ยังไม่มอบหมาย'}`,
  loadError: 'โหลดข้อมูลสมาชิกไม่สำเร็จ',
  saveSuccess: 'อัปเดตข้อมูลสมาชิกแล้ว',
  createSuccess: 'สร้างสมาชิกแล้ว',
  deactivateSuccess: 'ปิดการใช้งานสมาชิกแล้ว',
  genericError: 'เกิดข้อผิดพลาด',
  confirmDeactivate: (name) => `ต้องการปิดการใช้งานสมาชิก "${name}" ใช่หรือไม่`
};

const formatSignedNumber = (value) => {
  const amount = toNumber(value);
  const formatted = Math.abs(amount).toLocaleString('th-TH');
  if (amount > 0) return `+${formatted}`;
  if (amount < 0) return `-${formatted}`;
  return formatted;
};

const CustomerManagement = () => {
  const navigate = useNavigate();
  const [customers, setCustomers] = useState([]);
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [filterAgent, setFilterAgent] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [sortBy, setSortBy] = useState('recent');
  const [showModal, setShowModal] = useState(false);
  const [editCustomer, setEditCustomer] = useState(null);
  const [form, setForm] = useState({ username: '', password: '', name: '', phone: '', agentId: '' });

  const loadData = async ({ silent = false } = {}) => {
    if (!silent) setLoading(true);
    try {
      const [customerRes, agentRes] = await Promise.all([
        getAdminCustomers(filterAgent),
        getAgents()
      ]);
      setCustomers(customerRes.data || []);
      setAgents(agentRes.data || []);
    } catch (error) {
      console.error(error);
      toast.error(ui.loadError);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [filterAgent]);

  const refreshAll = async () => {
    setRefreshing(true);
    try {
      await loadData({ silent: true });
    } finally {
      setRefreshing(false);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    try {
      if (editCustomer) {
        const updateData = { name: form.name, phone: form.phone, agentId: form.agentId };
        if (form.password) updateData.password = form.password;
        await updateAdminCustomer(editCustomer._id, updateData);
        toast.success(ui.saveSuccess);
      } else {
        await createAdminCustomer(form);
        toast.success(ui.createSuccess);
      }
      closeModal();
      await loadData({ silent: true });
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message || ui.genericError);
    }
  };

  const handleDelete = async (customer) => {
    if (!window.confirm(ui.confirmDeactivate(customer.name))) return;
    try {
      await deleteAdminCustomer(customer._id);
      toast.success(ui.deactivateSuccess);
      await loadData({ silent: true });
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message || ui.genericError);
    }
  };

  const openEdit = (customer) => {
    setEditCustomer(customer);
    setForm({
      username: customer.username,
      password: '',
      name: customer.name,
      phone: customer.phone || '',
      agentId: customer.agentId?._id || customer.agentId || ''
    });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditCustomer(null);
    setForm({ username: '', password: '', name: '', phone: '', agentId: '' });
  };

  const displayedCustomers = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    const filtered = customers.filter((customer) => {
      const customerStatus = customer.status || (customer.isActive ? 'active' : 'inactive');
      if (statusFilter && customerStatus !== statusFilter) return false;
      if (!keyword) return true;

      return [
        customer.name,
        customer.username,
        customer.phone,
        customer.agentId?.name,
        customer.agentId?.username
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
        .includes(keyword);
    });

    filtered.sort((left, right) => {
      if (sortBy === 'sales_desc') return toNumber(right.totals?.totalAmount) - toNumber(left.totals?.totalAmount);
      if (sortBy === 'profit_desc') return toNumber(right.totals?.netProfit) - toNumber(left.totals?.netProfit);
      if (sortBy === 'name_asc') return String(left.name || '').localeCompare(String(right.name || ''), 'th');

      const leftTime = new Date(left.updatedAt || left.lastActiveAt || left.createdAt || 0).getTime();
      const rightTime = new Date(right.updatedAt || right.lastActiveAt || right.createdAt || 0).getTime();
      return rightTime - leftTime;
    });

    return filtered;
  }, [customers, search, sortBy, statusFilter]);

  const summary = useMemo(() => {
    const activeCount = displayedCustomers.filter((customer) => (customer.status || (customer.isActive ? 'active' : 'inactive')) === 'active').length;
    const assignedAgentCount = new Set(displayedCustomers.map((customer) => customer.agentId?._id || customer.agentId).filter(Boolean)).size;
    const totalSales = displayedCustomers.reduce((sum, customer) => sum + toNumber(customer.totals?.totalAmount), 0);
    const netProfit = displayedCustomers.reduce((sum, customer) => sum + toNumber(customer.totals?.netProfit), 0);

    return {
      totalCustomers: displayedCustomers.length,
      activeCount,
      assignedAgentCount,
      totalSales,
      netProfit
    };
  }, [displayedCustomers]);

  const selectedAgentName = useMemo(
    () => agents.find((agent) => String(agent._id) === filterAgent)?.name || '',
    [agents, filterAgent]
  );

  if (loading) {
    return <PageSkeleton statCount={4} rows={5} sidebar={false} />;
  }

  return (
    <div className="ops-page admin-members-page animate-fade-in">
      <section className="members-hero card">
        <div className="members-hero-copy">
          <span className="section-eyebrow">{copy.heroEyebrow}</span>
          <h1 className="page-title">{copy.heroTitle}</h1>
          <p className="page-subtitle">{copy.heroSubtitle}</p>
        </div>
        <div className="page-actions">
          <button className="btn btn-secondary" onClick={refreshAll} disabled={refreshing}>
            <FiRefreshCw className={refreshing ? 'spin-animation' : ''} />
            {adminCopy.common.refresh}
          </button>
          <button className="btn btn-secondary" onClick={() => navigate('/admin/betting')}>
            <FiDollarSign />
            ซื้อแทน
          </button>
          <button className="btn btn-primary" onClick={() => setShowModal(true)}>
            <FiPlus />
            {copy.add}
          </button>
        </div>
      </section>

      <section className="summary-grid members-summary-grid">
        <div className="summary-card summary-card-highlight">
          <div className="summary-card-top">
            <span className="summary-icon"><FiUsers /></span>
            <span className="summary-label">{copy.overviewCards.totalCustomers.label}</span>
          </div>
          <strong>{formatNumber(summary.totalCustomers)}</strong>
          <p>{copy.overviewCards.totalCustomers.hint(formatNumber(summary.activeCount))}</p>
        </div>
        <div className="summary-card">
          <div className="summary-card-top">
            <span className="summary-icon"><FiUserCheck /></span>
            <span className="summary-label">{copy.overviewCards.assignedAgents.label}</span>
          </div>
          <strong>{formatNumber(summary.assignedAgentCount)}</strong>
          <p>{copy.overviewCards.assignedAgents.hint}</p>
        </div>
        <div className="summary-card">
          <div className="summary-card-top">
            <span className="summary-icon"><FiDollarSign /></span>
            <span className="summary-label">{copy.overviewCards.totalSales.label}</span>
          </div>
          <strong>{money(summary.totalSales)}</strong>
          <p>{copy.overviewCards.totalSales.hint}</p>
        </div>
        <div className="summary-card">
          <div className="summary-card-top">
            <span className="summary-icon"><FiTrendingUp /></span>
            <span className="summary-label">{copy.overviewCards.netProfit.label}</span>
          </div>
          <strong className={summary.netProfit > 0 ? 'metric-positive' : summary.netProfit < 0 ? 'metric-negative' : ''}>
            {formatSignedNumber(summary.netProfit)}
          </strong>
          <p>{copy.overviewCards.netProfit.hint}</p>
        </div>
      </section>

      <section className="card ops-section filter-card">
        <div className="filter-card-head">
          <div>
            <div className="filter-title">{ui.filterTitle}</div>
            <div className="filter-subtitle">{ui.filterSubtitle}</div>
          </div>
          <div className="filter-count ui-pill">{ui.filterCount(formatNumber(displayedCustomers.length))}</div>
        </div>
        <div className="filter-toolbar">
          <label className="field-inline field-inline-search">
            <span className="field-inline-placeholder" aria-hidden="true">{ui.statusLabel}</span>
            <span className="search-box">
              <FiSearch />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder={copy.searchPlaceholder}
              />
            </span>
          </label>
          <label className="field-inline">
            <span>{ui.filterAgentLabel}</span>
            <select value={filterAgent} onChange={(event) => setFilterAgent(event.target.value)}>
              <option value="">{copy.allAgents}</option>
              {agents.map((agent) => (
                <option key={agent._id} value={agent._id}>{agent.name}</option>
              ))}
            </select>
          </label>
          <label className="field-inline">
            <span>{ui.statusLabel}</span>
            <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
              {statusOptions.map((status) => (
                <option key={status || 'all'} value={status}>
                  {status ? getUserStatusLabel(status) : ui.allStatuses}
                </option>
              ))}
            </select>
          </label>
          <label className="field-inline">
            <span>{ui.sortLabel}</span>
            <select value={sortBy} onChange={(event) => setSortBy(event.target.value)}>
              {sortOptions.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </label>
        </div>
      </section>

      <section className="member-list">
        {displayedCustomers.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon"><FiUsers /></div>
            <div className="empty-state-text">{copy.empty}</div>
          </div>
        ) : displayedCustomers.map((customer) => {
          const purchasedSlips = toNumber(customer.totals?.slipCount ?? customer.totals?.totalBets);
          const profitLoss = toNumber(customer.totals?.netProfit);
          const profitLossClass = profitLoss > 0 ? 'metric-positive' : profitLoss < 0 ? 'metric-negative' : '';
          const customerStatus = customer.status || (customer.isActive ? 'active' : 'inactive');
          const agentName = customer.agentId?.name || ui.unassignedAgent;
          const historyQuery = new URLSearchParams({
            memberId: String(customer._id || ''),
            memberName: customer.name || ''
          }).toString();

          return (
            <article key={customer._id} className="member-card">
              <div className="member-card-header">
                <div className="member-identity">
                  <div className="member-avatar">{getInitial(customer.name)}</div>
                  <div className="member-heading">
                    <div className="member-title-row">
                      <h3>{customer.name}</h3>
                      <span className={`status-pill status-${customerStatus}`}>{getUserStatusLabel(customerStatus)}</span>
                    </div>
                    <div className="member-subtitle-row">
                      <span>@{customer.username}</span>
                      <span><FiPhone /> {customer.phone || ui.noPhone}</span>
                      <span><FiUsers /> {agentName}</span>
                    </div>
                    <div className="member-last-active">
                      {ui.lastUpdatedPrefix}: {formatDateTime(customer.updatedAt || customer.lastActiveAt || customer.createdAt, { fallback: '-' })}
                    </div>
                  </div>
                </div>
                <div className="member-credit member-owner">
                  <span>{ui.currentOwner}</span>
                  <strong>{agentName}</strong>
                </div>
              </div>

              <div className="member-metrics">
                <div>
                  <span>{ui.purchasedSlips}</span>
                  <strong>{formatNumber(purchasedSlips)}</strong>
                </div>
                <div>
                  <span>{ui.purchaseAmount}</span>
                  <strong>{money(customer.totals?.totalAmount)}</strong>
                </div>
                <div>
                  <span>{ui.won}</span>
                  <strong>{money(customer.totals?.totalWon)}</strong>
                </div>
                <div>
                  <span>{ui.profitLoss}</span>
                  <strong className={profitLossClass}>{formatSignedNumber(profitLoss)}</strong>
                </div>
              </div>

              <div className="member-actions">
                <div className="member-actions-copy">
                  <span className="member-actions-label">{ui.memberSummary}</span>
                  <div className="member-actions-hint">
                    <FiBarChart2 />
                    {ui.ownerHint(agentName)}
                  </div>
                </div>
                <div className="member-actions-buttons">
                  <button className="btn btn-secondary btn-sm" onClick={() => navigate(`/admin/betting?memberId=${customer._id}`)}>
                    <FiDollarSign />
                    ซื้อแทน
                  </button>
                  <button className="btn btn-secondary btn-sm" onClick={() => navigate(`/admin/bets?${historyQuery}`)}>
                    <FiClock />
                    {copy.viewHistory}
                  </button>
                  <button className="btn btn-secondary btn-sm" onClick={() => openEdit(customer)}>
                    <FiEdit2 />
                    {copy.edit}
                  </button>
                  <button className="btn btn-danger btn-sm" onClick={() => handleDelete(customer)}>
                    <FiXCircle />
                    {copy.deactivate}
                  </button>
                </div>
              </div>
            </article>
          );
        })}
      </section>

      <Modal isOpen={showModal} onClose={closeModal} title={editCustomer ? copy.editTitle : copy.createTitle}>
        <form onSubmit={handleSubmit}>
          {!editCustomer ? (
            <div className="form-group">
              <label className="form-label">{copy.username}</label>
              <input
                className="form-input"
                value={form.username}
                onChange={(event) => setForm({ ...form, username: event.target.value })}
                required
              />
            </div>
          ) : null}

          <div className="form-group">
            <label className="form-label">{editCustomer ? copy.passwordOptional : copy.passwordRequired}</label>
            <input
              className="form-input"
              type="password"
              value={form.password}
              onChange={(event) => setForm({ ...form, password: event.target.value })}
              required={!editCustomer}
            />
          </div>

          <div className="form-group">
            <label className="form-label">{copy.displayName}</label>
            <input
              className="form-input"
              value={form.name}
              onChange={(event) => setForm({ ...form, name: event.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">{copy.phoneLabel}</label>
            <input
              className="form-input"
              value={form.phone}
              onChange={(event) => setForm({ ...form, phone: event.target.value })}
            />
          </div>

          <div className="form-group">
            <label className="form-label">{copy.agentLabel}</label>
            <select
              className="form-select"
              value={form.agentId}
              onChange={(event) => setForm({ ...form, agentId: event.target.value })}
              required
            >
              <option value="">{copy.selectAgent}</option>
              {agents.filter((agent) => agent.isActive).map((agent) => (
                <option key={agent._id} value={agent._id}>{agent.name}</option>
              ))}
            </select>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={closeModal}>{adminCopy.common.cancel}</button>
            <button type="submit" className="btn btn-primary">{editCustomer ? adminCopy.common.saveChanges : copy.createSubmit}</button>
          </div>
        </form>
      </Modal>

      <style>{`
        .admin-members-page,
        .member-list {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .admin-members-page {
          position: relative;
          isolation: isolate;
        }

        .admin-members-page::before {
          content: '';
          position: absolute;
          inset: -40px 0 auto;
          height: 240px;
          background:
            radial-gradient(circle at top left, rgba(220, 38, 38, 0.14), transparent 58%),
            radial-gradient(circle at top right, rgba(248, 113, 113, 0.08), transparent 28%);
          pointer-events: none;
          z-index: -1;
        }

        .members-hero {
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
          gap: 20px;
          padding: 22px;
          background:
            linear-gradient(135deg, rgba(255, 255, 255, 0.97), rgba(255, 244, 244, 0.98)),
            radial-gradient(circle at top right, rgba(248, 113, 113, 0.14), transparent 34%);
          border-color: rgba(220, 38, 38, 0.14);
          box-shadow: 0 18px 36px rgba(127, 29, 29, 0.1);
        }

        .members-hero-copy {
          max-width: 720px;
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .section-eyebrow {
          font-size: 0.78rem;
          letter-spacing: 0.16em;
          text-transform: uppercase;
          color: var(--primary-light);
          font-weight: 700;
        }

        .members-hero .page-title {
          margin: 0;
          font-size: clamp(2rem, 4vw, 3rem);
          line-height: 0.96;
          letter-spacing: -0.04em;
        }

        .members-hero .page-subtitle {
          margin: 0;
          max-width: 58ch;
          font-size: 1rem;
          color: var(--text-secondary);
        }

        .page-actions,
        .member-title-row,
        .member-subtitle-row,
        .member-actions-buttons {
          display: flex;
          gap: 10px;
          align-items: center;
          flex-wrap: wrap;
        }

        .summary-grid,
        .member-metrics,
        .filter-toolbar {
          display: grid;
          gap: 14px;
        }

        .summary-grid {
          grid-template-columns: repeat(4, minmax(0, 1fr));
        }

        .summary-card,
        .member-card {
          position: relative;
          background: linear-gradient(180deg, rgba(255, 255, 255, 0.97), rgba(255, 247, 247, 0.98));
          border: 1px solid rgba(220, 38, 38, 0.12);
          border-radius: 18px;
          padding: 16px;
          overflow: hidden;
          box-shadow: 0 12px 24px rgba(127, 29, 29, 0.06);
        }

        .summary-card::after,
        .member-card::after {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(135deg, rgba(255, 255, 255, 0.45), transparent 42%);
          pointer-events: none;
        }

        .summary-card-highlight {
          border-color: rgba(220, 38, 38, 0.18);
          box-shadow: 0 14px 28px rgba(220, 38, 38, 0.08);
        }

        .summary-card-top {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 18px;
        }

        .summary-icon {
          width: 40px;
          height: 40px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          border-radius: 14px;
          background: rgba(220, 38, 38, 0.08);
          color: var(--primary);
          font-size: 1.1rem;
        }

        .summary-label,
        .member-subtitle-row,
        .member-metrics span,
        .member-last-active,
        .member-actions-label,
        .filter-subtitle {
          color: var(--text-muted);
          font-size: 0.82rem;
        }

        .summary-card strong {
          display: block;
          font-size: clamp(1.6rem, 3vw, 2.1rem);
          line-height: 1;
          letter-spacing: -0.04em;
          margin-bottom: 8px;
        }

        .summary-card p {
          margin: 0;
          color: var(--text-secondary);
          font-size: 0.92rem;
        }

        .summary-card strong.metric-positive,
        .member-metrics strong.metric-positive {
          color: var(--success);
        }

        .summary-card strong.metric-negative,
        .member-metrics strong.metric-negative {
          color: var(--danger);
        }

        .members-summary-grid .summary-card {
          min-height: 100%;
        }

        .filter-card {
          gap: 16px;
          padding: 18px;
          box-shadow: 0 14px 28px rgba(127, 29, 29, 0.07);
        }

        .filter-card-head {
          display: flex;
          justify-content: space-between;
          gap: 16px;
          align-items: flex-end;
          flex-wrap: wrap;
        }

        .filter-title {
          font-size: 1.05rem;
          font-weight: 700;
          color: var(--text-primary);
          margin-bottom: 6px;
        }

        .filter-toolbar {
          grid-template-columns: repeat(4, minmax(0, 1fr));
        }

        .field-inline {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .field-inline span {
          font-size: 0.84rem;
          color: var(--text-secondary);
          font-weight: 600;
        }

        .field-inline-placeholder {
          visibility: hidden;
        }

        .search-box,
        .field-inline select {
          width: 100%;
          min-height: 52px;
          background: rgba(255, 250, 250, 0.96);
          border: 1px solid rgba(220, 38, 38, 0.12);
          border-radius: 16px;
          color: var(--text-primary);
        }

        .search-box {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          padding: 0 14px;
          color: var(--text-muted);
        }

        .search-box input,
        .field-inline select {
          border: none;
          outline: none;
          background: transparent;
          font: inherit;
        }

        .search-box input {
          flex: 1 1 auto;
          min-width: 0;
          color: var(--text-primary);
        }

        .field-inline select {
          padding: 0 14px;
        }

        .member-card-header {
          display: flex;
          justify-content: space-between;
          gap: 16px;
          align-items: flex-start;
        }

        .member-identity {
          display: flex;
          gap: 14px;
          align-items: flex-start;
          min-width: 0;
        }

        .member-avatar {
          width: 58px;
          height: 58px;
          border-radius: 18px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, rgba(220, 38, 38, 0.12), rgba(248, 113, 113, 0.12));
          color: var(--primary);
          font-size: 1.6rem;
          font-weight: 800;
          flex-shrink: 0;
        }

        .member-heading {
          min-width: 0;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .member-title-row h3 {
          margin: 0;
          font-size: 1.55rem;
          letter-spacing: -0.04em;
        }

        .member-subtitle-row span {
          display: inline-flex;
          align-items: center;
          gap: 6px;
        }

        .member-credit {
          min-width: 220px;
          display: flex;
          flex-direction: column;
          gap: 10px;
          padding: 14px 16px;
          border-radius: 16px;
          background: rgba(255, 251, 251, 0.9);
          border: 1px solid rgba(220, 38, 38, 0.1);
          text-align: right;
        }

        .member-credit span {
          color: var(--text-muted);
          font-size: 0.74rem;
          text-transform: uppercase;
          letter-spacing: 0.08em;
        }

        .member-credit strong {
          font-size: 1.35rem;
          line-height: 1.1;
          letter-spacing: -0.03em;
          word-break: break-word;
        }

        .member-metrics {
          grid-template-columns: repeat(4, minmax(0, 1fr));
          margin: 16px 0;
          gap: 12px;
        }

        .member-metrics > div {
          background: rgba(255, 251, 251, 0.96);
          border: 1px solid rgba(220, 38, 38, 0.1);
          border-radius: 14px;
          padding: 12px;
        }

        .member-metrics strong {
          display: block;
          margin-top: 8px;
          font-size: 1.08rem;
          letter-spacing: -0.03em;
        }

        .member-actions {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          flex-wrap: wrap;
          padding-top: 14px;
          border-top: 1px solid rgba(220, 38, 38, 0.08);
        }

        .member-actions-copy {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .member-actions-hint {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          color: var(--text-secondary);
          font-size: 0.92rem;
        }

        .member-actions-buttons {
          justify-content: flex-end;
        }

        .status-pill {
          padding: 6px 10px;
          border-radius: 999px;
          font-size: 0.72rem;
          font-weight: 700;
        }

        .status-pill.status-active {
          background: rgba(16, 185, 129, 0.12);
          color: #047857;
        }

        .status-pill.status-inactive,
        .status-pill.status-suspended {
          background: rgba(220, 38, 38, 0.12);
          color: var(--danger);
        }

        @media (max-width: 1080px) {
          .summary-grid,
          .member-metrics,
          .filter-toolbar {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
        }

        @media (max-width: 920px) {
          .summary-grid,
          .member-metrics,
          .filter-toolbar {
            grid-template-columns: 1fr;
          }

          .members-hero,
          .member-card-header {
            display: flex;
            flex-direction: column;
            align-items: stretch;
          }

          .page-actions {
            width: 100%;
            justify-content: stretch;
          }

          .page-actions .btn,
          .member-actions-buttons .btn {
            flex: 1;
            justify-content: center;
          }

          .member-actions {
            flex-direction: column;
            align-items: stretch;
          }

          .member-credit {
            width: 100%;
            text-align: left;
            min-width: 0;
          }
        }

        @media (max-width: 640px) {
          .member-identity {
            flex-direction: column;
          }

          .member-actions-buttons,
          .page-actions {
            width: 100%;
            flex-direction: column;
            align-items: stretch;
          }

          .member-subtitle-row span {
            width: 100%;
            justify-content: flex-start;
          }
        }
      `}</style>
    </div>
  );
};

export default CustomerManagement;
