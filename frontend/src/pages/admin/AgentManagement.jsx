import { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { FiDollarSign, FiEdit2, FiPlus, FiSearch, FiShield, FiTrash2, FiUsers } from 'react-icons/fi';
import Modal from '../../components/Modal';
import PageSkeleton from '../../components/PageSkeleton';
import { adminCopy } from '../../i18n/th/admin';
import { getUserStatusLabel } from '../../i18n/th/labels';
import { adjustWalletCredit, createAgent, deleteAgent, getAgents, updateAgent } from '../../services/api';

const money = (value) => Number(value || 0).toLocaleString('th-TH');
const copy = adminCopy.agents;

const AgentManagement = () => {
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editAgent, setEditAgent] = useState(null);
  const [form, setForm] = useState({ username: '', password: '', name: '', phone: '' });
  const [showCreditModal, setShowCreditModal] = useState(false);
  const [creditTarget, setCreditTarget] = useState(null);
  const [creditForm, setCreditForm] = useState({ amount: '', note: '' });

  useEffect(() => {
    loadAgents();
  }, []);

  const loadAgents = async () => {
    try {
      const res = await getAgents();
      setAgents(res.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    try {
      if (editAgent) {
        const updateData = { name: form.name, phone: form.phone };
        if (form.password) updateData.password = form.password;
        await updateAgent(editAgent._id, updateData);
        toast.success('อัปเดตข้อมูลเจ้ามือแล้ว');
      } else {
        await createAgent(form);
        toast.success('สร้างเจ้ามือแล้ว');
      }
      closeModal();
      await loadAgents();
    } catch (err) {
      toast.error(err.response?.data?.message || 'เกิดข้อผิดพลาด');
    }
  };

  const handleDelete = async (agent) => {
    if (!window.confirm(`ต้องการปิดการใช้งานเจ้ามือ "${agent.name}" ใช่หรือไม่`)) return;
    try {
      await deleteAgent(agent._id);
      toast.success('ปิดการใช้งานเจ้ามือแล้ว');
      await loadAgents();
    } catch (err) {
      toast.error('เกิดข้อผิดพลาด');
    }
  };

  const handleToggleActive = async (agent) => {
    try {
      await updateAgent(agent._id, { isActive: !agent.isActive });
      toast.success(agent.isActive ? 'ปิดการใช้งานเจ้ามือแล้ว' : 'เปิดการใช้งานเจ้ามือแล้ว');
      await loadAgents();
    } catch (err) {
      toast.error('เกิดข้อผิดพลาด');
    }
  };

  const handleAdjustCredit = async (event) => {
    event.preventDefault();

    const amount = Number(creditForm.amount || 0);
    if (!amount) {
      toast.error('กรุณาระบุจำนวนเครดิต');
      return;
    }

    try {
      await adjustWalletCredit({
        targetUserId: creditTarget._id,
        amount,
        note: creditForm.note,
        reasonCode: amount >= 0 ? 'agent_topup' : 'agent_deduction'
      });
      toast.success('อัปเดตเครดิตเจ้ามือแล้ว');
      closeCreditModal();
      await loadAgents();
    } catch (err) {
      toast.error(err.response?.data?.message || 'อัปเดตเครดิตไม่สำเร็จ');
    }
  };

  const openEdit = (agent) => {
    setEditAgent(agent);
    setForm({
      username: agent.username,
      password: '',
      name: agent.name,
      phone: agent.phone || ''
    });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditAgent(null);
    setForm({ username: '', password: '', name: '', phone: '' });
  };

  const openCreditModal = (agent) => {
    setCreditTarget(agent);
    setCreditForm({ amount: '', note: '' });
    setShowCreditModal(true);
  };

  const closeCreditModal = () => {
    setCreditTarget(null);
    setCreditForm({ amount: '', note: '' });
    setShowCreditModal(false);
  };

  const filteredAgents = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    if (!keyword) return agents;
    return agents.filter((agent) =>
      agent.name?.toLowerCase().includes(keyword) ||
      agent.username?.toLowerCase().includes(keyword) ||
      agent.phone?.toLowerCase().includes(keyword)
    );
  }, [agents, search]);

  const overviewCards = useMemo(() => {
    const activeCount = agents.filter((agent) => agent.isActive).length;
    const totalMembers = agents.reduce((sum, agent) => sum + Number(agent.customerCount || 0), 0);
    const totalCredit = agents.reduce((sum, agent) => sum + Number(agent.creditBalance || 0), 0);
    const totalSales = agents.reduce((sum, agent) => sum + Number(agent.totalAmount || 0), 0);

    return [
      { label: copy.overviewCards.totalAgents.label, value: agents.length, hint: copy.overviewCards.totalAgents.hint(activeCount) },
      { label: copy.overviewCards.totalMembers.label, value: money(totalMembers), hint: copy.overviewCards.totalMembers.hint },
      { label: copy.overviewCards.totalCredit.label, value: `${money(totalCredit)} บาท`, hint: copy.overviewCards.totalCredit.hint },
      { label: copy.overviewCards.totalSales.label, value: `${money(totalSales)} บาท`, hint: copy.overviewCards.totalSales.hint }
    ];
  }, [agents]);

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
          <span>{copy.filteredCount}</span>
          <strong>{filteredAgents.length}</strong>
          <small>{copy.activeCount(agents.filter((agent) => agent.isActive).length)}</small>
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
            <button className="btn btn-secondary" onClick={loadAgents}>{adminCopy.common.refresh}</button>
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
              type="text"
              className="form-input"
              placeholder={copy.searchPlaceholder}
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>
        </div>

        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>{copy.columns.name}</th>
                <th>{copy.columns.username}</th>
                <th>{copy.columns.phone}</th>
                <th>{copy.columns.members}</th>
                <th>{copy.columns.credit}</th>
                <th>{copy.columns.sales}</th>
                <th>{copy.columns.status}</th>
                <th>{copy.columns.actions}</th>
              </tr>
            </thead>
            <tbody>
              {filteredAgents.length === 0 ? (
                <tr>
                  <td colSpan="8" className="text-center text-muted" style={{ padding: 40 }}>{copy.empty}</td>
                </tr>
              ) : (
                filteredAgents.map((agent) => (
                  <tr key={agent._id}>
                    <td style={{ fontWeight: 700 }}>{agent.name}</td>
                    <td>{agent.username}</td>
                    <td>{agent.phone || '-'}</td>
                    <td>{money(agent.customerCount || 0)}</td>
                    <td>{money(agent.creditBalance || 0)} บาท</td>
                    <td>{money(agent.totalAmount || 0)} บาท</td>
                    <td>
                      <button
                        type="button"
                        className={`badge ${agent.isActive ? 'badge-success' : 'badge-danger'} agent-status-toggle`}
                        onClick={() => handleToggleActive(agent)}
                      >
                        {getUserStatusLabel(agent.isActive ? 'active' : 'inactive')}
                      </button>
                    </td>
                    <td>
                      <div className="ops-actions">
                        <button className="btn btn-secondary btn-sm" onClick={() => openCreditModal(agent)}>
                          <FiDollarSign />
                          {copy.credit}
                        </button>
                        <button className="btn btn-secondary btn-sm" onClick={() => openEdit(agent)}>
                          <FiEdit2 />
                          {copy.edit}
                        </button>
                        <button className="btn btn-danger btn-sm" onClick={() => handleDelete(agent)}>
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
              <div className="ui-eyebrow">{copy.operationsEyebrow}</div>
              <h3 className="card-title">{copy.operationsTitle}</h3>
            </div>
          </div>

          <div className="ops-stack">
            <div className="ops-stat-row">
              <span><FiShield style={{ marginRight: 8 }} />{copy.controlAccounts}</span>
              <strong>{copy.controlAccountsHint}</strong>
            </div>
            <div className="ops-stat-row">
              <span><FiUsers style={{ marginRight: 8 }} />{copy.memberLoad}</span>
              <strong>{copy.memberLoadHint(money(agents.reduce((sum, agent) => sum + Number(agent.customerCount || 0), 0)))}</strong>
            </div>
          </div>
        </section>

        <section className="card ops-section">
          <div className="ui-panel-head">
            <div>
              <div className="ui-eyebrow">{copy.walletEyebrow}</div>
              <h3 className="card-title">{copy.walletTitle}</h3>
            </div>
          </div>

          <div className="ops-stack">
            <div className="ops-feed-row">
              <div>
                <strong>{copy.walletTotal}</strong>
                <div className="ops-feed-meta">{copy.walletSource}</div>
              </div>
              <div className="ops-feed-right">
                <strong>{money(agents.reduce((sum, agent) => sum + Number(agent.creditBalance || 0), 0))} บาท</strong>
                <span className="ops-feed-meta">{copy.walletBalance}</span>
              </div>
            </div>
            <p className="ops-table-note">{copy.walletHint}</p>
          </div>
        </section>
      </section>

      <Modal isOpen={showModal} onClose={closeModal} title={editAgent ? copy.editTitle : copy.createTitle}>
        <form onSubmit={handleSubmit}>
          {!editAgent ? (
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
            <label className="form-label">{editAgent ? copy.passwordOptional : copy.passwordRequired}</label>
            <input
              className="form-input"
              type="password"
              value={form.password}
              onChange={(event) => setForm({ ...form, password: event.target.value })}
              required={!editAgent}
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

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={closeModal}>{adminCopy.common.cancel}</button>
            <button type="submit" className="btn btn-primary">{editAgent ? adminCopy.common.saveChanges : copy.createSubmit}</button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={showCreditModal} onClose={closeCreditModal} title={copy.creditModalTitle(creditTarget?.name)}>
        <form onSubmit={handleAdjustCredit}>
          <div className="form-group">
            <label className="form-label">{copy.currentBalance}</label>
            <input className="form-input" value={`${money(creditTarget?.creditBalance || 0)} บาท`} disabled />
          </div>

          <div className="form-group">
            <label className="form-label">{copy.adjustAmount}</label>
            <input
              className="form-input"
              type="number"
              step="0.01"
              value={creditForm.amount}
              onChange={(event) => setCreditForm({ ...creditForm, amount: event.target.value })}
              placeholder={copy.adjustPlaceholder}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">{copy.noteLabel}</label>
            <textarea
              className="form-input"
              rows="4"
              value={creditForm.note}
              onChange={(event) => setCreditForm({ ...creditForm, note: event.target.value })}
              placeholder={copy.notePlaceholder}
            />
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={closeCreditModal}>{adminCopy.common.cancel}</button>
            <button type="submit" className="btn btn-primary">{copy.saveCredit}</button>
          </div>
        </form>
      </Modal>

      <style>{`
        .agent-status-toggle{border:none;cursor:pointer}
      `}</style>
    </div>
  );
};

export default AgentManagement;
