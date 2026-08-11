import { apiClient } from './client'

export const authApi = {
  login: (email, password) =>
    apiClient.post('/admin/auth/login', { email, password }).then(r => r.data),

  logout: () => apiClient.post('/admin/auth/logout'),

  me: () => apiClient.get('/admin/auth/me').then(r => r.data),
}
