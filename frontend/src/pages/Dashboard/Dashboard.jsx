import { FiUsers, FiCalendar, FiActivity, FiDollarSign } from 'react-icons/fi'
import { useQuery } from '@tanstack/react-query'
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend
} from 'recharts'
import { reportsAPI, productionAPI } from '../../services/api'
import StatCard from '../../components/common/StatCard'

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6']

export default function Dashboard() {
  const { data: stats } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: async () => (await reportsAPI.dashboard()).data,
    refetchInterval: 60000,
  })

  const { data: prodData } = useQuery({
    queryKey: ['production-dashboard'],
    queryFn: async () => (await productionAPI.dashboard()).data,
    refetchInterval: 60000,
  })

  const attendancePie = stats ? [
    { name: 'Present', value: stats.today_present },
    { name: 'Absent', value: stats.today_absent },
  ] : []

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500 text-sm mt-1">Live overview of your weaving factory</p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Employees" value={stats?.total_employees} icon={FiUsers} color="blue" />
        <StatCard title="Today Present" value={stats?.today_present} subtitle={`${stats?.today_absent} absent`} icon={FiCalendar} color="green" />
        <StatCard title="Today Production" value={stats?.today_production_meters?.toFixed(1) + ' m'} icon={FiActivity} color="yellow" />
        <StatCard title="Monthly Production" value={stats?.monthly_production_meters?.toFixed(0) + ' m'} icon={FiActivity} color="purple" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Weekly Trend */}
        <div className="card lg:col-span-2">
          <h3 className="font-semibold text-gray-900 mb-4">Production Trend (Last 7 Days)</h3>
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={prodData?.weekly_trend || []}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} tickFormatter={d => d.slice(5)} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip formatter={(v) => [`${v} m`, 'Meters']} />
              <Line type="monotone" dataKey="meters" stroke="#3b82f6" strokeWidth={2} dot={{ r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Attendance Pie */}
        <div className="card">
          <h3 className="font-semibold text-gray-900 mb-4">Today's Attendance</h3>
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie data={attendancePie} cx="50%" cy="50%" innerRadius={60} outerRadius={90} dataKey="value">
                {attendancePie.map((_, i) => <Cell key={i} fill={COLORS[i]} />)}
              </Pie>
              <Legend />
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Top Performers */}
      {prodData?.top_performers?.length > 0 && (
        <div className="card">
          <h3 className="font-semibold text-gray-900 mb-4">Top Performers This Month</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={prodData.top_performers.slice(0, 5)}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="employee__name" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip formatter={(v) => [`${v} m`, 'Meters']} />
              <Bar dataKey="total_meters" fill="#3b82f6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  )
}
