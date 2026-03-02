import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { FiPlus, FiEdit2, FiTrash2, FiSearch } from 'react-icons/fi'
import toast from 'react-hot-toast'
import { employeeAPI } from '../../services/api'
import Table from '../../components/common/Table'
import Modal from '../../components/common/Modal'

const skillColors = { expert: 'badge-active', intermediate: 'bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full text-xs', beginner: 'bg-gray-100 text-gray-700 px-2 py-0.5 rounded-full text-xs' }

export default function Employees() {
  const [search, setSearch] = useState('')
  const [isModalOpen, setModalOpen] = useState(false)
  const [editEmployee, setEditEmployee] = useState(null)
  const qc = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['employees', search],
    queryFn: async () => (await employeeAPI.list({ search })).data,
  })

  const { data: statsData } = useQuery({
    queryKey: ['employee-stats'],
    queryFn: async () => (await employeeAPI.stats()).data,
  })

  const { register, handleSubmit, reset, formState: { errors } } = useForm()

  const createMutation = useMutation({
    mutationFn: (data) => editEmployee ? employeeAPI.update(editEmployee.id, data) : employeeAPI.create(data),
    onSuccess: () => {
      toast.success(editEmployee ? 'Employee updated!' : 'Employee created!')
      qc.invalidateQueries({ queryKey: ['employees'] })
      qc.invalidateQueries({ queryKey: ['employee-stats'] })
      setModalOpen(false)
      reset()
      setEditEmployee(null)
    },
    onError: (err) => toast.error(err.response?.data?.detail || 'Error saving employee'),
  })

  const deleteMutation = useMutation({
    mutationFn: employeeAPI.delete,
    onSuccess: () => {
      toast.success('Employee deleted')
      qc.invalidateQueries({ queryKey: ['employees'] })
    },
  })

  const openEdit = (emp) => {
    setEditEmployee(emp)
    reset(emp)
    setModalOpen(true)
  }

  const columns = [
    { key: 'employee_id', header: 'ID' },
    { key: 'name', header: 'Name' },
    { key: 'phone', header: 'Phone' },
    { key: 'skill_level', header: 'Skill', render: (r) => <span className={skillColors[r.skill_level]}>{r.skill_level}</span> },
    { key: 'salary_rate', header: 'Rate/m', render: (r) => `₹${r.salary_rate}` },
    { key: 'joining_date', header: 'Joining' },
    { key: 'status', header: 'Status', render: (r) => <span className={r.status === 'active' ? 'badge-active' : 'badge-inactive'}>{r.status}</span> },
    { key: 'actions', header: '', render: (r) => (
      <div className="flex gap-2">
        <button onClick={() => openEdit(r)} className="p-1.5 rounded-lg hover:bg-blue-50 text-blue-600"><FiEdit2 size={14} /></button>
        <button onClick={() => { if (confirm('Delete this employee?')) deleteMutation.mutate(r.id) }} className="p-1.5 rounded-lg hover:bg-red-50 text-red-600"><FiTrash2 size={14} /></button>
      </div>
    )},
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Employees</h1>
          <p className="text-gray-500 text-sm">Total: {statsData?.total || 0} | Active: {statsData?.active || 0}</p>
        </div>
        <button onClick={() => { setEditEmployee(null); reset({}); setModalOpen(true) }} className="btn-primary flex items-center gap-2">
          <FiPlus size={16} /> Add Employee
        </button>
      </div>

      <div className="card">
        <div className="flex gap-4 mb-4">
          <div className="relative flex-1">
            <FiSearch className="absolute left-3 top-2.5 text-gray-400" size={16} />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by name, ID, or phone..."
              className="pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm w-full outline-none focus:border-primary-500"
            />
          </div>
        </div>
        <Table columns={columns} data={data?.results || data || []} loading={isLoading} />
      </div>

      <Modal isOpen={isModalOpen} onClose={() => { setModalOpen(false); setEditEmployee(null); reset() }} title={editEmployee ? 'Edit Employee' : 'Add Employee'} size="lg">
        <form onSubmit={handleSubmit(createMutation.mutate)} className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Employee ID *</label>
            <input {...register('employee_id', { required: true })} className="border border-gray-300 rounded-lg px-3 py-2 text-sm w-full focus:border-primary-500 outline-none" placeholder="EMP001" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
            <input {...register('name', { required: true })} className="border border-gray-300 rounded-lg px-3 py-2 text-sm w-full focus:border-primary-500 outline-none" placeholder="Ramesh Kumar" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Phone *</label>
            <input {...register('phone', { required: true })} className="border border-gray-300 rounded-lg px-3 py-2 text-sm w-full focus:border-primary-500 outline-none" placeholder="9876543210" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Joining Date *</label>
            <input type="date" {...register('joining_date', { required: true })} className="border border-gray-300 rounded-lg px-3 py-2 text-sm w-full focus:border-primary-500 outline-none" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Skill Level</label>
            <select {...register('skill_level')} className="border border-gray-300 rounded-lg px-3 py-2 text-sm w-full bg-white focus:border-primary-500 outline-none">
              <option value="beginner">Beginner</option>
              <option value="intermediate">Intermediate</option>
              <option value="expert">Expert</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Rate per Meter (₹)</label>
            <input type="number" step="0.01" {...register('salary_rate')} className="border border-gray-300 rounded-lg px-3 py-2 text-sm w-full focus:border-primary-500 outline-none" placeholder="10.00" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select {...register('status')} className="border border-gray-300 rounded-lg px-3 py-2 text-sm w-full bg-white focus:border-primary-500 outline-none">
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="terminated">Terminated</option>
            </select>
          </div>
          <div className="col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
            <textarea {...register('address')} rows={2} className="border border-gray-300 rounded-lg px-3 py-2 text-sm w-full focus:border-primary-500 outline-none" placeholder="Address" />
          </div>
          <div className="col-span-2 flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setModalOpen(false)} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={createMutation.isPending} className="btn-primary">
              {createMutation.isPending ? 'Saving...' : editEmployee ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
