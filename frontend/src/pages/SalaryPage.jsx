import React, { useEffect, useState } from 'react';
import { salaryAPI } from '../services/api';
import { Table, Badge, Button, PageHeader, StatCard } from '../components/common';
import toast from 'react-hot-toast';

const STATUS_COLORS = { pending: 'gray', calculated: 'blue', paid: 'green' };

export default function SalaryPage() {
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [salaries, setSalaries] = useState([]);
  const [total, setTotal] = useState(null);
  const [loading, setLoading] = useState(true);
  const [calculating, setCalculating] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const [salRes, totRes] = await Promise.all([
        salaryAPI.list({ month, year }),
        salaryAPI.monthlyTotal(month, year),
      ]);
      setSalaries(salRes.data.results || salRes.data);
      setTotal(totRes.data);
    } catch {
      toast.error('Failed to load salary data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [month, year]);

  const handleCalculate = async () => {
    setCalculating(true);
    try {
      await salaryAPI.calculateMonth(month, year);
      toast.success('Salary calculated for all employees!');
      load();
    } catch {
      toast.error('Calculation failed');
    } finally {
      setCalculating(false);
    }
  };

  const handleMarkPaid = async (salary) => {
    try {
      await salaryAPI.markPaid(salary.id);
      toast.success(`Salary marked as paid for ${salary.employee_name}`);
      load();
    } catch {
      toast.error('Failed to update status');
    }
  };

  const columns = [
    { key: 'employee_id_code', label: 'Emp ID' },
    { key: 'employee_name', label: 'Name', render: v => <span className="font-medium">{v}</span> },
    { key: 'total_meters', label: 'Meters', render: v => `${parseFloat(v || 0).toFixed(1)}m` },
    { key: 'rate_per_meter', label: 'Rate', render: v => `₹${v}` },
    { key: 'base_salary', label: 'Base Salary', render: v => <span className="font-semibold">₹{parseFloat(v || 0).toFixed(2)}</span> },
    { key: 'bonus', label: 'Bonus', render: v => `₹${parseFloat(v || 0).toFixed(2)}` },
    { key: 'deductions', label: 'Deductions', render: v => <span className="text-red-600">-₹{parseFloat(v || 0).toFixed(2)}</span> },
    { key: 'total_salary', label: 'Total', render: v => <span className="text-green-700 font-bold">₹{parseFloat(v || 0).toFixed(2)}</span> },
    { key: 'attendance_days', label: 'Days' },
    { key: 'status', label: 'Status', render: v => <Badge color={STATUS_COLORS[v]}>{v}</Badge> },
    {
      key: 'actions', label: '',
      render: (_, row) => row.status !== 'paid' ? (
        <Button size="sm" variant="success" onClick={() => handleMarkPaid(row)}>Mark Paid</Button>
      ) : <span className="text-xs text-green-600">✓ Paid</span>
    },
  ];

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  return (
    <div className="space-y-6">
      <PageHeader title="Salary Management" subtitle="Monthly salary calculation and payments">
        <div className="flex items-center gap-3">
          <select
            value={month}
            onChange={e => setMonth(Number(e.target.value))}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
          >
            {months.map((m, i) => (
              <option key={i} value={i + 1}>{m}</option>
            ))}
          </select>
          <select
            value={year}
            onChange={e => setYear(Number(e.target.value))}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
          >
            {[2023, 2024, 2025, 2026].map(y => <option key={y}>{y}</option>)}
          </select>
          <Button onClick={handleCalculate} loading={calculating} variant="success">
            ⚡ Calculate Salary
          </Button>
        </div>
      </PageHeader>

      {/* Totals */}
      {total && (
        <div className="grid grid-cols-2 gap-4">
          <StatCard title="Total Payroll" value={`₹${(total.total || 0).toLocaleString()}`} icon="💰" color="blue" />
          <StatCard title="Paid" value={`₹${(total.paid || 0).toLocaleString()}`} icon="✅" color="green" />
        </div>
      )}

      <div className="bg-white rounded-xl border shadow-sm p-1">
        <Table columns={columns} data={salaries} loading={loading} emptyMessage="No salary records. Click 'Calculate Salary' to generate." />
      </div>
    </div>
  );
}
