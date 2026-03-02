import React, { useEffect, useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line
} from 'recharts';
import { reportsAPI, productionAPI } from '../services/api';
import { Table, Badge, Button, PageHeader } from '../components/common';
import toast from 'react-hot-toast';

const STATUS_COLORS = { present: 'green', absent: 'red', not_marked: 'gray', not_calculated: 'gray', calculated: 'blue', paid: 'green' };

export default function ReportsPage() {
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [report, setReport] = useState([]);
  const [monthlyChart, setMonthlyChart] = useState([]);
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState('monthly');
  const [exporting, setExporting] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const [repRes, chartRes] = await Promise.all([
        reportsAPI.monthly(month, year),
        productionAPI.monthlySummary(month, year),
      ]);
      setReport(repRes.data.records || []);
      setMonthlyChart(chartRes.data || []);
    } catch {
      toast.error('Failed to load report');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [month, year]);

  const handleExport = async () => {
    setExporting(true);
    try {
      const res = await reportsAPI.export(month, year, 'csv');
      const url = URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement('a');
      a.href = url;
      a.download = `weaver_report_${month}_${year}.csv`;
      a.click();
      toast.success('Report downloaded!');
    } catch {
      toast.error('Export failed');
    } finally {
      setExporting(false);
    }
  };

  const columns = [
    { key: 'employee_id', label: 'Emp ID' },
    { key: 'name', label: 'Name', render: v => <span className="font-medium">{v}</span> },
    { key: 'skill_level', label: 'Skill', render: v => <Badge color={{ beginner: 'blue', intermediate: 'purple', expert: 'orange' }[v]}>{v}</Badge> },
    { key: 'total_meters', label: 'Meters', render: v => <span className="font-bold text-blue-600">{v.toFixed(1)}m</span> },
    { key: 'attendance_days', label: 'Present Days' },
    { key: 'total_defects', label: 'Defects', render: v => <Badge color={v > 0 ? 'red' : 'green'}>{v}</Badge> },
    { key: 'salary', label: 'Salary', render: v => <span className="font-semibold text-green-700">₹{v.toFixed(2)}</span> },
    { key: 'salary_status', label: 'Salary Status', render: v => <Badge color={STATUS_COLORS[v] || 'gray'}>{v.replace('_', ' ')}</Badge> },
  ];

  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

  return (
    <div className="space-y-6">
      <PageHeader title="Reports" subtitle="Monthly performance and production reports">
        <div className="flex items-center gap-3">
          <select
            value={month}
            onChange={e => setMonth(Number(e.target.value))}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
          >
            {months.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
          </select>
          <select
            value={year}
            onChange={e => setYear(Number(e.target.value))}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
          >
            {[2023, 2024, 2025, 2026].map(y => <option key={y}>{y}</option>)}
          </select>
          <Button onClick={handleExport} loading={exporting} variant="outline">
            ⬇ Export CSV
          </Button>
        </div>
      </PageHeader>

      {/* Charts */}
      {monthlyChart.length > 0 && (
        <div className="bg-white rounded-xl border shadow-sm p-6">
          <h2 className="text-base font-semibold text-gray-800 mb-4">Daily Production Chart</h2>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={monthlyChart.map(d => ({
              day: new Date(d.date).getDate(),
              meters: parseFloat(d.total_meters).toFixed(1),
              employees: d.employee_count,
            }))}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="day" label={{ value: 'Day', position: 'insideBottom', offset: -5 }} tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip formatter={(v, name) => [name === 'meters' ? `${v}m` : v, name === 'meters' ? 'Meters' : 'Employees']} />
              <Bar dataKey="meters" fill="#3b82f6" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Report Table */}
      <div className="bg-white rounded-xl border shadow-sm">
        <div className="p-4 border-b flex justify-between items-center">
          <h2 className="font-semibold text-gray-800">Monthly Report — {months[month - 1]} {year}</h2>
          <span className="text-sm text-gray-500">{report.length} employees</span>
        </div>
        <div className="p-1">
          <Table columns={columns} data={report} loading={loading} emptyMessage="No report data for this period" />
        </div>
      </div>

      {/* Summary Row */}
      {report.length > 0 && (
        <div className="bg-blue-50 rounded-xl border border-blue-200 p-4">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold text-blue-700">
                {report.reduce((s, r) => s + r.total_meters, 0).toFixed(1)}m
              </p>
              <p className="text-sm text-blue-600">Total Production</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-green-700">
                ₹{report.reduce((s, r) => s + r.salary, 0).toFixed(0)}
              </p>
              <p className="text-sm text-green-600">Total Payroll</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-red-700">
                {report.reduce((s, r) => s + r.total_defects, 0)}
              </p>
              <p className="text-sm text-red-600">Total Defects</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
