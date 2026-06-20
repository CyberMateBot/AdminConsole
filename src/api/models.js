import { apiClient } from './client'

export const modelsApi = {
  list: () => apiClient.get('/admin/models').then(r => r.data),
  update: (id, payload) => apiClient.patch(`/admin/models/${id}`, payload).then(r => r.data),
}
