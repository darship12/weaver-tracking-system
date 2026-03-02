import React, { useEffect, useState } from 'react';
import { employeeAPI } from '../services/api';
import { Table, Badge, Button, Modal, Input, Select, PageHeader, Spinner } from '../components/common';
import toast from 'react-hot-toast';

const STATUS_COLORS = { active: 'green', inactive: 'red', on_leave: 'yellow' };
const SKILL_COLORS = { beginner: 'blue', intermediate: 'purple', expert: 'orange' };

const defaultForm = {
  employee_id: '',
  name: '',
  phone: '',
  address: '',
  skill_level: 'beginner',
  joining_date: '',
  status: 'active',
  rate_per_meter: '10',
};

export default function EmployeesPage() {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [modal, setModal] = useState({ open: false, mode: 'create', data: null });
  const [form, setForm] = useState(defaultForm);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const [empRes, statRes] = await Promise.all([
        employeeAPI.list({ search }),
        employeeAPI.stats(),
      ]);
      setEmployees(empRes.data.results || empRes.data);
      setStats(statRes.data);
    } catch {
      toast.error('Failed to load employees');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [search]);

  const openCreate = () => {
    setForm(defaultForm);
    setModal({ open: true, mode: 'create', data: null });
  };

  const openEdit = (emp) => {
    setForm({
      employee_id: emp.employee_id,
      name: emp.name,
      phone: emp.phone,
      address: emp.address,
      skill_level: emp.skill_level,
      joining_date: emp.joining_date,
      status: emp.status,
      rate_per_meter: String(emp.rate_per_meter),
    });
    setModal({ open: true, mode: 'edit', data: emp });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (modal.mode === 'create') {
        await employeeAPI.create(form);
        toast.success('Employee created!');
      } else {
        await employeeAPI.update(modal.data.id, form);
        toast.success('Employee updated!');
      }
      setModal(m => ({ ...m, open: false }));
      load();
    } catch (err) {
      const msg = err.response?.data;
      toast.error(typeof msg === 'object' ? JSON.stringify(msg) : 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (emp) => {
    if (!window.confirm(`Delete ${emp.name}?`)) return;
    try {
      await employeeAPI.delete(emp.id);
      toast.success('Employee deleted');
      load();
    } catch {
      toast.error('Failed to delete');
    }
  };

  const columns = [
    { key: 'employee_id', label: 'ID' },
    { key: 'name', label: 'Name', render: (v) => <span className="font-medium">{v}</span> },
    { key: 'phone', label: 'Phone' },
    { key: 'skill_level', label: 'Skill', render: (v) => <Badge color={SKILL_COLORS[v]}>{v}</Badge> },
    { key: 'joining_date', label: 'Joined' },
    { key: 'rate_per_meter', label: 'Rate/m', render: (v) => `₹${v}` },
    { key: 'status', label: 'Status', render: (v) => <Badge color={STATUS_COLORS[v]}>{v}</Badge> },
    {
      key: 'actions', label: 'Actions',
      render: (_, row) => (
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={() => openEdit(row)}>Edit</Button>
          <Button size="sm" variant="danger" onClick={() => handleDelete(row)}>Delete</Button>
        </div>
      )
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader title="Employee Management" subtitle="Manage all weaver employees">
        <Button onClick={openCreate}>+ Add Employee</Button>
      </PageHeader>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Total', value: stats.total, color: 'text-blue-600' },
            { label: 'Active', value: stats.active, color: 'text-green-600' },
            { label: 'Beginner', value: stats.by_skill.beginner, color: 'text-gray-600' },
            { label: 'Expert', value: stats.by_skill.expert, color: 'text-purple-600' },
          ].map(s => (
            <div key={s.label} className="bg-white rounded-xl border p-4 text-center shadow-sm">
              <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
              <p className="text-xs text-gray-500 mt-1">{s.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Search */}
      <div className="bg-white rounded-xl border p-4 shadow-sm">
        <input
          type="text"
          placeholder="Search by name, ID, or phone..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border shadow-sm p-1">
        <Table columns={columns} data={employees} loading={loading} />
      </div>

      {/* Modal */}
      <Modal
        open={modal.open}
        onClose={() => setModal(m => ({ ...m, open: false }))}
        title={modal.mode === 'create' ? 'Add New Employee' : 'Edit Employee'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Employee ID"
              value={form.employee_id}
              onChange={e => setForm(f => ({ ...f, employee_id: e.target.value }))}
              placeholder="EMP001"
              required
            />
            <Input
              label="Full Name"
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              required
            />
          </div>
          <Input
            label="Phone"
            value={form.phone}
            onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
            required
          />
          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700">Address</label>
            <textarea
              value={form.address}
              onChange={e => setForm(f => ({ ...f, address: e.target.value }))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={2}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Skill Level"
              value={form.skill_level}
              onChange={e => setForm(f => ({ ...f, skill_level: e.target.value }))}
            >
              <option value="beginner">Beginner</option>
              <option value="intermediate">Intermediate</option>
              <option value="expert">Expert</option>
            </Select>
            <Select
              label="Status"
              value={form.status}
              onChange={e => setForm(f => ({ ...f, status: e.target.value }))}
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="on_leave">On Leave</option>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Joining Date"
              type="date"
              value={form.joining_date}
              onChange={e => setForm(f => ({ ...f, joining_date: e.target.value }))}
              required
            />
            <Input
              label="Rate per Meter (₹)"
              type="number"
              step="0.01"
              value={form.rate_per_meter}
              onChange={e => setForm(f => ({ ...f, rate_per_meter: e.target.value }))}
              required
            />
          </div>
          <div className="flex gap-3 pt-2">
            <Button type="submit" loading={saving} className="flex-1">
              {modal.mode === 'create' ? 'Create Employee' : 'Save Changes'}
            </Button>
            <Button
              variant="secondary"
              onClick={() => setModal(m => ({ ...m, open: false }))}
              className="flex-1"
            >
              Cancel
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
