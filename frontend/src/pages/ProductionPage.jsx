import React, { useEffect, useState } from 'react';
import { productionAPI, employeeAPI } from '../services/api';
import { Table, Badge, Button, Modal, Input, Select, PageHeader, StatCard } from '../components/common';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

const defaultForm = {
  employee: '',
  date: format(new Date(), 'yyyy-MM-dd'),
  loom_number: '',
  design: '',
  meter_woven: '',
  defects: '0',
  work_hours: '8',
  quality_grade: 'A',
};

export default function ProductionPage() {
  const [productions, setProductions] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState({ open: false, mode: 'create', data: null });
  const [form, setForm] = useState(defaultForm);
  const [saving, setSaving] = useState(false);
  const [dateFilter, setDateFilter] = useState(format(new Date(), 'yyyy-MM-dd'));

  const load = async () => {
    setLoading(true);
    try {
      const [prodRes, empRes, sumRes] = await Promise.all([
        productionAPI.list({ date: dateFilter }),
        employeeAPI.list({ status: 'active', page_size: 100 }),
        productionAPI.dailySummary(dateFilter),
      ]);
      setProductions(prodRes.data.results || prodRes.data);
      setEmployees(empRes.data.results || empRes.data);
      setSummary(sumRes.data);
    } catch {
      toast.error('Failed to load production data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [dateFilter]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (modal.mode === 'create') {
        await productionAPI.create(form);
        toast.success('Production record added!');
      } else {
        await productionAPI.update(modal.data.id, form);
        toast.success('Production updated!');
      }
      setModal(m => ({ ...m, open: false }));
      load();
    } catch (err) {
      toast.error('Failed to save production');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (prod) => {
    if (!window.confirm('Delete this record?')) return;
    try {
      await productionAPI.delete(prod.id);
      toast.success('Deleted');
      load();
    } catch { toast.error('Failed to delete'); }
  };

  const openCreate = () => {
    setForm({ ...defaultForm, date: dateFilter });
    setModal({ open: true, mode: 'create', data: null });
  };

  const openEdit = (prod) => {
    setForm({
      employee: prod.employee,
      date: prod.date,
      loom_number: prod.loom_number,
      design: prod.design,
      meter_woven: String(prod.meter_woven),
      defects: String(prod.defects),
      work_hours: String(prod.work_hours),
      quality_grade: prod.quality_grade,
    });
    setModal({ open: true, mode: 'edit', data: prod });
  };

  const columns = [
    { key: 'employee_id_code', label: 'Emp ID' },
    { key: 'employee_name', label: 'Name', render: v => <span className="font-medium">{v}</span> },
    { key: 'loom_number', label: 'Loom #' },
    { key: 'design', label: 'Design' },
    { key: 'meter_woven', label: 'Meters', render: v => <span className="font-semibold text-blue-600">{v}m</span> },
    { key: 'defects', label: 'Defects', render: v => <Badge color={v > 0 ? 'red' : 'green'}>{v}</Badge> },
    { key: 'work_hours', label: 'Hours' },
    { key: 'quality_grade', label: 'Grade', render: v => <Badge color={v === 'A' ? 'green' : v === 'B' ? 'yellow' : 'red'}>Grade {v}</Badge> },
    {
      key: 'actions', label: '',
      render: (_, row) => (
        <div className="flex gap-1">
          <Button size="sm" variant="outline" onClick={() => openEdit(row)}>Edit</Button>
          <Button size="sm" variant="danger" onClick={() => handleDelete(row)}>Del</Button>
        </div>
      )
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader title="Production Tracking" subtitle="Daily weaver production records">
        <div className="flex items-center gap-3">
          <input
            type="date"
            value={dateFilter}
            onChange={e => setDateFilter(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
          />
          <Button onClick={openCreate}>+ Add Record</Button>
        </div>
      </PageHeader>

      {/* Summary */}
      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard title="Total Meters" value={`${(summary.total_meters || 0).toFixed(1)}m`} icon="🧵" color="blue" />
          <StatCard title="Avg per Employee" value={`${(summary.avg_meters || 0).toFixed(1)}m`} icon="📊" color="purple" />
          <StatCard title="Employees Working" value={summary.total_employees || 0} icon="👷" color="green" />
          <StatCard title="Total Defects" value={summary.total_defects || 0} icon="⚠️" color="red" />
        </div>
      )}

      <div className="bg-white rounded-xl border shadow-sm p-1">
        <Table columns={columns} data={productions} loading={loading} emptyMessage="No production records for this date" />
      </div>

      <Modal
        open={modal.open}
        onClose={() => setModal(m => ({ ...m, open: false }))}
        title={modal.mode === 'create' ? 'Add Production Record' : 'Edit Record'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Select
            label="Employee"
            value={form.employee}
            onChange={e => setForm(f => ({ ...f, employee: e.target.value }))}
            required
          >
            <option value="">Select Employee</option>
            {employees.map(emp => (
              <option key={emp.id} value={emp.id}>{emp.employee_id} - {emp.name}</option>
            ))}
          </Select>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Date" type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} required />
            <Input label="Loom Number" value={form.loom_number} onChange={e => setForm(f => ({ ...f, loom_number: e.target.value }))} required />
          </div>
          <Input label="Design" value={form.design} onChange={e => setForm(f => ({ ...f, design: e.target.value }))} required />
          <div className="grid grid-cols-2 gap-4">
            <Input label="Meters Woven" type="number" step="0.01" value={form.meter_woven} onChange={e => setForm(f => ({ ...f, meter_woven: e.target.value }))} required />
            <Input label="Work Hours" type="number" step="0.5" min="0" max="24" value={form.work_hours} onChange={e => setForm(f => ({ ...f, work_hours: e.target.value }))} required />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Defects" type="number" min="0" value={form.defects} onChange={e => setForm(f => ({ ...f, defects: e.target.value }))} />
            <Select label="Quality Grade" value={form.quality_grade} onChange={e => setForm(f => ({ ...f, quality_grade: e.target.value }))}>
              <option value="A">Grade A</option>
              <option value="B">Grade B</option>
              <option value="C">Grade C</option>
            </Select>
          </div>
          <div className="flex gap-3 pt-2">
            <Button type="submit" loading={saving} className="flex-1">Save</Button>
            <Button variant="secondary" onClick={() => setModal(m => ({ ...m, open: false }))} className="flex-1">Cancel</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
