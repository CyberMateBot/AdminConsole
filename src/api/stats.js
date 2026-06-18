import { apiClient } from './client'

export const statsApi = {
  get: () => apiClient.get('/admin/stats').then(r => r.data),
}
