import { useNavigate } from 'react-router-dom'
import { FiBell, FiLogOut } from 'react-icons/fi'
import { useAuthStore } from '../../store/authStore'
import { authAPI } from '../../services/api'
import toast from 'react-hot-toast'

export default function Header() {
  const { user, refreshToken, logout } = useAuthStore()
  const navigate = useNavigate()

  const handleLogout = async () => {
    try {
      await authAPI.logout(refreshToken)
    } catch {}
    logout()
    navigate('/login')
    toast.success('Logged out successfully')
  }

  return (
    <header className="bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between">
      <div>
        <h2 className="text-base font-semibold text-gray-900">Welcome back, {user?.first_name || user?.username}!</h2>
        <p className="text-xs text-gray-400">{new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
      </div>
      <div className="flex items-center gap-3">
        <button className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 relative">
          <FiBell size={20} />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
        </button>
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-red-50 text-gray-600 hover:text-red-600 text-sm transition-colors"
        >
          <FiLogOut size={16} />
          Logout
        </button>
      </div>
    </header>
  )
}
