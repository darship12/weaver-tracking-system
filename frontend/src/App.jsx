import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from './store/authStore'
import Layout from './components/layout/Layout'
import Login from './pages/Login/Login'
import Dashboard from './pages/Dashboard/Dashboard'
import Employees from './pages/Employee/Employees'
import Attendance from './pages/Attendance/Attendance'
import Production from './pages/Production/Production'
import Salary from './pages/Salary/Salary'
import Reports from './pages/Reports/Reports'

function PrivateRoute({ children }) {
  const { token } = useAuthStore()
  return token ? children : <Navigate to="/login" replace />
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/" element={<PrivateRoute><Layout /></PrivateRoute>}>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="employees" element={<Employees />} />
        <Route path="attendance" element={<Attendance />} />
        <Route path="production" element={<Production />} />
        <Route path="salary" element={<Salary />} />
        <Route path="reports" element={<Reports />} />
      </Route>
    </Routes>
  )
}
