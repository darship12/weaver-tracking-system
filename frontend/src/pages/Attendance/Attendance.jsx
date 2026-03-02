import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { format } from 'date-fns'
import toast from 'react-hot-toast'
import { attendanceAPI, employeeAPI } from '../../services/api'
import Table from '../../components/common/Table'

const statusColors = {
  present: 'badge-present',
  absent: 'badge-absent',
  half_day: 'bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full text-xs',
  leave: 'bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full text-xs',
}

export default function Attendance() {
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'))
  const qc = useQueryClient()

  const { data: employees } = useQuery({
    queryKey: ['employees-all'],
    queryFn: async () => (await employeeAPI.list({ status: 'active' })).data,
  })

  const { data: attendanceData, isLoading } = useQuery({
    queryKey: ['attendance', date],
    queryFn: async () => (await attendanceAPI.list({ date })).data,
  })

  const { data: todayStats } = useQuery({
    queryKey: ['attendance-today'],
    queryFn: async () => (await attendanceAPI.today()).data,
    refetchInterval: 30000,
  })

  const bulkMutation = useMutation({
    mutationFn: attendanceAPI.bulk,
    onSuccess: () => {
      toast.success('Attendance saved!')
      qc.invalidateQueries({ queryKey: ['attendance'] })
      qc.invalidateQueries({ queryKey: ['attendance-today'] })
    },
    onError: () => toast.error('Failed to save attendance'),
  })

  const empList = employees?.results || employees || []
  const attRecords = attendanceData?.results || attendanceData || []

  const getStatus = (empId) => {
    const found = attRecords.find(a => a.employee === empId)
    return found?.status || 'absent'
  }

  const [localStatus, setLocalStatus] = useState({})

  const handleStatusChange = (empId, status) => {
    setLocalStatus(prev => ({ ...prev, [empId]: status }))
  }

  const saveAll = () => {
    const records = empList.map(emp => ({
      employee: emp.id,
      status: localStatus[emp.id] || getStatus(emp.id),
    }))
    bulkMutation.mutate({ date, records })
  }

  const columns = [
    { key: 'employee_id', header: 'ID' },
    { key: 'employee_name', header: 'Name', render: (r) => r.employee_name || r.name },
    { key: 'status', header: 'Status', render: (r) => <span className={statusColors[r.status]}>{r.status?.replace('_', ' ')}</span> },
    { key: 'check_in', header: 'Check In' },
    { key: 'check_out', header: 'Check Out' },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Attendance</h1>
          <p className="text-gray-500 text-sm">Mark and view daily attendance</p>
        </div>
        <div className="flex items-center gap-3">
          <input
            type="date"
            value={date}
            onChange={e => setDate(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-primary-500"
          />
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="card text-center">
          <p className="text-3xl font-bold text-green-600">{todayStats?.present || 0}</p>
          <p className="text-sm text-gray-500 mt-1">Present Today</p>
        </div>
        <div className="card text-center">
          <p className="text-3xl font-bold text-red-600">{todayStats?.absent || 0}</p>
          <p className="text-sm text-gray-500 mt-1">Absent Today</p>
        </div>
        <div className="card text-center">
          <p className="text-3xl font-bold text-blue-600">{todayStats?.total || 0}</p>
          <p className="text-sm text-gray-500 mt-1">Total Marked</p>
        </div>
      </div>

      {/* Bulk Attendance Marking */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-900">Mark Attendance for {date}</h3>
          <button onClick={saveAll} disabled={bulkMutation.isPending} className="btn-primary">
            {bulkMutation.isPending ? 'Saving...' : 'Save Attendance'}
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">ID</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">Name</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {empList.map(emp => (
                <tr key={emp.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-gray-500">{emp.employee_id}</td>
                  <td className="px-4 py-3 font-medium">{emp.name}</td>
                  <td className="px-4 py-3">
                    <select
                      value={localStatus[emp.id] || getStatus(emp.id)}
                      onChange={e => handleStatusChange(emp.id, e.target.value)}
                      className="border border-gray-300 rounded-lg px-2 py-1 text-sm bg-white"
                    >
                      <option value="present">Present</option>
                      <option value="absent">Absent</option>
                      <option value="half_day">Half Day</option>
                      <option value="leave">Leave</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Records */}
      <div className="card">
        <h3 className="font-semibold text-gray-900 mb-4">Attendance Records</h3>
        <Table columns={columns} data={attRecords} loading={isLoading} />
      </div>
    </div>
  )
}
