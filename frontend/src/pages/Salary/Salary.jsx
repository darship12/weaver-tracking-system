import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { format } from 'date-fns'
import toast from 'react-hot-toast'
import { salaryAPI } from '../../services/api'
import Table from '../../components/common/Table'

export default function Salary() {
  const now = new Date()
  const [month, setMonth] = useState(now.getMonth() + 1)
  const [year, setYear] = useState(now.getFullYear())
  const qc = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['salary', month, year],
    queryFn: async () => (await salaryAPI.list({ month, year })).data,
  })

  const calcMutation = useMutation({
    mutationFn: () => salaryAPI.calculate({ month, year }),
    onSuccess: (res) => {
      toast.success(`Calculated for ${res.data.calculated} employees`)
      qc.invalidateQueries({ queryKey: ['salary'] })
    },
    onError: () => toast.error('Calculation failed'),
  })

  const markPaidMutation = useMutation({
    mutationFn: ({ id }) => salaryAPI.update(id, { status: 'paid', payment_date: format(new Date(), 'yyyy-MM-dd') }),
    onSuccess: () => {
      toast.success('Marked as paid')
      qc.invalidateQueries({ queryKey: ['salary'] })
    },
  })

  const records = data?.results || data || []
  const totalSalary = records.reduce((sum, r) => sum + parseFloat(r.total_salary || 0), 0)
  const paidSalary = records.filter(r => r.status === 'paid').reduce((sum, r) => sum + parseFloat(r.total_salary || 0), 0)

  const columns = [
    { key: 'employee_id_code', header: 'Emp ID' },
    { key: 'employee_name', header: 'Name' },
    { key: 'total_meters', header: 'Meters', render: r => `${parseFloat(r.total_meters).toFixed(2)} m` },
    { key: 'rate_per_meter', header: 'Rate', render: r => `₹${r.rate_per_meter}` },
    { key: 'base_salary', header: 'Base', render: r => `₹${parseFloat(r.base_salary).toFixed(0)}` },
    { key: 'bonus', header: 'Bonus', render: r => `₹${r.bonus}` },
    { key: 'deductions', header: 'Deductions', render: r => `₹${r.deductions}` },
    { key: 'total_salary', header: 'Total', render: r => <strong className="text-green-700">₹{parseFloat(r.total_salary).toFixed(0)}</strong> },
    { key: 'status', header: 'Status', render: r => (
      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${r.status === 'paid' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
        {r.status}
      </span>
    )},
    { key: 'actions', header: '', render: r => r.status === 'pending' ? (
      <button onClick={() => markPaidMutation.mutate({ id: r.id })} className="text-xs text-blue-600 hover:underline">Mark Paid</button>
    ) : null},
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Salary Management</h1>
          <p className="text-gray-500 text-sm">Auto-calculate based on meters woven</p>
        </div>
        <div className="flex gap-3 items-center">
          <select value={month} onChange={e => setMonth(Number(e.target.value))} className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white">
            {Array.from({length: 12}, (_, i) => <option key={i+1} value={i+1}>{new Date(2024, i).toLocaleString('default', {month:'long'})}</option>)}
          </select>
          <select value={year} onChange={e => setYear(Number(e.target.value))} className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white">
            {[2023,2024,2025,2026].map(y => <option key={y} value={y}>{y}</option>)}
          </select>
          <button onClick={() => calcMutation.mutate()} disabled={calcMutation.isPending} className="btn-primary">
            {calcMutation.isPending ? 'Calculating...' : 'Calculate Salaries'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="card text-center">
          <p className="text-2xl font-bold text-gray-900">₹{totalSalary.toFixed(0)}</p>
          <p className="text-sm text-gray-500 mt-1">Total Payroll</p>
        </div>
        <div className="card text-center">
          <p className="text-2xl font-bold text-green-600">₹{paidSalary.toFixed(0)}</p>
          <p className="text-sm text-gray-500 mt-1">Paid</p>
        </div>
        <div className="card text-center">
          <p className="text-2xl font-bold text-yellow-600">₹{(totalSalary - paidSalary).toFixed(0)}</p>
          <p className="text-sm text-gray-500 mt-1">Pending</p>
        </div>
      </div>

      <div className="card">
        <h3 className="font-semibold text-gray-900 mb-4">Salary Records — {new Date(year, month-1).toLocaleString('default', {month:'long'})} {year}</h3>
        <Table columns={columns} data={records} loading={isLoading} emptyMessage="No salary records. Click Calculate Salaries." />
      </div>
    </div>
  )
}
