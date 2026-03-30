import { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { FiEdit2, FiPlus, FiSearch, FiTrash2, FiUserCheck, FiUsers } from 'react-icons/fi';
import Modal from '../../components/Modal';
import PageSkeleton from '../../components/PageSkeleton';
import {
  createAdminCustomer,
  deleteAdminCustomer,
  getAdminCustomers,
  getAgents,
  updateAdminCustomer
} from '../../services/api';

const CustomerManagement = () => {
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

    return [
      { label: 'สมาชิกทั้งหมด', value: customers.length, hint: `ใช้งานอยู่ ${activeCount} บัญชี` },
      { label: 'เจ้ามือที่ดูแล', value: assignedAgentCount, hint: 'จำนวนเจ้ามือที่มีสมาชิกผูกอยู่' },
      { label: 'รายการที่แสดง', value: filteredCustomers.length, hint: 'หลังค้นหาและกรองเจ้ามือ' },
      { label: 'ยังไม่ถูกมอบหมาย', value: unassignedCount, hint: 'สมาชิกที่ยังไม่มีเจ้ามือดูแล' }
    ];
  }, [customers, filteredCustomers.length]);

  if (loading) {
    return <PageSkeleton statCount={4} rows={6} sidebar={false} />;
  }

  return (
    <div className="ops-page animate-fade-in">
      <section className="ops-hero">
        <div className="ops-hero-copy">
          <span className="ui-eyebrow">สมุดรายชื่อผู้ดูแลระบบ</span>
          <h1 className="page-title">จัดการสมาชิก</h1>
          <p className="page-subtitle">ดูแลสมาชิกทั้งระบบ เปลี่ยนเจ้าของบัญชี และจัดระเบียบสิทธิ์การใช้งานก่อนส่งต่อให้ฝั่งเจ้ามือ</p>
        </div>

        <div className="ops-hero-side">
          <span>ตัวกรองปัจจุบัน</span>
          <strong>{filterAgent ? 'กรองเฉพาะเจ้ามือ' : 'ทุกเจ้ามือ'}</strong>
          <small>แสดงสมาชิก {filteredCustomers.length} รายการ</small>
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
            <h3 className="card-title">บัญชีสมาชิก</h3>
            <p className="ops-table-note">เลือกกรองตามเจ้ามือก่อน แล้วค่อยค้นหาสมาชิกรายคนเพื่อแก้ไขหรือปิดการใช้งาน</p>
          </div>
          <div className="ops-actions">
            <button className="btn btn-secondary" onClick={loadData}>รีเฟรช</button>
            <button className="btn btn-primary" onClick={() => setShowModal(true)}>
              <FiPlus />
              เพิ่มสมาชิก
            </button>
          </div>
        </div>

        <div className="ops-toolbar mb-md">
          <div className="ops-search">
            <FiSearch />
            <input
              className="form-input"
              placeholder="ค้นหาจากชื่อสมาชิก ชื่อผู้ใช้ เบอร์โทร หรือชื่อเจ้ามือ"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>

          <select className="form-select" value={filterAgent} onChange={(event) => setFilterAgent(event.target.value)} style={{ width: 240 }}>
            <option value="">ทุกเจ้ามือ</option>
            {agents.map((agent) => (
              <option key={agent._id} value={agent._id}>{agent.name}</option>
            ))}
          </select>
        </div>

        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>สมาชิก</th>
                <th>ชื่อผู้ใช้</th>
                <th>เจ้ามือผู้ดูแล</th>
                <th>เบอร์โทร</th>
                <th>สถานะ</th>
                <th>การจัดการ</th>
              </tr>
            </thead>
            <tbody>
              {filteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan="6" className="text-center text-muted" style={{ padding: 40 }}>ไม่พบสมาชิกตามตัวกรองปัจจุบัน</td>
                </tr>
              ) : (
                filteredCustomers.map((customer) => (
                  <tr key={customer._id}>
                    <td style={{ fontWeight: 700 }}>{customer.name}</td>
                    <td>{customer.username}</td>
                    <td>{customer.agentId?.name || '-'}</td>
                    <td>{customer.phone || '-'}</td>
                    <td>
                      <span className={`badge ${customer.isActive ? 'badge-success' : 'badge-danger'}`}>
                        {customer.isActive ? 'ใช้งาน' : 'ปิดใช้งาน'}
                      </span>
                    </td>
                    <td>
                      <div className="ops-actions">
                        <button className="btn btn-secondary btn-sm" onClick={() => openEdit(customer)}>
                          <FiEdit2 />
                          แก้ไข
                        </button>
                        <button className="btn btn-danger btn-sm" onClick={() => handleDelete(customer)}>
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
              <div className="ui-eyebrow">การมอบหมายดูแล</div>
              <h3 className="card-title">ภาพรวมการดูแล</h3>
            </div>
          </div>

          <div className="ops-stack">
            <div className="ops-stat-row">
              <span><FiUsers style={{ marginRight: 8 }} />เจ้ามือที่รับผิดชอบ</span>
              <strong>{new Set(customers.map((customer) => customer.agentId?._id || customer.agentId).filter(Boolean)).size}</strong>
            </div>
            <div className="ops-stat-row">
              <span><FiUserCheck style={{ marginRight: 8 }} />สมาชิกที่ใช้งานอยู่</span>
              <strong>{customers.filter((customer) => customer.isActive).length}</strong>
            </div>
          </div>
        </section>

        <section className="card ops-section">
          <div className="ui-panel-head">
            <div>
              <div className="ui-eyebrow">หมายเหตุผู้ดูแลระบบ</div>
              <h3 className="card-title">การแก้ไขโปรไฟล์</h3>
            </div>
          </div>

          <div className="ops-stack">
            <div className="ops-feed-row">
              <div>
                <strong>การเปลี่ยนเจ้าของบัญชี</strong>
                <div className="ops-feed-meta">เมื่อเปลี่ยนเจ้ามือในหน้านี้ ระบบจะอัปเดตความเป็นเจ้าของจากฝั่งผู้ดูแลระบบทันที</div>
              </div>
            </div>
            <p className="ops-table-note">เวลาแก้ไขข้อมูล รหัสผ่านไม่บังคับ เพื่อให้แก้โปรไฟล์ได้โดยไม่ต้องรีเซ็ตรหัสผ่านทุกครั้ง</p>
          </div>
        </section>
      </section>

      <Modal isOpen={showModal} onClose={closeModal} title={editCustomer ? 'แก้ไขสมาชิก' : 'สร้างสมาชิก'}>
        <form onSubmit={handleSubmit}>
          {!editCustomer ? (
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
            <label className="form-label">{editCustomer ? 'รหัสผ่านใหม่ (ไม่บังคับ)' : 'รหัสผ่าน *'}</label>
            <input
              className="form-input"
              type="password"
              value={form.password}
              onChange={(event) => setForm({ ...form, password: event.target.value })}
              required={!editCustomer}
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

          <div className="form-group">
            <label className="form-label">เจ้ามือผู้ดูแล *</label>
            <select
              className="form-select"
              value={form.agentId}
              onChange={(event) => setForm({ ...form, agentId: event.target.value })}
              required
            >
              <option value="">เลือกเจ้ามือ</option>
              {agents.filter((agent) => agent.isActive).map((agent) => (
                <option key={agent._id} value={agent._id}>{agent.name}</option>
              ))}
            </select>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={closeModal}>ยกเลิก</button>
            <button type="submit" className="btn btn-primary">{editCustomer ? 'บันทึกการเปลี่ยนแปลง' : 'สร้างสมาชิก'}</button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default CustomerManagement;
