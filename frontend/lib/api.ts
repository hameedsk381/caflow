import axios from 'axios'
import { getToken, clearToken } from './auth'

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

const api = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' },
})

// Attach JWT token to every request
api.interceptors.request.use((config) => {
  const token = getToken()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Handle 401 - clear token and redirect to login
api.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response?.status === 401) {
      clearToken()
      if (typeof window !== 'undefined') {
        window.location.href = '/login'
      }
    }
    return Promise.reject(error)
  }
)

export default api

// Auth
export const authApi = {
  register: (data: any) => api.post('/api/auth/register', data),
  login: (data: any) => api.post('/api/auth/login', data),
  me: () => api.get('/api/auth/me'),
  updateProfile: (data: any) => api.put('/api/auth/me', data),
  changePassword: (data: any) => api.post('/api/auth/change-password', data),
}

// Clients
export const clientsApi = {
  list: (params?: any) => api.get('/api/clients', { params }),
  get: (id: string) => api.get(`/api/clients/${id}`),
  create: (data: any) => api.post('/api/clients', data),
  update: (id: string, data: any) => api.put(`/api/clients/${id}`, data),
  delete: (id: string) => api.delete(`/api/clients/${id}`),
}

// Compliance
export const complianceApi = {
  list: (params?: any) => api.get('/api/compliance', { params }),
  get: (id: string) => api.get(`/api/compliance/${id}`),
  create: (data: any) => api.post('/api/compliance', data),
  update: (id: string, data: any) => api.put(`/api/compliance/${id}`, data),
  delete: (id: string) => api.delete(`/api/compliance/${id}`),
}

// Tasks
export const tasksApi = {
  list: (params?: any) => api.get('/api/tasks', { params }),
  get: (id: string) => api.get(`/api/tasks/${id}`),
  create: (data: any) => api.post('/api/tasks', data),
  update: (id: string, data: any) => api.put(`/api/tasks/${id}`, data),
  delete: (id: string) => api.delete(`/api/tasks/${id}`),
}

// Documents
export const documentsApi = {
  list: (params?: any) => api.get('/api/documents', { params }),
  upload: (formData: FormData) => api.post('/api/documents/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  delete: (id: string) => api.delete(`/api/documents/${id}`),
}

// Invoices
export const invoicesApi = {
  list: (params?: any) => api.get('/api/invoices', { params }),
  get: (id: string) => api.get(`/api/invoices/${id}`),
  create: (data: any) => api.post('/api/invoices', data),
  update: (id: string, data: any) => api.put(`/api/invoices/${id}`, data),
  delete: (id: string) => api.delete(`/api/invoices/${id}`),
}

// Notifications
export const notificationsApi = {
  list: (params?: any) => api.get('/api/notifications', { params }),
  markRead: (id: string) => api.put(`/api/notifications/${id}/read`),
  markAllRead: () => api.put('/api/notifications/read-all'),
}

// Team
export const teamApi = {
  list: () => api.get('/api/team'),
  invite: (data: any) => api.post('/api/team/invite', data),
  updateRole: (id: string, data: any) => api.put(`/api/team/${id}/role`, data),
  remove: (id: string) => api.delete(`/api/team/${id}`),
}

// Dashboard
export const dashboardApi = {
  stats: () => api.get('/api/dashboard/stats'),
  upcomingDeadlines: () => api.get('/api/dashboard/upcoming-deadlines'),
  complianceSummary: () => api.get('/api/dashboard/compliance-summary'),
  recentActivity: () => api.get('/api/dashboard/recent-activity'),
}

// Leads
export const leadsApi = {
  list: (params?: any) => api.get('/api/leads', { params }),
  get: (id: string) => api.get(`/api/leads/${id}`),
  create: (data: any) => api.post('/api/leads', data),
  update: (id: string, data: any) => api.put(`/api/leads/${id}`, data),
  delete: (id: string) => api.delete(`/api/leads/${id}`),
}

// Services
export const servicesApi = {
  list: (params?: any) => api.get('/api/services', { params }),
  get: (id: string) => api.get(`/api/services/${id}`),
  create: (data: any) => api.post('/api/services', data),
  update: (id: string, data: any) => api.put(`/api/services/${id}`, data),
  delete: (id: string) => api.delete(`/api/services/${id}`),
}

// Notices
export const noticesApi = {
  list: (params?: any) => api.get('/api/notices', { params }),
  get: (id: string) => api.get(`/api/notices/${id}`),
  create: (data: any) => api.post('/api/notices', data),
  update: (id: string, data: any) => api.put(`/api/notices/${id}`, data),
  delete: (id: string) => api.delete(`/api/notices/${id}`),
}

// Registers
export const registersApi = {
  list: (params?: any) => api.get('/api/registers', { params }),
  get: (id: string) => api.get(`/api/registers/${id}`),
  create: (data: any) => api.post('/api/registers', data),
  update: (id: string, data: any) => api.put(`/api/registers/${id}`, data),
  delete: (id: string) => api.delete(`/api/registers/${id}`),
}
