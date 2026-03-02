import React, { useEffect, useState } from 'react';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import { reportsAPI, productionAPI } from '../services/api';
import { StatCard, Spinner, PageHeader } from '../components/common';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

export default function DashboardPage() {
  const [dashboard, setDashboard] = useState(null);
  const [topPerformers, setTopPerformers] = useState([]);
  const [loading, setLoading] = useState(true);

  const now = new Date();

  useEffect(() => {
    const load = async () => {
      try {
        const [dashRes, perfRes] = await Promise.all([
          reportsAPI.dashboard(),
          productionAPI.topPerformers(now.getMonth() + 1, now.getFullYear()),
        ]);
        setDashboard(dashRes.data);
        setTopPerformers(perfRes.data || []);
      } catch {
        toast.error('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) return <Spinner size="lg" />;

  const chartData = dashboard?.daily_chart?.map(d => ({
    date: format(new Date(d.date), 'MMM dd'),
    meters: parseFloat(d.total) || 0,
  })) || [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard"
        subtitle={`Overview for ${format(now, 'MMMM yyyy')}`}
      />

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        <StatCard
          title="Total Employees"
          value={dashboard?.total_employees || 0}
          icon="👷"
          color="blue"
        />
        <StatCard
          title="Present Today"
          value={dashboard?.today_present || 0}
          icon="✅"
          color="green"
        />
        <StatCard
          title="Today's Production"
          value={`${(dashboard?.today_production || 0).toFixed(1)}m`}
          icon="🧵"
          color="purple"
        />
        <StatCard
          title="Monthly Production"
          value={`${(dashboard?.monthly_production || 0).toFixed(0)}m`}
          icon="📈"
          color="orange"
        />
        <StatCard
          title="Monthly Salary"
          value={`₹${(dashboard?.monthly_salary || 0).toLocaleString()}`}
          icon="💰"
          color="red"
        />
      </div>

      {/* Charts Row */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Production Chart */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-base font-semibold text-gray-800 mb-4">Daily Production (Last 30 Days)</h2>
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={240}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip formatter={(v) => [`${v}m`, 'Meters']} />
                <Line
                  type="monotone"
                  dataKey="meters"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-60 text-gray-400">
              No production data available
            </div>
          )}
        </div>

        {/* Top Performer */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-base font-semibold text-gray-800 mb-4">🏆 Top Performers</h2>
          <div className="space-y-3">
            {topPerformers.slice(0, 5).map((p, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                  i === 0 ? 'bg-yellow-400 text-yellow-900' :
                  i === 1 ? 'bg-gray-300 text-gray-700' :
                  i === 2 ? 'bg-orange-300 text-orange-800' :
                  'bg-blue-100 text-blue-700'
                }`}>
                  {i + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate">{p.employee__name}</p>
                  <p className="text-xs text-gray-500">{p.employee__employee_id}</p>
                </div>
                <span className="text-sm font-semibold text-blue-600">
                  {parseFloat(p.total_meters).toFixed(1)}m
                </span>
              </div>
            ))}
            {topPerformers.length === 0 && (
              <p className="text-center text-gray-400 text-sm py-8">No data</p>
            )}
          </div>
        </div>
      </div>

      {/* Top Performers Bar Chart */}
      {topPerformers.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-base font-semibold text-gray-800 mb-4">Employee Performance Comparison</h2>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={topPerformers.slice(0, 8).map(p => ({
              name: p.employee__name?.split(' ')[0],
              meters: parseFloat(p.total_meters).toFixed(1),
            }))}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="meters" fill="#3b82f6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
