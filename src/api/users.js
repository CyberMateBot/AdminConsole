import { apiClient } from './client'

export const usersApi = {
  list: (params) =>
    apiClient.get('/admin/users', { params }).then(r => r.data),

  getById: (id) =>
    apiClient.get(`/admin/users/${id}`).then(r => r.data),

  toggleActive: (id, is_active) =>
    apiClient.patch(`/admin/users/${id}`, { is_active }).then(r => r.data),

  delete: (id) => apiClient.delete(`/admin/users/${id}`),
}
