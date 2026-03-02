import { NavLink } from 'react-router-dom'
import {
  FiGrid, FiUsers, FiCalendar, FiActivity,
  FiDollarSign, FiFileText, FiSettings
} from 'react-icons/fi'
import { useAuthStore } from '../../store/authStore'

const navItems = [
  { to: '/dashboard', icon: FiGrid, label: 'Dashboard' },
  { to: '/employees', icon: FiUsers, label: 'Employees' },
  { to: '/attendance', icon: FiCalendar, label: 'Attendance' },
  { to: '/production', icon: FiActivity, label: 'Production' },
  { to: '/salary', icon: FiDollarSign, label: 'Salary' },
  { to: '/reports', icon: FiFileText, label: 'Reports' },
]

export default function Sidebar() {
  const { user } = useAuthStore()
  return (
    <aside className="w-64 bg-primary-900 text-white flex flex-col">
      <div className="px-6 py-5 border-b border-primary-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-weaver-gold rounded-lg flex items-center justify-center text-xl font-bold text-white">W</div>
          <div>
            <h1 className="font-bold text-sm">Weaver Tracking</h1>
            <p className="text-xs text-primary-300">Management System</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 px-4 py-4 space-y-1">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-primary-700 text-white'
                  : 'text-primary-200 hover:bg-primary-800 hover:text-white'
              }`
            }
          >
            <Icon size={18} />
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="px-4 py-4 border-t border-primary-800">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-primary-700 rounded-full flex items-center justify-center text-xs font-bold">
            {user?.username?.[0]?.toUpperCase()}
          </div>
          <div>
            <p className="text-sm font-medium">{user?.username}</p>
            <p className="text-xs text-primary-300 capitalize">{user?.role}</p>
          </div>
        </div>
      </div>
    </aside>
  )
}
