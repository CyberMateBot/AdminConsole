import { apiClient } from './client'

export const settingsApi = {
  get: () => apiClient.get('/admin/settings').then(r => r.data),
  update: (payload) => apiClient.put('/admin/settings', payload).then(r => r.data),
}
