import axios from 'axios'

function resolveApiBaseUrl() {
  const runtime = window.__APP_CONFIG__?.apiBaseUrl?.trim?.()
  if (runtime) return runtime.replace(/\/$/, '')
  const buildTime = import.meta.env.VITE_API_BASE_URL?.trim?.()
  if (buildTime) return buildTime.replace(/\/$/, '')
  return ''
}

function getApiBaseUrl() {
  const apiBase = resolveApiBaseUrl()
  return apiBase ? `${apiBase}/api` : '/api'
}

export const apiClient = axios.create({
  headers: { 'Content-Type': 'application/json' },
  timeout: 15_000,
})

apiClient.interceptors.request.use((config) => {
  config.baseURL = getApiBaseUrl()
  const token = localStorage.getItem('admin_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('admin_token')
      localStorage.removeItem('admin_user')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)
