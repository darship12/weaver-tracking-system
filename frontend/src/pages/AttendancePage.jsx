import React, { useEffect, useState } from 'react';
import { attendanceAPI, employeeAPI } from '../services/api';
import { Table, Badge, Button, PageHeader, StatCard } from '../components/common';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

const STATUS_COLORS = { present: 'green', absent: 'red', half_day: 'yellow', leave: 'blue', not_marked: 'gray' };

export default function AttendancePage() {
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [employees, setEmployees] = useState([]);
  const [attendance, setAttendance] = useState({});
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const [empRes, attRes, sumRes] = await Promise.all([
        employeeAPI.list({ status: 'active', page_size: 100 }),
        attendanceAPI.list({ date }),
        attendanceAPI.summary(date),
      ]);
      const emps = empRes.data.results || empRes.data;
      setEmployees(emps);
      setSummary(sumRes.data);
      // Build attendance map
      const attMap = {};
      const records = attRes.data.results || attRes.data;
      records.forEach(r => { attMap[r.employee] = r.status; });
      setAttendance(attMap);
    } catch {
      toast.error('Failed to load attendance');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [date]);

  const handleStatusChange = (empId, status) => {
    setAttendance(prev => ({ ...prev, [empId]: status }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const records = employees.map(emp => ({
        employee_id: emp.id,
        status: attendance[emp.id] || 'absent',
      }));
      await attendanceAPI.bulkCreate({ date, records });
      toast.success('Attendance saved!');
      load();
    } catch {
      toast.error('Failed to save attendance');
    } finally {
      setSaving(false);
    }
  };

  const markAll = (status) => {
    const map = {};
    employees.forEach(emp => { map[emp.id] = status; });
    setAttendance(map);
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Attendance Management" subtitle="Track daily employee attendance">
        <div className="flex items-center gap-3">
          <input
            type="date"
            value={date}
            onChange={e => setDate(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
          />
          <Button onClick={handleSave} loading={saving}>Save Attendance</Button>
        </div>
      </PageHeader>

      {/* Summary */}
      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard title="Total" value={summary.total_employees} icon="👷" color="blue" />
          <StatCard title="Present" value={summary.present} icon="✅" color="green" />
          <StatCard title="Absent" value={summary.absent} icon="❌" color="red" />
          <StatCard title="Not Marked" value={summary.not_marked} icon="⚠️" color="orange" />
        </div>
      )}

      {/* Quick Mark Buttons */}
      <div className="bg-white rounded-xl border shadow-sm p-4">
        <div className="flex flex-wrap gap-2 items-center">
          <span className="text-sm font-medium text-gray-600">Mark All:</span>
          {['present', 'absent', 'half_day', 'leave'].map(s => (
            <button
              key={s}
              onClick={() => markAll(s)}
              className="px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors hover:bg-gray-50 capitalize"
            >
              {s.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Attendance Grid */}
      {loading ? (
        <div className="flex justify-center p-12">
          <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
        </div>
      ) : (
        <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">Employee</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">ID</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">Skill</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">Status</th>
              </tr>
            </thead>
            <tbody>
              {employees.map(emp => (
                <tr key={emp.id} className="border-b hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-800">{emp.name}</td>
                  <td className="px-4 py-3 text-gray-500">{emp.employee_id}</td>
                  <td className="px-4 py-3">
                    <Badge color={{ beginner: 'blue', intermediate: 'purple', expert: 'orange' }[emp.skill_level]}>
                      {emp.skill_level}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2 flex-wrap">
                      {['present', 'absent', 'half_day', 'leave'].map(s => (
                        <button
                          key={s}
                          onClick={() => handleStatusChange(emp.id, s)}
                          className={`px-3 py-1 rounded-full text-xs font-medium transition-all border ${
                            attendance[emp.id] === s
                              ? s === 'present' ? 'bg-green-500 text-white border-green-500'
                                : s === 'absent' ? 'bg-red-500 text-white border-red-500'
                                : s === 'half_day' ? 'bg-yellow-500 text-white border-yellow-500'
                                : 'bg-blue-500 text-white border-blue-500'
                              : 'bg-white text-gray-500 border-gray-200 hover:border-gray-400'
                          }`}
                        >
                          {s.replace('_', ' ')}
                        </button>
                      ))}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
