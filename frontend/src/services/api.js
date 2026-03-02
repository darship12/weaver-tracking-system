import axios from 'axios'
import { useAuthStore } from '../store/authStore'

const API_URL = import.meta.env.VITE_API_URL || '/api'

const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
})

api.interceptors.request.use((config) => {
  const { token } = useAuthStore.getState()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      const { refreshToken, setAuth, logout } = useAuthStore.getState()
      if (refreshToken) {
        try {
          const res = await axios.post(`${API_URL}/auth/token/refresh/`, { refresh: refreshToken })
          setAuth(res.data.access, refreshToken, useAuthStore.getState().user)
          error.config.headers.Authorization = `Bearer ${res.data.access}`
          return axios(error.config)
        } catch {
          logout()
          window.location.href = '/login'
        }
      }
    }
    return Promise.reject(error)
  }
)

export default api

export const authAPI = {
  login: (credentials) => api.post('/auth/login/', credentials),
  logout: (refresh) => api.post('/auth/logout/', { refresh }),
  profile: () => api.get('/auth/profile/'),
}

export const employeeAPI = {
  list: (params) => api.get('/employees/', { params }),
  create: (data) => api.post('/employees/', data),
  get: (id) => api.get(`/employees/${id}/`),
  update: (id, data) => api.put(`/employees/${id}/`, data),
  delete: (id) => api.delete(`/employees/${id}/`),
  stats: () => api.get('/employees/stats/'),
}

export const attendanceAPI = {
  list: (params) => api.get('/attendance/', { params }),
  create: (data) => api.post('/attendance/', data),
  update: (id, data) => api.put(`/attendance/${id}/`, data),
  today: () => api.get('/attendance/today/'),
  bulk: (data) => api.post('/attendance/bulk/', data),
}

export const productionAPI = {
  list: (params) => api.get('/production/', { params }),
  create: (data) => api.post('/production/', data),
  update: (id, data) => api.put(`/production/${id}/`, data),
  delete: (id) => api.delete(`/production/${id}/`),
  dashboard: () => api.get('/production/dashboard/'),
}

export const salaryAPI = {
  list: (params) => api.get('/salary/', { params }),
  calculate: (data) => api.post('/salary/calculate/', data),
  update: (id, data) => api.patch(`/salary/${id}/`, data),
}

export const reportsAPI = {
  dashboard: () => api.get('/reports/dashboard/'),
  daily: (params) => api.get('/reports/daily/', { params }),
  monthly: (params) => api.get('/reports/monthly/', { params }),
  exportExcel: (params) => api.get('/reports/export/excel/', { params, responseType: 'blob' }),
}
