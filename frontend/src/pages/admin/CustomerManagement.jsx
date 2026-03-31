import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { FiDollarSign, FiEdit2, FiPlus, FiSearch, FiTrash2, FiUserCheck, FiUsers } from 'react-icons/fi';
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

const copy = adminCopy.customers;
const money = (value) => Number(value || 0).toLocaleString('th-TH');

const CustomerManagement = () => {
  const navigate = useNavigate();
  const [customers, setCustomers] = useState([]);
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterAgent, setFilterAgent] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editCustomer, setEditCustomer] = useState(null);
  const [form, setForm] = useState({ username: '', password: '', name: '', phone: '', agentId: '' });

  useEffect(() => {
    loadData();
  }, [filterAgent]);

  const loadData = async () => {
    try {
      const [customerRes, agentRes] = await Promise.all([
        getAdminCustomers(filterAgent),
        getAgents()
      ]);
      setCustomers(customerRes.data || []);
      setAgents(agentRes.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    try {
      if (editCustomer) {
        const updateData = { name: form.name, phone: form.phone, agentId: form.agentId };
        if (form.password) updateData.password = form.password;
        await updateAdminCustomer(editCustomer._id, updateData);
        toast.success('อัปเดตข้อมูลสมาชิกแล้ว');
      } else {
        await createAdminCustomer(form);
        toast.success('สร้างสมาชิกแล้ว');
      }
      closeModal();
      await loadData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'เกิดข้อผิดพลาด');
    }
  };

  const handleDelete = async (customer) => {
    if (!window.confirm(`ต้องการปิดการใช้งานสมาชิก "${customer.name}" ใช่หรือไม่`)) return;
    try {
      await deleteAdminCustomer(customer._id);
      toast.success('ปิดการใช้งานสมาชิกแล้ว');
      await loadData();
    } catch (err) {
      toast.error('เกิดข้อผิดพลาด');
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

  const filteredCustomers = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    if (!keyword) return customers;
    return customers.filter((customer) =>
      customer.name?.toLowerCase().includes(keyword) ||
      customer.username?.toLowerCase().includes(keyword) ||
      customer.phone?.toLowerCase().includes(keyword) ||
      customer.agentId?.name?.toLowerCase().includes(keyword)
    );
  }, [customers, search]);

  const overviewCards = useMemo(() => {
    const activeCount = customers.filter((customer) => customer.isActive).length;
    const assignedAgentCount = new Set(customers.map((customer) => customer.agentId?._id || customer.agentId).filter(Boolean)).size;
    const unassignedCount = customers.filter((customer) => !customer.agentId).length;
    const totalSales = customers.reduce((sum, customer) => sum + Number(customer.totals?.totalAmount || 0), 0);
    const totalWon = customers.reduce((sum, customer) => sum + Number(customer.totals?.totalWon || 0), 0);
    const netProfit = totalSales - totalWon;

    return [
      { label: copy.overviewCards.totalCustomers.label, value: customers.length, hint: copy.overviewCards.totalCustomers.hint(activeCount) },
      { label: copy.overviewCards.assignedAgents.label, value: assignedAgentCount, hint: copy.overviewCards.assignedAgents.hint },
      { label: copy.overviewCards.totalSales.label, value: `${money(totalSales)} บาท`, hint: copy.overviewCards.totalSales.hint },
      { label: copy.overviewCards.totalWon.label, value: `${money(totalWon)} บาท`, hint: copy.overviewCards.totalWon.hint },
      { label: copy.overviewCards.netProfit.label, value: `${money(netProfit)} บาท`, hint: copy.overviewCards.netProfit.hint },
      { label: copy.overviewCards.unassigned.label, value: unassignedCount, hint: copy.overviewCards.unassigned.hint }
    ];
  }, [customers]);

  if (loading) {
    return <PageSkeleton statCount={4} rows={6} sidebar={false} />;
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
          <span>{copy.currentFilter}</span>
          <strong>{filterAgent ? copy.filterOnlyAgent : copy.filterAllAgents}</strong>
          <small>{copy.showingCount(filteredCustomers.length)}</small>
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

      <section className="card ops-section">
        <div className="ops-table-head">
          <div>
            <div className="ui-eyebrow">{copy.listEyebrow}</div>
            <h3 className="card-title">{copy.listTitle}</h3>
            <p className="ops-table-note">{copy.listNote}</p>
          </div>
          <div className="ops-actions">
            <button className="btn btn-secondary" onClick={loadData}>{adminCopy.common.refresh}</button>
            <button className="btn btn-secondary" onClick={() => navigate('/admin/betting')}>
              <FiDollarSign />
              ซื้อแทน
            </button>
            <button className="btn btn-primary" onClick={() => setShowModal(true)}>
              <FiPlus />
              {copy.add}
            </button>
          </div>
        </div>

        <div className="ops-toolbar mb-md">
          <div className="ops-search">
            <FiSearch />
            <input
              className="form-input"
              placeholder={copy.searchPlaceholder}
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>

          <select className="form-select" value={filterAgent} onChange={(event) => setFilterAgent(event.target.value)} style={{ width: 240 }}>
            <option value="">{copy.allAgents}</option>
            {agents.map((agent) => (
              <option key={agent._id} value={agent._id}>{agent.name}</option>
            ))}
          </select>
        </div>

        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>{copy.columns.name}</th>
                <th>{copy.columns.username}</th>
                <th>{copy.columns.agent}</th>
                <th>{copy.columns.phone}</th>
                <th>{copy.columns.sales}</th>
                <th>{copy.columns.won}</th>
                <th>{copy.columns.netProfit}</th>
                <th>{copy.columns.status}</th>
                <th>{copy.columns.actions}</th>
              </tr>
            </thead>
            <tbody>
              {filteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan="9" className="text-center text-muted" style={{ padding: 40 }}>{copy.empty}</td>
                </tr>
              ) : (
                filteredCustomers.map((customer) => (
                  <tr key={customer._id}>
                    <td style={{ fontWeight: 700 }}>{customer.name}</td>
                    <td>{customer.username}</td>
                    <td>{customer.agentId?.name || '-'}</td>
                    <td>{customer.phone || '-'}</td>
                    <td>{money(customer.totals?.totalAmount)} บาท</td>
                    <td>{money(customer.totals?.totalWon)} บาท</td>
                    <td style={{ fontWeight: 700 }}>{money(customer.totals?.netProfit)} บาท</td>
                    <td>
                      <span className={`badge ${customer.isActive ? 'badge-success' : 'badge-danger'}`}>
                        {getUserStatusLabel(customer.isActive ? 'active' : 'inactive')}
                      </span>
                    </td>
                    <td>
                      <div className="ops-actions">
                        <button className="btn btn-secondary btn-sm" onClick={() => navigate(`/admin/betting?memberId=${customer._id}`)}>
                          <FiDollarSign />
                          ซื้อแทน
                        </button>
                        <button className="btn btn-secondary btn-sm" onClick={() => openEdit(customer)}>
                          <FiEdit2 />
                          {copy.edit}
                        </button>
                        <button className="btn btn-danger btn-sm" onClick={() => handleDelete(customer)}>
                          <FiTrash2 />
                          {copy.deactivate}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="ops-grid">
        <section className="card ops-section">
          <div className="ui-panel-head">
            <div>
              <div className="ui-eyebrow">{copy.assignmentEyebrow}</div>
              <h3 className="card-title">{copy.assignmentTitle}</h3>
            </div>
          </div>

          <div className="ops-stack">
            <div className="ops-stat-row">
              <span><FiUsers style={{ marginRight: 8 }} />{copy.assignedAgents}</span>
              <strong>{new Set(customers.map((customer) => customer.agentId?._id || customer.agentId).filter(Boolean)).size}</strong>
            </div>
            <div className="ops-stat-row">
              <span><FiUserCheck style={{ marginRight: 8 }} />{copy.activeCustomers}</span>
              <strong>{customers.filter((customer) => customer.isActive).length}</strong>
            </div>
          </div>
        </section>

        <section className="card ops-section">
          <div className="ui-panel-head">
            <div>
              <div className="ui-eyebrow">{copy.notesEyebrow}</div>
              <h3 className="card-title">{copy.notesTitle}</h3>
            </div>
          </div>

          <div className="ops-stack">
            <div className="ops-feed-row">
              <div>
                <strong>{copy.ownerChange}</strong>
                <div className="ops-feed-meta">{copy.ownerChangeHint}</div>
              </div>
            </div>
            <p className="ops-table-note">{copy.passwordHint}</p>
          </div>
        </section>
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
    </div>
  );
};

export default CustomerManagement;
