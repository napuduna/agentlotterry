import { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { FiDollarSign, FiEdit2, FiPlus, FiSearch, FiShield, FiTrash2, FiUsers } from 'react-icons/fi';
import Modal from '../../components/Modal';
import PageSkeleton from '../../components/PageSkeleton';
import { adjustWalletCredit, createAgent, deleteAgent, getAgents, updateAgent } from '../../services/api';

const money = (value) => Number(value || 0).toLocaleString('th-TH');

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
      { label: 'เจ้ามือทั้งหมด', value: agents.length, hint: `ใช้งานอยู่ ${activeCount} คน` },
      { label: 'สมาชิกในสายงาน', value: money(totalMembers), hint: 'สมาชิกที่ถูกผูกกับเจ้ามือทั้งหมด' },
      { label: 'เครดิตเจ้ามือรวม', value: `${money(totalCredit)} บาท`, hint: 'ยอดคงเหลือที่ผู้ดูแลระบบควบคุม' },
      { label: 'ยอดขายรวม', value: `${money(totalSales)} บาท`, hint: 'ยอดแทงสะสมของทุกบัญชีเจ้ามือ' }
    ];
  }, [agents]);

  if (loading) {
    return <PageSkeleton statCount={4} rows={6} sidebar={false} />;
  }

  return (
    <div className="ops-page animate-fade-in">
      <section className="ops-hero">
        <div className="ops-hero-copy">
          <span className="ui-eyebrow">ศูนย์ควบคุมผู้ดูแลระบบ</span>
          <h1 className="page-title">จัดการเจ้ามือ</h1>
          <p className="page-subtitle">สร้างบัญชีเจ้ามือ ดูแลเครดิต และควบคุมสถานะการใช้งานจากหน้าจอเดียว</p>
        </div>

        <div className="ops-hero-side">
          <span>จำนวนที่แสดงหลังกรอง</span>
          <strong>{filteredAgents.length}</strong>
          <small>ใช้งานอยู่ {agents.filter((agent) => agent.isActive).length} คน</small>
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
            <div className="ui-eyebrow">รายชื่อบัญชี</div>
            <h3 className="card-title">บัญชีเจ้ามือ</h3>
            <p className="ops-table-note">ค้นหาตามชื่อ ชื่อผู้ใช้ หรือเบอร์โทร ก่อนจัดการบัญชีรายคน</p>
          </div>
          <div className="ops-actions">
            <button className="btn btn-secondary" onClick={loadAgents}>รีเฟรช</button>
            <button className="btn btn-primary" onClick={() => setShowModal(true)}>
              <FiPlus />
              เพิ่มเจ้ามือ
            </button>
          </div>
        </div>

        <div className="ops-toolbar mb-md">
          <div className="ops-search">
            <FiSearch />
            <input
              type="text"
              className="form-input"
              placeholder="ค้นหาเจ้ามือตามชื่อ ชื่อผู้ใช้ หรือเบอร์โทร"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>
        </div>

        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>เจ้ามือ</th>
                <th>ชื่อผู้ใช้</th>
                <th>เบอร์โทร</th>
                <th>สมาชิก</th>
                <th>เครดิต</th>
                <th>ยอดขาย</th>
                <th>สถานะ</th>
                <th>การจัดการ</th>
              </tr>
            </thead>
            <tbody>
              {filteredAgents.length === 0 ? (
                <tr>
                  <td colSpan="8" className="text-center text-muted" style={{ padding: 40 }}>ไม่พบเจ้ามือตามคำค้นปัจจุบัน</td>
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
                        {agent.isActive ? 'ใช้งาน' : 'ปิดใช้งาน'}
                      </button>
                    </td>
                    <td>
                      <div className="ops-actions">
                        <button className="btn btn-secondary btn-sm" onClick={() => openCreditModal(agent)}>
                          <FiDollarSign />
                          เครดิต
                        </button>
                        <button className="btn btn-secondary btn-sm" onClick={() => openEdit(agent)}>
                          <FiEdit2 />
                          แก้ไข
                        </button>
                        <button className="btn btn-danger btn-sm" onClick={() => handleDelete(agent)}>
                          <FiTrash2 />
                          ปิดใช้งาน
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
              <div className="ui-eyebrow">ภาพรวมการดูแล</div>
              <h3 className="card-title">บันทึกการใช้งาน</h3>
            </div>
          </div>

          <div className="ops-stack">
            <div className="ops-stat-row">
              <span><FiShield style={{ marginRight: 8 }} />ควบคุมบัญชี</span>
              <strong>เปิดหรือปิดการใช้งานได้ในคลิกเดียว</strong>
            </div>
            <div className="ops-stat-row">
              <span><FiUsers style={{ marginRight: 8 }} />ภาระสมาชิก</span>
              <strong>มีสมาชิกอยู่ในสายงาน {money(agents.reduce((sum, agent) => sum + Number(agent.customerCount || 0), 0))} คน</strong>
            </div>
          </div>
        </section>

        <section className="card ops-section">
          <div className="ui-panel-head">
            <div>
              <div className="ui-eyebrow">กระเป๋าเครดิต</div>
              <h3 className="card-title">สรุปเครดิต</h3>
            </div>
          </div>

          <div className="ops-stack">
            <div className="ops-feed-row">
              <div>
                <strong>เครดิตเจ้ามือรวม</strong>
                <div className="ops-feed-meta">ติดตามผ่านสมุดเครดิตกลาง</div>
              </div>
              <div className="ops-feed-right">
                <strong>{money(agents.reduce((sum, agent) => sum + Number(agent.creditBalance || 0), 0))} บาท</strong>
                <span className="ops-feed-meta">ยอดคงเหลือปัจจุบัน</span>
              </div>
            </div>
            <p className="ops-table-note">ใช้ปุ่มเครดิตในแต่ละแถวเมื่อต้องการเพิ่มหรือลดยอด โดยไม่ต้องแก้ไขข้อมูลโปรไฟล์</p>
          </div>
        </section>
      </section>

      <Modal isOpen={showModal} onClose={closeModal} title={editAgent ? 'แก้ไขเจ้ามือ' : 'สร้างเจ้ามือ'}>
        <form onSubmit={handleSubmit}>
          {!editAgent ? (
            <div className="form-group">
              <label className="form-label">ชื่อผู้ใช้ *</label>
              <input
                className="form-input"
                value={form.username}
                onChange={(event) => setForm({ ...form, username: event.target.value })}
                required
              />
            </div>
          ) : null}

          <div className="form-group">
            <label className="form-label">{editAgent ? 'รหัสผ่านใหม่ (ไม่บังคับ)' : 'รหัสผ่าน *'}</label>
            <input
              className="form-input"
              type="password"
              value={form.password}
              onChange={(event) => setForm({ ...form, password: event.target.value })}
              required={!editAgent}
            />
          </div>

          <div className="form-group">
            <label className="form-label">ชื่อแสดงผล *</label>
            <input
              className="form-input"
              value={form.name}
              onChange={(event) => setForm({ ...form, name: event.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">เบอร์โทร</label>
            <input
              className="form-input"
              value={form.phone}
              onChange={(event) => setForm({ ...form, phone: event.target.value })}
            />
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={closeModal}>ยกเลิก</button>
            <button type="submit" className="btn btn-primary">{editAgent ? 'บันทึกการเปลี่ยนแปลง' : 'สร้างเจ้ามือ'}</button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={showCreditModal} onClose={closeCreditModal} title={`ปรับเครดิต${creditTarget ? `: ${creditTarget.name}` : ''}`}>
        <form onSubmit={handleAdjustCredit}>
          <div className="form-group">
            <label className="form-label">ยอดคงเหลือปัจจุบัน</label>
            <input className="form-input" value={`${money(creditTarget?.creditBalance || 0)} บาท`} disabled />
          </div>

          <div className="form-group">
            <label className="form-label">จำนวนที่ต้องการปรับ</label>
            <input
              className="form-input"
              type="number"
              step="0.01"
              value={creditForm.amount}
              onChange={(event) => setCreditForm({ ...creditForm, amount: event.target.value })}
              placeholder="หากต้องการหักเครดิต ให้ใส่ค่าติดลบ"
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">หมายเหตุ</label>
            <textarea
              className="form-input"
              rows="4"
              value={creditForm.note}
              onChange={(event) => setCreditForm({ ...creditForm, note: event.target.value })}
              placeholder="ระบุหมายเหตุเพิ่มเติมได้"
            />
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={closeCreditModal}>ยกเลิก</button>
            <button type="submit" className="btn btn-primary">บันทึกการปรับเครดิต</button>
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
