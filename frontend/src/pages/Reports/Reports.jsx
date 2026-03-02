import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { FiDownload } from 'react-icons/fi'
import { reportsAPI } from '../../services/api'
import toast from 'react-hot-toast'

export default function Reports() {
  const now = new Date()
  const [month, setMonth] = useState(now.getMonth() + 1)
  const [year, setYear] = useState(now.getFullYear())

  const { data: monthly } = useQuery({
    queryKey: ['monthly-report', month, year],
    queryFn: async () => (await reportsAPI.monthly({ month, year })).data,
  })

  const downloadExcel = async (type) => {
    try {
      const res = await reportsAPI.exportExcel({ type, month, year })
      const url = window.URL.createObjectURL(new Blob([res.data]))
      const a = document.createElement('a')
      a.href = url
      a.download = `${type}_report_${month}_${year}.xlsx`
      a.click()
      toast.success(`${type} report downloaded!`)
    } catch {
      toast.error('Export failed')
    }
  }

  const topEmployees = monthly?.production?.by_employee || []

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reports</h1>
          <p className="text-gray-500 text-sm">Generate and export reports</p>
        </div>
        <div className="flex gap-3">
          <select value={month} onChange={e => setMonth(Number(e.target.value))} className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white">
            {Array.from({length:12},(_,i)=><option key={i+1} value={i+1}>{new Date(2024,i).toLocaleString('default',{month:'long'})}</option>)}
          </select>
          <select value={year} onChange={e => setYear(Number(e.target.value))} className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white">
            {[2023,2024,2025,2026].map(y=><option key={y} value={y}>{y}</option>)}
          </select>
        </div>
      </div>

      {/* Export Buttons */}
      <div className="card">
        <h3 className="font-semibold text-gray-900 mb-4">Export Reports</h3>
        <div className="flex gap-3 flex-wrap">
          {['production', 'salary', 'attendance'].map(type => (
            <button
              key={type}
              onClick={() => downloadExcel(type)}
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm font-medium capitalize"
            >
              <FiDownload size={16} className="text-green-600" />
              {type} Report (Excel)
            </button>
          ))}
        </div>
      </div>

      {/* Monthly Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <h3 className="font-semibold text-gray-900 mb-4">Monthly Production Summary</h3>
          <div className="space-y-3">
            <div className="flex justify-between py-2 border-b border-gray-50">
              <span className="text-gray-500">Total Meters</span>
              <strong>{monthly?.production?.total_meters?.toFixed(2) || 0} m</strong>
            </div>
            <div className="flex justify-between py-2 border-b border-gray-50">
              <span className="text-gray-500">Days Present (Total)</span>
              <strong>{monthly?.attendance?.present_count || 0}</strong>
            </div>
            <div className="flex justify-between py-2 border-b border-gray-50">
              <span className="text-gray-500">Days Absent (Total)</span>
              <strong className="text-red-600">{monthly?.attendance?.absent_count || 0}</strong>
            </div>
          </div>
        </div>

        <div className="card">
          <h3 className="font-semibold text-gray-900 mb-4">Monthly Salary Summary</h3>
          <div className="space-y-3">
            <div className="flex justify-between py-2 border-b border-gray-50">
              <span className="text-gray-500">Total Payroll</span>
              <strong>₹{monthly?.salary?.total?.toFixed(0) || 0}</strong>
            </div>
            <div className="flex justify-between py-2 border-b border-gray-50">
              <span className="text-gray-500">Paid</span>
              <strong className="text-green-600">₹{monthly?.salary?.paid?.toFixed(0) || 0}</strong>
            </div>
            <div className="flex justify-between py-2 border-b border-gray-50">
              <span className="text-gray-500">Pending</span>
              <strong className="text-yellow-600">₹{monthly?.salary?.pending?.toFixed(0) || 0}</strong>
            </div>
          </div>
        </div>
      </div>

      {/* Employee Performance Table */}
      <div className="card">
        <h3 className="font-semibold text-gray-900 mb-4">Employee Performance — {new Date(year, month-1).toLocaleString('default', {month:'long'})} {year}</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">Emp ID</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">Name</th>
                <th className="px-4 py-3 text-right font-semibold text-gray-600">Meters Woven</th>
                <th className="px-4 py-3 text-right font-semibold text-gray-600">Working Days</th>
                <th className="px-4 py-3 text-right font-semibold text-gray-600">Avg/Day</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {topEmployees.map((row, i) => (
                <tr key={i} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-gray-500">{row.employee__employee_id}</td>
                  <td className="px-4 py-3 font-medium">{row.employee__name}</td>
                  <td className="px-4 py-3 text-right font-semibold text-blue-700">{parseFloat(row.meters).toFixed(2)} m</td>
                  <td className="px-4 py-3 text-right">{row.days}</td>
                  <td className="px-4 py-3 text-right text-gray-600">{row.days > 0 ? (parseFloat(row.meters)/row.days).toFixed(2) : 0} m</td>
                </tr>
              ))}
              {topEmployees.length === 0 && (
                <tr><td colSpan={5} className="text-center py-8 text-gray-400">No data for this period</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
