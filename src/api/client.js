import axios from 'axios'

function getApiBaseUrl() {
  // Production: same-origin /api proxied by scripts/server.mjs
  if (import.meta.env.PROD) return '/api'

  const runtime = window.__APP_CONFIG__?.apiBaseUrl?.trim?.()
  if (runtime) return `${runtime.replace(/\/$/, '')}/api`

  const buildTime = import.meta.env.VITE_API_BASE_URL?.trim?.()
    || import.meta.env.VITE_API_URL?.trim?.()
  if (buildTime) return `${buildTime.replace(/\/$/, '')}/api`

  return '/api'
}

export const apiClient = axios.create({
  baseURL: getApiBaseUrl(),
  headers: { 'Content-Type': 'application/json' },
  timeout: 15_000,
})

apiClient.interceptors.request.use((config) => {
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
