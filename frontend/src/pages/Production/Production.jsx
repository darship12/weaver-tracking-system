import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { FiPlus, FiTrash2 } from 'react-icons/fi'
import { format } from 'date-fns'
import toast from 'react-hot-toast'
import { productionAPI, employeeAPI } from '../../services/api'
import Table from '../../components/common/Table'
import Modal from '../../components/common/Modal'

export default function Production() {
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [isModalOpen, setModalOpen] = useState(false)
  const qc = useQueryClient()
  const { register, handleSubmit, reset } = useForm()

  const { data: employees } = useQuery({
    queryKey: ['employees-all'],
    queryFn: async () => (await employeeAPI.list({ status: 'active' })).data,
  })

  const { data: productions, isLoading } = useQuery({
    queryKey: ['production', date],
    queryFn: async () => (await productionAPI.list({ date })).data,
  })

  const createMutation = useMutation({
    mutationFn: productionAPI.create,
    onSuccess: () => {
      toast.success('Production record added!')
      qc.invalidateQueries({ queryKey: ['production'] })
      qc.invalidateQueries({ queryKey: ['production-dashboard'] })
      setModalOpen(false)
      reset()
    },
    onError: (err) => toast.error(err.response?.data?.detail || 'Error saving'),
  })

  const deleteMutation = useMutation({
    mutationFn: productionAPI.delete,
    onSuccess: () => {
      toast.success('Record deleted')
      qc.invalidateQueries({ queryKey: ['production'] })
    },
  })

  const empList = employees?.results || employees || []
  const records = productions?.results || productions || []

  const columns = [
    { key: 'employee_id_code', header: 'Emp ID' },
    { key: 'employee_name', header: 'Name' },
    { key: 'loom_number', header: 'Loom' },
    { key: 'design', header: 'Design' },
    { key: 'meter_woven', header: 'Meters (m)' },
    { key: 'defects', header: 'Defects' },
    { key: 'work_hours', header: 'Hours' },
    { key: 'quality', header: 'Quality', render: (r) => (
      <span className={`px-2 py-0.5 rounded-full text-xs ${r.quality === 'good' ? 'bg-green-100 text-green-700' : r.quality === 'average' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>
        {r.quality}
      </span>
    )},
    { key: 'actions', header: '', render: (r) => (
      <button onClick={() => { if (confirm('Delete?')) deleteMutation.mutate(r.id) }} className="p-1.5 rounded-lg hover:bg-red-50 text-red-600">
        <FiTrash2 size={14} />
      </button>
    )},
  ]

  const todayTotal = records.reduce((sum, r) => sum + parseFloat(r.meter_woven || 0), 0)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Production</h1>
          <p className="text-gray-500 text-sm">Total today: <strong>{todayTotal.toFixed(2)} meters</strong></p>
        </div>
        <div className="flex gap-3">
          <input
            type="date"
            value={date}
            onChange={e => setDate(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-primary-500"
          />
          <button onClick={() => { reset({ date }); setModalOpen(true) }} className="btn-primary flex items-center gap-2">
            <FiPlus size={16} /> Add Record
          </button>
        </div>
      </div>

      <div className="card">
        <Table columns={columns} data={records} loading={isLoading} emptyMessage="No production records for this date" />
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setModalOpen(false)} title="Add Production Record" size="lg">
        <form onSubmit={handleSubmit(createMutation.mutate)} className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Employee *</label>
            <select {...register('employee', { required: true })} className="border border-gray-300 rounded-lg px-3 py-2 text-sm w-full bg-white focus:border-primary-500 outline-none">
              <option value="">Select employee</option>
              {empList.map(e => <option key={e.id} value={e.id}>{e.employee_id} - {e.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date *</label>
            <input type="date" {...register('date', { required: true })} defaultValue={date} className="border border-gray-300 rounded-lg px-3 py-2 text-sm w-full focus:border-primary-500 outline-none" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Loom Number *</label>
            <input {...register('loom_number', { required: true })} className="border border-gray-300 rounded-lg px-3 py-2 text-sm w-full focus:border-primary-500 outline-none" placeholder="L001" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Design *</label>
            <input {...register('design', { required: true })} className="border border-gray-300 rounded-lg px-3 py-2 text-sm w-full focus:border-primary-500 outline-none" placeholder="Patola" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Meters Woven *</label>
            <input type="number" step="0.01" {...register('meter_woven', { required: true })} className="border border-gray-300 rounded-lg px-3 py-2 text-sm w-full focus:border-primary-500 outline-none" placeholder="25.5" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Defects</label>
            <input type="number" {...register('defects')} defaultValue="0" className="border border-gray-300 rounded-lg px-3 py-2 text-sm w-full focus:border-primary-500 outline-none" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Work Hours</label>
            <input type="number" step="0.5" {...register('work_hours')} defaultValue="8" className="border border-gray-300 rounded-lg px-3 py-2 text-sm w-full focus:border-primary-500 outline-none" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Quality</label>
            <select {...register('quality')} className="border border-gray-300 rounded-lg px-3 py-2 text-sm w-full bg-white focus:border-primary-500 outline-none">
              <option value="good">Good</option>
              <option value="average">Average</option>
              <option value="defective">Defective</option>
            </select>
          </div>
          <div className="col-span-2 flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setModalOpen(false)} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={createMutation.isPending} className="btn-primary">
              {createMutation.isPending ? 'Saving...' : 'Add Record'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
